import { createClient } from '@supabase/supabase-js';
import { analyze } from './civic';
import { seeds } from './seed';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const realSupabase = url && key ? createClient(url, key) : null;

// Mock persistent authentication and issue store for browser environment when Supabase is not connected
const STORAGE_USER_KEY = 'civicpulse_auth_session';
const STORAGE_ISSUES_KEY = 'civicpulse_issues';
const STORAGE_VOTES_KEY = 'civicpulse_votes';

const authSubscribers = new Set();
function notifyAuth(event, session) {
  authSubscribers.forEach(cb => {
    try { cb(event, session); } catch (e) { console.error(e); }
  });
}

const mockAuth = {
  async getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      const session = raw ? JSON.parse(raw) : null;
      return { data: { session }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },
  onAuthStateChange(callback) {
    authSubscribers.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe() {
            authSubscribers.delete(callback);
          }
        }
      }
    };
  },
  async signInWithPassword({ email, password }) {
    if (!email || !password) throw new Error('Email and password are required.');
    const emailNorm = email.trim().toLowerCase();
    const isStaff = /staff|admin|gov|bikeesah30@gmail\.com/.test(emailNorm);
    const userId = 'usr_' + (typeof btoa !== 'undefined' ? btoa(emailNorm).replace(/=/g, '').slice(0, 16) : 'user123');
    
    const session = {
      access_token: 'mock-token-' + Date.now(),
      user: {
        id: userId,
        email: emailNorm,
        user_metadata: { role: isStaff ? 'staff' : 'citizen' }
      }
    };
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Could not save session to localStorage', e);
    }
    notifyAuth('SIGNED_IN', session);
    return { data: { session, user: session.user }, error: null };
  },
  async signUp({ email, password, options }) {
    return this.signInWithPassword({ email, password });
  },
  async resetPasswordForEmail(email) {
    return { data: {}, error: null };
  },
  async updateUser({ password }) {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return { data: { user: session?.user }, error: null };
  },
  async signOut() {
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch (e) {
      console.warn('Could not clear session from localStorage', e);
    }
    notifyAuth('SIGNED_OUT', null);
    return { error: null };
  }
};

export const supabase = realSupabase || { auth: mockAuth };
export const isRealBackend = !!realSupabase;

function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

let currentId = null;
export function setCurrentId(id) {
  currentId = id;
}

function getStoredIssues() {
  try {
    const raw = localStorage.getItem(STORAGE_ISSUES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = seeds();
  try { localStorage.setItem(STORAGE_ISSUES_KEY, JSON.stringify(initial)); } catch {}
  return initial;
}

function saveStoredIssues(issues) {
  try { localStorage.setItem(STORAGE_ISSUES_KEY, JSON.stringify(issues)); } catch {}
}

export async function loadIssues() {
  if (realSupabase) {
    const data = unwrap(await realSupabase.from('cp_issues').select('*,cp_votes(user_id),cp_events(*)').order('created_at', { ascending: false }));
    return data.map(({ cp_votes, cp_events, ...issue }) => ({
      ...issue,
      support_count: cp_votes.length,
      supported: cp_votes.some(v => v.user_id === currentId),
      events: cp_events.sort((a, b) => a.created_at.localeCompare(b.created_at))
    }));
  }

  // Local persistent mock store
  const stored = getStoredIssues();
  let votes = {};
  try { votes = JSON.parse(localStorage.getItem(STORAGE_VOTES_KEY) || '{}'); } catch {}
  return stored.map(issue => {
    const issueVotes = votes[issue.id] || [];
    return {
      ...issue,
      support_count: (issue.support_count_base || 0) + issueVotes.length,
      supported: currentId ? issueVotes.includes(currentId) : false,
      events: issue.events || []
    };
  });
}

export async function role() {
  if (realSupabase) return unwrap(await realSupabase.rpc('cp_current_role'));
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    const session = raw ? JSON.parse(raw) : null;
    const email = session?.user?.email || '';
    if (/staff|admin|gov|bikeesah30@gmail\.com/.test(email.toLowerCase())) {
      return 'staff';
    }
  } catch {}
  return 'citizen';
}

export async function upload(file) {
  if (!file) return null;
  if (file.size > 4 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image under 4 MB.');
  }

  if (realSupabase) {
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const path = `${currentId}/${crypto.randomUUID()}.${extension}`;
    unwrap(await realSupabase.storage.from('civic-evidence').upload(path, file, { contentType: file.type, upsert: false }));
    return path;
  }

  // Convert to Base64 Data URL for in-browser persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  if (realSupabase) {
    return unwrap(await realSupabase.storage.from('civic-evidence').createSignedUrl(path, 600)).signedUrl;
  }
  return path;
}

export async function submit(report, file) {
  const photo_path = await upload(file);
  const { title, description, category, severity, locality, lat, lng } = report;

  if (realSupabase) {
    try {
      return unwrap(await realSupabase.from('cp_issues').insert({
        title, description, category, severity, locality,
        lat: Number(lat), lng: Number(lng), photo_path, reporter_id: currentId
      }).select().single());
    } catch (error) {
      if (photo_path) await realSupabase.storage.from('civic-evidence').remove([photo_path]);
      throw error;
    }
  }

  // Local persistent mock store
  const scored = analyze({ title, description, category, severity });
  const newIssue = {
    id: `issue-${crypto.randomUUID().slice(0, 8)}`,
    title,
    description,
    category: scored.category,
    severity,
    locality,
    lat: Number(lat),
    lng: Number(lng),
    photo_path,
    reporter_id: currentId || 'anon-user',
    status: 'Reported',
    score: scored.score,
    priority: scored.priority,
    department: scored.department,
    reasons: scored.reasons,
    support_count_base: 0,
    created_at: new Date().toISOString(),
    events: [
      { status: 'Reported', note: 'Issue submitted by community member.', created_at: new Date().toISOString() }
    ]
  };

  const list = getStoredIssues();
  list.unshift(newIssue);
  saveStoredIssues(list);
  return newIssue;
}

export async function transition(issue, status, note, file, rating) {
  const resolution_photo_path = file ? await upload(file) : issue.resolution_photo_path;

  if (realSupabase) {
    const update = { status, action_note: note };
    if (file) update.resolution_photo_path = resolution_photo_path;
    if (status === 'Awaiting confirmation') update.resolution_note = note;
    if (status === 'Resolved') update.rating = Number(rating);
    try {
      return unwrap(await realSupabase.from('cp_issues').update(update).eq('id', issue.id).select().single());
    } catch (error) {
      if (file && resolution_photo_path) await realSupabase.storage.from('civic-evidence').remove([resolution_photo_path]);
      throw error;
    }
  }

  // Local persistent mock store
  const list = getStoredIssues();
  const index = list.findIndex(i => i.id === issue.id);
  if (index !== -1) {
    const existing = list[index];
    const updated = {
      ...existing,
      status,
      resolution_note: status === 'Awaiting confirmation' ? note : existing.resolution_note,
      resolution_photo_path: resolution_photo_path || existing.resolution_photo_path,
      rating: status === 'Resolved' ? Number(rating) : existing.rating,
      events: [
        ...(existing.events || []),
        { status, note, created_at: new Date().toISOString() }
      ]
    };
    list[index] = updated;
    saveStoredIssues(list);
    return updated;
  }
  return issue;
}

export async function support(issue, userId) {
  if (realSupabase) {
    if (issue.supported) {
      unwrap(await realSupabase.from('cp_votes').delete().eq('issue_id', issue.id).eq('user_id', userId));
    } else {
      unwrap(await realSupabase.from('cp_votes').insert({ issue_id: issue.id, user_id: userId }));
    }
    return;
  }

  // Local persistent mock store
  let votes = {};
  try { votes = JSON.parse(localStorage.getItem(STORAGE_VOTES_KEY) || '{}'); } catch {}
  const list = votes[issue.id] || [];
  if (list.includes(userId)) {
    votes[issue.id] = list.filter(id => id !== userId);
  } else {
    votes[issue.id] = [...list, userId];
  }
  try { localStorage.setItem(STORAGE_VOTES_KEY, JSON.stringify(votes)); } catch {}
}

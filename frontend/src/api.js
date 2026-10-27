import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url && key ? createClient(url,key) : null;
function unwrap({data,error}) { if(error) throw new Error(error.message); return data; }
export async function loadIssues() {
  const data=unwrap(await supabase.from('cp_issues').select('*,cp_votes(user_id),cp_events(*)').order('created_at',{ascending:false}));
  return data.map(({cp_votes,cp_events,...issue})=>({...issue,support_count:cp_votes.length,supported:cp_votes.some(v=>v.user_id===currentId),events:cp_events.sort((a,b)=>a.created_at.localeCompare(b.created_at))}));
}
let currentId=null;
export function setCurrentId(id) {currentId=id;}
export async function role() { return unwrap(await supabase.rpc('cp_current_role')); }
export async function upload(file) {
  if(!file) return null;
  if(file.size>4*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image under 4 MB.');
  const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
  const path=`${currentId}/${crypto.randomUUID()}.${extension}`;
  unwrap(await supabase.storage.from('civic-evidence').upload(path,file,{contentType:file.type,upsert:false}));
  return path;
}
export async function imageUrl(path) {if(!path)return null;return unwrap(await supabase.storage.from('civic-evidence').createSignedUrl(path,600)).signedUrl;}
export async function submit(report,file) {
  const photo_path=await upload(file);
  const {title,description,category,severity,locality,lat,lng}=report;
  try {return unwrap(await supabase.from('cp_issues').insert({title,description,category,severity,locality,lat:Number(lat),lng:Number(lng),photo_path,reporter_id:currentId}).select().single());}
  catch(error){if(photo_path)await supabase.storage.from('civic-evidence').remove([photo_path]);throw error;}
}
export async function transition(issue,status,note,file,rating) {
  const resolution_photo_path=file?await upload(file):issue.resolution_photo_path;
  const update={status,action_note:note};
  if(file)update.resolution_photo_path=resolution_photo_path;
  if(status==='Awaiting confirmation')update.resolution_note=note;
  if(status==='Resolved')update.rating=Number(rating);
  try {return unwrap(await supabase.from('cp_issues').update(update).eq('id',issue.id).select().single());}
  catch(error){if(file&&resolution_photo_path)await supabase.storage.from('civic-evidence').remove([resolution_photo_path]);throw error;}
}
export async function support(issue,userId) {if(issue.supported)unwrap(await supabase.from('cp_votes').delete().eq('issue_id',issue.id).eq('user_id',userId));else unwrap(await supabase.from('cp_votes').insert({issue_id:issue.id,user_id:userId}));}

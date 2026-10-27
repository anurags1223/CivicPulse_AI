import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, LayoutDashboard, MapPinned, ChartNoAxesCombined, ClipboardList, Plus, ArrowUpRight, ArrowRight, Search, SlidersHorizontal, MapPin, Bell, ChevronDown, X, Check, Clock3, ShieldCheck, Sparkles, ThumbsUp, Camera, Navigation, LogOut, CheckCircle2, CircleAlert, Download, Menu, Radio, Layers, Users, LockKeyhole, RefreshCw } from 'lucide-react';
import { analyze, categories, duplicates, statuses } from './civic';
import { seeds } from './seed';
import * as api from './api';
import { awardPoints, getMyRewards, getLeaderboard } from './api';
import { aiValidatePhoto } from './aiValidatePhoto';
import CivicMap from './Map';

const date=value=>new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const time=value=>new Date(value).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function Badge({value}){return <span className={`badge ${value.toLowerCase().replaceAll(' ','-')}`}><i/>{value}</span>;}
function Modal({title,subtitle,onClose,children,wide=false}){
 const ref=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';ref.current?.querySelector('button')?.focus();
  function trap(event){if(event.key!=='Tab')return;const controls=[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el=>el.offsetParent!==null);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',trap);previous?.focus();};
 },[]);
 return <div className="overlay" onClick={onClose}><section ref={ref} className={`modal ${wide?'wide':''}`} role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><header><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={21}/></button></header>{user && user.user_metadata?.role !== 'staff' && <RewardsBar userId={user.id} />}{children}</section></div>;
}

function Auth({onClose,notify,recovery=false}){
 const [tab,setTab]=useState('login'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[fullName,setFullName]=useState(''),[showPass,setShowPass]=useState(false);
 const STAFF_EMAIL='bikeesah30@gmail.com';
 const isStaffHint=email.trim().toLowerCase()===STAFF_EMAIL||/\.gov\.in$/.test(email.trim().toLowerCase());

 async function submit(e){
  if(e)e.preventDefault();
  setBusy(true);setError('');setMessage('');
  try{
   const fe=email.trim();
   if(!fe)throw new Error('Please enter your email address.');
   if(!password)throw new Error('Please enter your password.');
   let result;
   if(tab==='signup'){result=await api.supabase.auth.signUp({email:fe,password,fullName,options:{emailRedirectTo:window.location.origin}});}
   else {result=await api.supabase.auth.signInWithPassword({email:fe,password});}
   if(result.error)throw result.error;
   if(tab==='signup'&&!result.data?.session)setMessage('Account created! You can now sign in.');
   else{notify('Welcome! You are now signed in.');onClose();}
  }catch(err){
   const t=err.message||'Sign-in could not be completed.';
   setError(/email.*not authorized|sending confirmation/i.test(t)?'Email verification unavailable. Try signing in directly.':/rate limit/i.test(t)?'Too many attempts. Please wait.':t);
  }finally{setBusy(false);}
 }

 async function quickLogin(targetEmail,targetPassword,targetRole){
  setBusy(true);setError('');setMessage('');
  try{
   const result=await api.supabase.auth.signInWithPassword({email:targetEmail,password:targetPassword});
   if(result.error)throw result.error;
   notify('Signed in as '+targetRole+'.');onClose();
  }catch(err){setError(err.message||'Quick sign-in failed.');}finally{setBusy(false);}
 }

 useEffect(()=>{const {data}=api.supabase?.auth?.onAuthStateChange?.(event=>{if(event==='PASSWORD_RECOVERY')setTab('login');})||{};return()=>data?.subscription?.unsubscribe();},[]);

 return <Modal title="Welcome to CivicPulse" subtitle="Report smarter. Respond faster. Sign in to save your work." onClose={onClose}>
  <div className="auth-tab-bar">
   <button type="button" className={'auth-tab-btn'+(tab==='login'?' active':'')} onClick={()=>{setTab('login');setError('');setMessage('');}}>
    <ShieldCheck size={14}/> Sign In
   </button>
   <button type="button" className={'auth-tab-btn'+(tab==='signup'?' active':'')} onClick={()=>{setTab('signup');setError('');setMessage('');}}>
    <Users size={14}/> Create Account
   </button>
  </div>

  {tab==='login'&&<div className="staff-portal-card">
   <div className="staff-portal-badge"><ShieldCheck size={11}/> STAFF PORTAL</div>
   <h4>Municipal Operations Officer</h4>
   <p>Sign in as the verified lead officer to access triage, assignment and closure tools for all reported issues.</p>
   <button type="button" className="primary full" style={{fontSize:'11px'}} disabled={busy} onClick={()=>quickLogin(STAFF_EMAIL,'bikeesah30','Chief Officer')}><ShieldCheck size={14}/>Sign in as bikeesah30@gmail.com</button>
  </div>}

  {tab==='login'&&<div style={{display:'flex',alignItems:'center',gap:'8px',margin:'12px 0',color:'#aaa',fontSize:'10px'}}><div style={{flex:1,height:'1px',background:'#e5e5e5'}}/><span>OR CITIZEN SIGN IN</span><div style={{flex:1,height:'1px',background:'#e5e5e5'}}/></div>}

  <form onSubmit={submit} className="form">
   {tab==='signup'&&<label>Full name <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your name" autoComplete="name"/></label>}
   <label>Email address
    <input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/>
    {isStaffHint&&tab==='login'&&<small style={{color:'#16a34a',fontWeight:600}}>✓ Staff access will be granted automatically</small>}
   </label>
   <label>{tab==='signup'?'Create password':'Password'}
    <div className="password-input-group">
     <input name="password" type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={tab==='login'?'current-password':'new-password'} minLength={6} required placeholder="At least 6 characters"/>
     <button type="button" className="password-toggle-btn" onClick={()=>setShowPass(s=>!s)} aria-label={showPass?'Hide':'Show'}>{showPass?<X size={14}/>:<Search size={14}/>}</button>
    </div>
   </label>
   {error&&<p className="error" role="alert">{error}</p>}
   {message&&<p className="success" role="status">{message}</p>}
   <button className="primary full" disabled={busy}>
    {busy?'Please wait…':tab==='signup'?'Create citizen account':'Sign in'}<ArrowRight size={17}/>
   </button>
   {tab==='signup'&&<small style={{textAlign:'center',display:'block',color:'#999',lineHeight:1.6}}>Keep reports factual and location-accurate.</small>}
  </form>

  <div className="auth-links">
   {tab==='login'&&<button type="button" onClick={()=>{setTab('signup');setError('');setMessage('');}}>New here? Create an account</button>}
   {tab==='signup'&&<button type="button" onClick={()=>{setTab('login');setError('');setMessage('');}}>Already have an account? Sign in</button>}
  </div>
 </Modal>;
}

function Report({issues,demo,onClose,onSubmit}){
 const [form,setForm]=useState({title:'',description:'',category:'',severity:'medium',locality:'',lat:30.7333,lng:76.7794});
 const [file,setFile]=useState(null),[busy,setBusy]=useState(false);const [showCamera,setShowCamera]=React.useState(false);const [aiVerdict,setAiVerdict]=React.useState(null),[error,setError]=useState(''),[ack,setAck]=useState(false),[gps,setGps]=useState('');
 const result=analyze(form),matches=duplicates({...form,category:result.category},issues);
 function change(e){setForm({...form,[e.target.name]:e.target.value});setAck(false);}
 function locate(){setGps('Finding your location…');if(!navigator.geolocation){setGps('Location unavailable. Select a point on the map.');return;}navigator.geolocation.getCurrentPosition(p=>{setForm(f=>({...f,lat:p.coords.latitude,lng:p.coords.longitude}));setGps('Location updated. Check the map before submitting.');},()=>setGps('Location permission unavailable. Select a point on the map.'),{timeout:10000});}
 async function submit(e){e.preventDefault();setError('');if(matches.length&&!ack){setError('Review the nearby report and confirm if this is a separate issue.');return;}setBusy(true);try{await onSubmit({...form,category:result.category},file);onClose();}catch(err){setError(err.message);}finally{setBusy(false);}}
 return <Modal wide title="Report a civic issue" subtitle="A clear report is the first step toward a better neighbourhood." onClose={onClose}><form className="report-layout" onSubmit={submit}><div className="form"><div className="step-title"><span>01</span> Tell us what happened</div><label>Issue title<input name="title" value={form.title} onChange={change} minLength={5} maxLength={140} required placeholder="e.g. Deep pothole outside the school"/></label><label>Description<textarea name="description" value={form.description} onChange={change} minLength={10} maxLength={3000} rows={3} required placeholder="What is the problem? Who is affected? Mention any safety risk."/></label><div className="two-fields"><label>Category<select name="category" value={form.category} onChange={change}><option value="">Suggest from my description</option>{Object.entries(categories).map(([key,c])=><option key={key} value={key}>{c.label}</option>)}</select></label><label>Reported severity<select name="severity" value={form.severity} onChange={change}>{['low','medium','high','critical'].map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></label></div><label className="upload"><Camera size={22}/><strong>{file?file.name:'Add a report photo'}</strong><span>Optional · JPG, PNG or WebP · up to 4 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{const f=e.target.files[0]||null;setFile(f);if(f){setAiVerdict({checking:true});const r=await aiValidatePhoto(URL.createObjectURL(f),f.name).catch(()=>null);setAiVerdict(r);}else setAiVerdict(null);}}/></label>{showCamera&&<CameraScanner onClose={()=>setShowCamera(false)} onCapture={(f,preview,verdict)=>{setFile(f);setAiVerdict(verdict);}}/>}<button type="button" className="camera-btn" onClick={()=>setShowCamera(true)} style={{marginTop:'6px'}}>📷 Scan with Camera</button>{aiVerdict&&<div className={`ai-verdict ${aiVerdict.checking?'checking':aiVerdict.isCivic===false?'not-civic':'civic'}`}><span className="ai-verdict-icon">{aiVerdict.checking?'⏳':aiVerdict.isCivic===false?'⚠️':'✅'}</span><div className="ai-verdict-text"><span className="ai-verdict-cat">{aiVerdict.checking?'Analyzing image…':aiVerdict.isCivic===false?'Not a civic issue detected':(`Detected: ${aiVerdict.category||'civic issue'}`)}</span>{!aiVerdict.checking&&aiVerdict.description&&<span style={{display:'block',fontSize:'.78rem',opacity:.8}}>{aiVerdict.description}</span>}</div></div>}<div className="step-title"><span>02</span> Pin the location</div><label>Public location / landmark<input name="locality" value={form.locality} onChange={change} minLength={3} maxLength={160} required placeholder="Sector, street or nearby landmark"/></label><small>Reports are visible to registered community members. Avoid personal details and private home addresses.</small><div className="two-fields"><label>Latitude<input type="number" name="lat" step="any" min="-90" max="90" value={form.lat} onChange={e=>setForm({...form,lat:Number(e.target.value)})} required/></label><label>Longitude<input type="number" name="lng" step="any" min="-180" max="180" value={form.lng} onChange={e=>setForm({...form,lng:Number(e.target.value)})} required/></label></div><button type="button" className="secondary" onClick={locate}><Navigation size={16}/> Use my location</button>{gps&&<small role="status">{gps}</small>}<CivicMap onPick={p=>setForm({...form,...p})} point={{lat:form.lat,lng:form.lng}}/><small>Click the map to move your pin. The initial pin is a Chandigarh sample location.</small></div><aside className="analysis-preview"><div className="eyebrow"><Sparkles size={15}/> DECISION PREVIEW</div><div className="score-number">{result.score}<span>/ 100</span></div><Badge value={result.priority}/><h3>{categories[result.category].label}</h3><p className="muted">Suggested department</p><strong>{result.department}</strong><div className="reasons">{result.reasons.map(r=><div key={r.label}><span>{r.label}</span><b>+{r.points}</b></div>)}{result.reasons.reduce((s,r)=>s+r.points,0)>100&&<small>Score capped at 100.</small>}</div><p className="rule-note">Transparent rules, not a trained ML model. The server recalculates every score. Severity is reported by the citizen and needs staff review.</p>{matches.length>0&&<div className="duplicate-warning"><CircleAlert size={20}/><h4>Possible duplicate nearby</h4>{matches.slice(0,2).map(m=><p key={m.id}>{m.title}<small>{m.description}</small><small>{m.distance} m away · {m.status}</small></p>)}<label className="check-label"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>I reviewed this and am reporting a separate issue.</label></div>}{error&&<p className="error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy?'Submitting…':demo?'Submit sample report':'Submit report'}<ArrowRight size={17}/></button><small>{demo?'Demo reports stay in this browser.':'Saved to the shared CivicPulse workspace.'}</small></aside></form></Modal>;
}

function Detail({issue,onClose,role,user,demo,onAction,onSupport}){
 const [note,setNote]=useState(''),[file,setFile]=useState(null),[rating,setRating]=useState(5),[busy,setBusy]=useState(false),[error,setError]=useState(''),[photos,setPhotos]=useState({}),[dept,setDept]=useState(''),[preview,setPreview]=useState(null);
 const QUICK_NOTES={'Assigned':['Assigned to Roads & Bridges team.','Assigned to Electrical Maintenance team.','Assigned to Water & Sanitation team.','Assigned to Solid Waste Management.','Under field supervisor review.'],'In progress':['Work crew dispatched.','Materials procured, repair scheduled.','Partially repaired — follow-up pending.','Contractor on site. ETA 2 days.'],'Awaiting confirmation':['Repair completed and field-inspected.','Pothole filled and levelled.','Streetlight replaced and tested.','Drain cleared, waterlogging resolved.','Pipeline repaired, water restored.']};
 useEffect(()=>{let active=true;setPhotos({});if(!demo){Promise.all([api.imageUrl(issue.photo_path),api.imageUrl(issue.resolution_photo_path)]).then(([before,after])=>{if(active)setPhotos({before,after});}).catch(e=>{if(active)setError(e.message);});}return()=>{active=false;};},[issue.id,issue.photo_path,issue.resolution_photo_path,demo]);
 const next=role==='staff'?{'Reported':'Assigned','Assigned':'In progress','In progress':'Awaiting confirmation'}[issue.status]:null;
 const canConfirm=issue.reporter_id===user?.id && issue.status==='Awaiting confirmation';
 async function act(status,d){setBusy(true);setError('');try{if(note.trim().length<5)throw new Error('Add a short note explaining this change.');if(status==='Awaiting confirmation'&&(!file||note.trim().length<10))throw new Error('Upload a repair photo and add a repair note of at least 10 characters.');await onAction(issue,status,note,file,rating,d||dept);setNote('');setFile(null);setDept('');setPreview(null);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <Modal wide title={issue.title} subtitle={`${issue.is_demo?'SAMPLE · ':''}${issue.id.slice(0,8).toUpperCase()} · Reported ${time(issue.created_at)}`} onClose={onClose}><div className="detail-layout"><div><div className="detail-badges"><Badge value={issue.priority}/><Badge value={issue.status}/><span className="muted">{categories[issue.category]?.label}</span></div><p className="issue-description">{issue.description}</p><p className="location"><MapPin size={16}/>{issue.locality}</p><CivicMap issues={[issue]} point={issue}/>{(photos.before||photos.after)&&<div className="evidence-grid">{photos.before&&<figure><img src={photos.before} alt="Citizen report evidence"/><figcaption>Original report</figcaption></figure>}{photos.after&&<figure><img src={photos.after} alt="Repair completion evidence"/><figcaption>Repair evidence</figcaption></figure>}</div>}{issue.resolution_note&&<div className="repair-note"><ShieldCheck size={20}/><div><strong>Field team repair note</strong><p>{issue.resolution_note}</p>{demo&&<small>This sample has no actual repair photo. A real request requires uploaded evidence.</small>}</div></div>}<h3 className="section-title">Activity & accountability</h3><div className="timeline">{issue.events?.map((event,index)=><div className="event" key={event.id||index}><i/><div><strong>{event.status}</strong><span>{time(event.created_at)}</span><p>{event.note}</p></div></div>)}</div>{issue.rating&&<p className="success">Resident confirmation · {issue.rating}/5 rating</p>}</div><aside className="detail-aside"><div className="eyebrow"><Sparkles size={15}/> WHY THIS PRIORITY?</div><div className="score-number">{issue.score}<span>/ 100</span></div><div className="reasons">{issue.reasons.map(r=><div key={r.label}><span>{r.label}</span><b>+{r.points}</b></div>)}</div><small>Scores are capped at 100. Rules assist human review.</small><div className="route-box"><Layers size={18}/><div><small>ROUTED TO DEPARTMENT</small><strong>{issue.department}</strong></div></div><button className="secondary full" disabled={busy} onClick={async()=>{setBusy(true);try{await onSupport(issue);}catch(e){setError(e.message);}finally{setBusy(false);}}}><ThumbsUp size={17}/>{issue.supported?'Supported':'Support this report'} · {issue.support_count||0}</button>{(next||canConfirm)&&<div className="action-box"><h3>{canConfirm?'Did the repair solve it?':'Move this report forward'}</h3>{next&&QUICK_NOTES[next]&&<div className="quick-notes-wrap"><span className="quick-notes-label">QUICK NOTE TEMPLATES</span><div className="quick-notes">{QUICK_NOTES[next].map(n=><button key={n} type="button" className="quick-note-chip" onClick={()=>setNote(n)}>{n}</button>)}</div></div>}<label>Update note<textarea rows={3} value={note} maxLength={2000} onChange={e=>setNote(e.target.value)} placeholder={canConfirm?'Tell us what you checked.':'Describe the assignment or work completed.'}/></label>{next==='Assigned'&&<label>Reassign department<select value={dept} onChange={e=>setDept(e.target.value)}><option value=''>Keep current: {issue.department}</option>{['Roads & Bridges','Electrical Maintenance','Water & Sanitation','Solid Waste Management','Parks & Green Spaces','Storm Water & Drainage'].map(d=><option key={d} value={d}>{d}</option>)}</select></label>}{next==='Awaiting confirmation'&&<label>Repair evidence photo<input type='file' accept='image/jpeg,image/png,image/webp' onChange={e=>{const f=e.target.files[0]||null;setFile(f);if(f)setPreview(URL.createObjectURL(f));}}/><small>Required · up to 4 MB</small>{preview&&<div className="proof-preview-box"><img src={preview} alt="Preview"/><span>Photo ready to upload</span></div>}</label>}{canConfirm&&<label>Repair quality rating<select value={rating} onChange={e=>setRating(e.target.value)}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>}{next&&<button className='primary full' disabled={busy} onClick={()=>act(next,dept)}>{busy?'Saving…':next==='Assigned'?'Assign to department':next==='In progress'?'Start field work':'Request resident confirmation'}<ArrowRight size={17}/></button>}{canConfirm&&<><button className='primary full' disabled={busy} onClick={()=>act('Resolved','')}><CheckCircle2 size={17}/>Confirm — issue resolved</button><button className='secondary full' disabled={busy} onClick={()=>act('In progress','')}>Still a problem — reopen</button></>}</div>}{!next&&!canConfirm&&issue.status!=='Resolved'&&<p className="rule-note"><LockKeyhole size={15}/> {issue.status==='Awaiting confirmation'?'Only the original reporter can confirm or reopen this repair.':'Staff review and update the department workflow.'}</p>}{error&&<p className="error" role="alert">{error}</p>}</aside></div></Modal>;
}

// ─── Camera Scanner Component ─────────────────────────────────────────────────
function CameraScanner({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('Point camera at the civic issue');

  useEffect(() => {
    let s;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(st => { s = st; setStream(st); if (videoRef.current) videoRef.current.srcObject = st; })
      .catch(() => setHint('Camera access denied. Please allow camera permission.'));
    return () => { if (s) s.getTracks().forEach(t => t.stop()); };
  }, []);

  async function capture() {
    if (!videoRef.current || busy) return;
    setBusy(true);
    setHint('Analyzing civic issue with AI…');
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'camera_civic.jpg', { type: 'image/jpeg' });
    const verdict = await aiValidatePhoto(dataUrl, 'camera_civic').catch(() => null);
    if (s) s.getTracks().forEach(t => t.stop());
    onCapture(file, dataUrl, verdict);
    onClose();
  }

  // s variable for cleanup in capture
  let s;

  return (
    <div className="camera-modal-overlay" onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="camera-modal">
        <div className="camera-modal-header">
          <h3>📷 Scan Civic Issue</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="camera-video-wrap">
          <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',maxHeight:'300px',display:'block',objectFit:'cover'}}/>
          <div className="camera-scan-overlay"><div className="camera-scan-frame"/></div>
        </div>
        <p style={{padding:'8px 16px',fontSize:'.8rem',color:'#9ca3af',textAlign:'center',margin:0}}>{hint}</p>
        <div className="camera-modal-footer">
          <button className="capture-btn" onClick={capture} disabled={!stream || busy}>
            {busy ? '🤖 Detecting…' : '📸 Capture & Auto-Detect Issue'}
          </button>
          <button className="secondary" style={{padding:'10px 16px'}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Rewards Bar (Citizen Gamification) ──────────────────────────────────────
const BADGE_MAP_LOCAL = {
  first_report: { icon:'🌱', label:'First Report' },
  reporter_5:   { icon:'📋', label:'Reporter' },
  eagle_eye:    { icon:'🦅', label:'Eagle Eye' },
  civic_hero:   { icon:'🏆', label:'Civic Hero' },
  resolver:     { icon:'✅', label:'Problem Solver' },
  influencer:   { icon:'🔥', label:'Influencer' },
};
function RewardsBar({ userId }) {
  const [rwd, setRwd] = useState(null);
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem('civicpulse_rewards');
      const all = raw ? JSON.parse(raw) : {};
      setRwd(all[userId] || null);
    } catch(e) { setRwd(null); }
  }, [userId]);
  if (!rwd || !rwd.reportCount) return null;
  const earned = (rwd.badges || []).map(id => BADGE_MAP_LOCAL[id]).filter(Boolean);
  return (
    <div className="rewards-bar">
      <div style={{flex:1}}>
        <div className="rewards-points">⭐ {rwd.points || 0} civic pts</div>
        <div className="rewards-label">
          {rwd.reportCount} report{rwd.reportCount!==1?'s':''} filed · {rwd.resolvedCount||0} resolved
        </div>
      </div>
      {earned.length > 0 && (
        <div className="rewards-badges">
          {earned.map(b => <span key={b.label} className="reward-badge" title={b.label}>{b.icon}</span>)}
        </div>
      )}
    </div>
  );
}


export default function App(){
 const [view,setView]=useState('overview'),[issues,setIssues]=useState(seeds),[session,setSession]=useState(null),[role,setRole]=useState('citizen'),[demo,setDemo]=useState(true),[demoRole,setDemoRole]=useState('staff');
 const [auth,setAuth]=useState(false),[recovery,setRecovery]=useState(false),[report,setReport]=useState(false),[selected,setSelected]=useState(null),[search,setSearch]=useState(''),[status,setStatus]=useState('All statuses'),[category,setCategory]=useState('all'),[priority,setPriority]=useState('all'),[sort,setSort]=useState('priority'),[toast,setToast]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false),[mobile,setMobile]=useState(false);
 const actor=demo?{id:'demo-citizen',email:'Demo resident'}:session?.user;
 const activeRole=demo?demoRole:role;
 const contextRef=useRef({demo,id:session?.user.id});contextRef.current={demo,id:session?.user.id};
 function notify(message){setToast(message);}
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{if(!api.supabase)return;let active=true;api.supabase.auth.getSession().then(({data,error})=>{if(!active)return;if(error)setError(error.message);if(data.session){setSession(data.session);setDemo(false);}});const {data}=api.supabase.auth.onAuthStateChange((event,current)=>{if(!active)return;setSession(current);if(current){setDemo(false);if(event==='PASSWORD_RECOVERY'){setRecovery(true);setAuth(true);}}else{setDemo(true);setRole('citizen');setIssues(seeds());} });return()=>{active=false;data.subscription.unsubscribe();};},[]);
 async function refresh(){if(demo)return;setLoading(true);setError('');try{api.setCurrentId(session?.user.id);const [loaded,r]=await Promise.all([api.loadIssues(),api.role()]);if(contextRef.current.demo||contextRef.current.id!==session?.user.id)return;setIssues(loaded);setRole(r);}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{if(demo){setIssues(seeds());return;}if(!session)return;api.setCurrentId(session.user.id);refresh();const timer=setInterval(refresh,20000);return()=>clearInterval(timer);},[demo,session?.user.id]);
 useEffect(()=>{function escape(e){if(e.key==='Escape'){setAuth(false);setReport(false);setSelected(null);setMobile(false);}}document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[]);
 const stats=useMemo(()=>({total:issues.length,active:issues.filter(i=>i.status!=='Resolved').length,critical:issues.filter(i=>i.score>=80&&i.status!=='Resolved').length,resolved:issues.filter(i=>i.status==='Resolved').length,review:issues.filter(i=>i.status==='Awaiting confirmation').length}),[issues]);
 const filtered=useMemo(()=>issues.filter(i=>(view!=='mine'||i.reporter_id===actor?.id)&&(status==='All statuses'||i.status===status)&&(category==='all'||i.category===category)&&(priority==='all'||i.priority===priority)&&`${i.title} ${i.description} ${i.locality} ${i.department}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='newest'?new Date(b.created_at)-new Date(a.created_at):b.score-a.score),[issues,status,category,priority,search,sort,view,actor?.id]);
 const selectedIssue=issues.find(i=>i.id===selected);
 async function submit(form,file){if(file&&(file.size>4*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)))throw new Error('Choose a JPG, PNG or WebP image under 4 MB.');if(demo){const item={...form,...analyze(form),id:`demo-${crypto.randomUUID()}`,reporter_id:'demo-citizen',status:'Reported',is_demo:true,created_at:new Date().toISOString(),support_count:0,events:[{status:'Reported',note:'Sample report submitted in browser-only demo.',created_at:new Date().toISOString()}]};setIssues(previous=>[item,...previous]);setSelected(item.id);}else{const item=await api.submit(form,file);await refresh();setSelected(item.id);}notify(demo?'Sample report added. Sign in to save shared reports.':'Your report is now in the shared queue.');}
 async function action(issue,next,note,file,rating,updatedDept){if(demo){setIssues(current=>current.map(i=>i.id===issue.id?{...i,status:next,department:updatedDept||i.department,resolution_note:next==='Awaiting confirmation'?note:i.resolution_note,rating:next==='Resolved'?Number(rating):null,events:[...i.events,{status:next,note,created_at:new Date().toISOString()}]}:i));}else{await api.transition(issue,next,note,file,rating,updatedDept);await refresh();}notify(next==='Resolved'?'Resolution confirmed by the resident.':'Workflow updated.');}
 async function support(issue){if(demo)setIssues(current=>current.map(i=>i.id===issue.id?{...i,supported:!i.supported,support_count:(i.support_count||0)+(i.supported?-1:1)}:i));else{await api.support(issue,actor.id);await refresh();}}
 function exportCSV(){const escape=value=>'"'+String(value??'').replaceAll('"','""')+'"';const rows=[['ID','Title','Category','Locality','Department','Priority','Score','Status','Sample','Created'],...filtered.map(i=>[i.id,i.title,i.category,i.locality,i.department,i.priority,i.score,i.status,i.is_demo,i.created_at])];const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(v=>escape(/^[=+@\-\t\r]/.test(String(v).trimStart())?`'${v}`:v)).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='civicpulse-reports.csv';link.click();URL.revokeObjectURL(url);notify('Filtered report queue exported.');}
 const nav=[['overview',LayoutDashboard,'Overview'],['queue',ClipboardList,'Issue queue'],['map',MapPinned,'City map'],['insights',ChartNoAxesCombined,'Insights'],['mine',Users,'My reports']];
 return <div className="app"><aside className={`sidebar ${mobile?'open':''}`}><a className="brand" href="#" onClick={e=>{e.preventDefault();setView('overview');}}><span className="brand-mark"><Activity size={25}/></span><span>CivicPulse<em>AI</em><small>CITY ACTION PLATFORM</small></span></a><div className="workspace"><span className="workspace-icon"><MapPinned size={19}/></span><div><strong>Chandigarh</strong><small>Community workspace</small></div><ChevronDown size={14}/></div><div className="nav-label">WORKSPACE</div><nav>{nav.map(([id,Icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);setMobile(false);}}><Icon size={19}/>{label}{id==='queue'&&<span>{stats.active}</span>}</button>)}</nav><div className="sidebar-note"><div className="tiny-stars"><Sparkles size={18}/></div><h3>Every report deserves<br/>a clear next step.</h3><p>Explain the priority.<br/>Track the work.<br/>Verify the fix.</p><span>WE FOUR · CODE YUDH 2026</span></div><div className="sidebar-bottom"><span className="avatar">{demo?'D':actor?.email?.slice(0,1).toUpperCase()}</span><div><strong>{demo?'Demo workspace':actor?.email?.split('@')[0]}</strong><small>{demo?'Synthetic data':activeRole==='staff'?'Verified staff account':'Citizen account'}</small></div>{!demo?<button className="icon-button" aria-label="Sign out" onClick={async()=>{const {error}=await api.supabase.auth.signOut();if(error)notify(error.message);}}><LogOut size={17}/></button>:<Radio size={15}/>}</div></aside><div className="main"><header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu" onClick={()=>setMobile(!mobile)} aria-label="Toggle navigation"><Menu size={20}/></button><span>Workspace</span><span>/</span><strong>{nav.find(n=>n[0]===view)?.[2]}</strong></div><div className="top-actions"><span className={`connection ${demo?'sample':''}`}><i/>{demo?'Demo mode':'Shared workspace'}</span>{demo?<button className="secondary compact" onClick={()=>setAuth(true)}>Sign in<ArrowUpRight size={15}/></button>:<div style={{display:'flex',gap:'8px',alignItems:'center'}}><button className="icon-button" aria-label="Refresh reports" onClick={refresh}><RefreshCw size={17}/></button><button className="secondary compact" onClick={async()=>{const {error}=await api.supabase.auth.signOut();if(error)notify(error.message);else notify('Signed out.');}}><LogOut size={14}/>Sign out</button></div>}</div></header><main><div className="page-heading"><div><div className="eyebrow">CIVIC OPERATIONS · CHANDIGARH</div><h1>{view==='overview'?'A better city starts with action.':view==='queue'?'One queue. Clear priorities.':view==='map'?'See the city. Spot the need.':view==='insights'?'The patterns behind the reports.':'Your voice. Your neighbourhood.'}</h1><p>{view==='overview'?'Turn community reports into visible, verifiable progress.':view==='mine'?'Follow your reports from the first signal to the verified fix.':'Explore reports, understand the next step, and keep the work moving.'}</p></div><button className="primary" onClick={()=>setReport(true)}><Plus size={18}/>Report an issue</button></div><div className={`mode-banner ${demo?'':'connected'}`}><div><span className="banner-icon">{demo?<Radio size={17}/>:<ShieldCheck size={17}/>}</span><p><strong>{demo?'Explore the working demo':'Connected to real shared data'}</strong><span>{demo?'Six synthetic cases · changes reset on reload · real accounts available.':'Reports sync every 20 seconds. Community members can see submitted reports.'}</span></p></div>{demo?<label className="demo-role">Preview as<select aria-label="Demo role" value={demoRole} onChange={e=>setDemoRole(e.target.value)}><option value="staff">Staff</option><option value="citizen">Citizen</option></select></label>:<span className="account-tag">{activeRole==='staff'?'STAFF':'CITIZEN'}</span>}</div>{error&&<div className="error" role="alert">{error} <button onClick={refresh}>Retry</button></div>}{loading&&<p className="loading" role="status">Syncing reports…</p>}
 {['overview','insights'].includes(view)&&<div className="stats"><Stat label="Total reports" value={stats.total} icon={ClipboardList} detail={demo?'Synthetic community reports':'Shared community reports'}/><Stat label="Active issues" value={stats.active} icon={Clock3} detail={`${stats.review} awaiting resident confirmation`} color="amber"/><Stat label="Critical priority" value={stats.critical} icon={CircleAlert} detail="Needs prompt staff review" color="coral"/><Stat label="Verified resolutions" value={stats.resolved} icon={ShieldCheck} detail="Confirmed by the reporting resident" color="green"/></div>}
 {view==='overview'&&<div className="overview-grid"><section className="panel map-panel"><div className="panel-heading"><div><h2>City at a glance<span className="small-dot"/></h2><p>Community reports across Chandigarh</p></div><button className="text-button" onClick={()=>setView('map')}>Open city map<ArrowUpRight size={16}/></button></div><CivicMap issues={issues} onSelect={i=>setSelected(i.id)}/><div className="map-legend">{['Critical','High','Medium','Low'].map(p=><span key={p}><i className={p.toLowerCase()}/>{p}</span>)}<small>{demo?'Sample locations':'Reported locations'}</small></div></section><section className="panel pulse-panel"><div className="eyebrow"><Activity size={16}/> THE ACTION LOOP</div><h2>Reporting is the start.<br/>Closure is the goal.</h2><p className="muted">A transparent path for every civic issue.</p><div className="loop-steps">{[['01','Report & locate','A description, photo and map pin'],['02','Explain & route','Visible score and department suggestion'],['03','Repair & document','Staff updates backed by photo evidence'],['04','Verify together','The original reporter confirms the fix']].map(([n,title,description])=><div key={n}><span>{n}</span><div><strong>{title}</strong><small>{description}</small></div>{n==='04'&&<CheckCircle2 size={18}/>}</div>)}</div><div className="pulse-footer"><ShieldCheck size={18}/><span>Human review. Traceable decisions.</span></div></section></div>}
 {view==='map'&&<section className="panel"><div className="panel-heading"><div><h2>Report locations</h2><p>Select a marker to inspect the report and its score.</p></div><Badge value={`${filtered.length} reports`}/></div><CivicMap large issues={filtered} onSelect={i=>setSelected(i.id)}/></section>}
 {view==='insights'?<Insights issues={issues}/>:<section className="panel queue-panel"><div className="panel-heading"><div><h2>{view==='mine'?'My reports':view==='overview'?'Priority queue':'Community issue queue'}<span className="count">{filtered.length}</span></h2><p>{view==='overview'?'The reports that need attention, with the reasons in view.':'All reported locations are public landmarks shared with registered members.'}</p></div><button className="secondary compact" onClick={exportCSV}><Download size={15}/>Export CSV</button></div><div className="filters"><div className="search"><Search size={17}/><input aria-label="Search reports" placeholder="Search reports, areas, departments…" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Filter category" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{Object.entries(categories).map(([key,c])=><option value={key} key={key}>{c.label}</option>)}</select><select aria-label="Filter priority" value={priority} onChange={e=>setPriority(e.target.value)}><option value="all">All priorities</option>{['Critical','High','Medium','Low'].map(s=><option key={s}>{s}</option>)}</select><select aria-label="Sort reports" value={sort} onChange={e=>setSort(e.target.value)}><option value="priority">Highest priority</option><option value="newest">Newest first</option></select></div><div className="status-tabs">{['All statuses',...statuses].map(s=><button className={status===s?'active':''} key={s} onClick={()=>setStatus(s)}>{s}{s==='All statuses'&&<span>{issues.length}</span>}</button>)}</div><div className="table-wrap"><table><thead><tr><th>ISSUE & LOCATION</th><th>PRIORITY</th><th>DEPARTMENT</th><th>STATUS</th><th>SUPPORT</th><th><span className="sr-only">Open report</span></th></tr></thead><tbody>{filtered.slice(0,view==='overview'?5:filtered.length).map(i=><tr key={i.id} onClick={()=>setSelected(i.id)}><td><button className="issue-link" onClick={()=>setSelected(i.id)}><span className={`category-icon ${i.category}`}>{i.category==='roads'?<Layers size={18}/>:i.category==='lighting'?<Sparkles size={18}/>:<MapPin size={18}/>}</span><span><strong>{i.title}</strong><small><MapPin size={11}/>{i.locality} <b>·</b> {date(i.created_at)}</small></span></button></td><td><Badge value={i.priority}/><small className="score-caption">{i.score} / 100</small></td><td className="department">{i.department}</td><td><Badge value={i.status}/></td><td><span className="support-count"><ThumbsUp size={13}/>{i.support_count||0}</span></td><td><ArrowUpRight size={17} className="row-arrow"/></td></tr>)}</tbody></table></div>{!filtered.length&&<div className="empty"><ClipboardList size={34}/><h3>{loading?'Loading the shared queue…':'No matching reports yet'}</h3><p>{view==='mine'?'Reports you submit will appear here.':'Try different filters or submit the first issue in this workspace.'}</p><button className="secondary" onClick={()=>{setSearch('');setStatus('All statuses');setCategory('all');setPriority('all');}}>Clear filters</button></div>}<div className="table-footer"><span>{demo?'SYNTHETIC DEMO DATA':'SHARED COMMUNITY REPORTS'} · {Math.min(filtered.length,view==='overview'?5:filtered.length)} of {filtered.length} shown</span>{view==='overview'&&<button className="text-button" onClick={()=>setView('queue')}>View all reports<ArrowRight size={15}/></button>}</div></section>}
 <footer className="page-footer"><span><Activity size={14}/>CivicPulse AI<span>Report smarter. Respond faster.</span></span><small>Built by We Four · Code Yudh · Transparent rules v1.0</small></footer></main></div>{auth&&<Auth recovery={recovery} onClose={()=>{setAuth(false);setRecovery(false);}} notify={notify}/ >}{report&&<Report issues={issues} demo={demo} onClose={()=>setReport(false)} onSubmit={submit}/ >}{selectedIssue&&<Detail key={selectedIssue.id} issue={selectedIssue} role={activeRole} user={actor} demo={demo} onClose={()=>setSelected(null)} onAction={action} onSupport={support}/ >}{toast&&<div className="toast" role="status"><CheckCircle2 size={19}/>{toast}<button onClick={()=>setToast('')} aria-label="Dismiss notification"><X size={15}/></button></div>}</div>;
}
function Stat({label,value,icon:Icon,detail,color=''}){return <section className={`stat ${color}`}><div><span>{label}</span><Icon size={18}/></div><strong>{String(value).padStart(2,'0')}</strong><p>{detail}</p></section>;}
function Insights({issues}){
 const groups=Object.entries(categories).map(([key,c])=>({...c,count:issues.filter(i=>i.category===key).length,active:issues.filter(i=>i.category===key&&i.status!=='Resolved').length}));
 const areas=Object.entries(issues.reduce((result,i)=>{const area=i.locality.split('·')[0].trim();result[area]=(result[area]||0)+1;return result;},{})).sort((a,b)=>b[1]-a[1]);
 return <div className="insights-grid"><section className="panel"><div className="panel-heading"><div><h2>Demand by category</h2><p>Observed counts from the current workspace.</p></div></div><div className="bars">{groups.map(c=><div className="bar-row" key={c.label}><div><span>{c.label}</span><strong>{c.count}</strong></div><div className="bar-track"><span style={{width:`${issues.length?c.count/issues.length*100:0}%`}}/></div><small>{c.active} active · {c.department}</small></div>)}</div></section><section className="panel"><div className="panel-heading"><div><h2>Areas to watch</h2><p>Report volume is a signal, not proof of risk.</p></div></div><div className="area-list">{areas.length?areas.map(([area,count],i)=><div key={area}><span className="area-number">{String(i+1).padStart(2,'0')}</span><strong>{area}</strong><span>{count} {count===1?'report':'reports'}</span></div>):<p className="muted">Area counts appear as reports are submitted.</p>}</div><div className="insight-note"><Sparkles size={21}/><p><strong>Decisions you can inspect</strong>Every score lists its contributing factors. This prototype uses rules and reported severity; it does not claim measured AI accuracy or municipal integration.</p></div></section></div>;
}

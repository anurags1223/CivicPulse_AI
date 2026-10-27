// Adapted from the supplied CivicFix aiService.js category rules and Haversine helper.
// The explicit severity + context score follows the supplied CivicPulse presentation.
export const categories = {
  roads: { label: 'Roads & footpaths', department: 'Roads & Infrastructure', keywords: ['pothole', 'asphalt', 'footpath', 'road', 'sidewalk'], impact: 8 },
  sanitation: { label: 'Waste & sanitation', department: 'Sanitation', keywords: ['garbage', 'trash', 'waste', 'dump', 'litter'], impact: 4 },
  lighting: { label: 'Street lighting', department: 'Electrical Services', keywords: ['streetlight', 'street light', 'lamp', 'dark', 'lighting'], impact: 6 },
  drainage: { label: 'Drainage & flooding', department: 'Water & Drainage', keywords: ['drain', 'sewage', 'sewer', 'waterlogging', 'flood'], impact: 10 },
  water: { label: 'Water supply', department: 'Water & Drainage', keywords: ['pipeline', 'water leak', 'tap', 'water supply'], impact: 6 },
  other: { label: 'Other civic issue', department: 'General Services', keywords: [], impact: 0 },
};
export const statuses = ['Reported', 'Assigned', 'In progress', 'Awaiting confirmation', 'Resolved'];
export function analyze(input) {
  const text = `${input.title || ''} ${input.description || ''}`.toLowerCase();
  const ranked = Object.entries(categories).map(([key, value]) => [key, value.keywords.filter(word => text.includes(word)).length]).sort((a, b) => b[1] - a[1]);
  const category = input.category && categories[input.category] ? input.category : ranked[0][1] ? ranked[0][0] : 'other';
  const severity = ['low','medium','high','critical'].includes(input.severity) ? input.severity : 'medium';
  const reasons = [{ label: `${severity[0].toUpperCase() + severity.slice(1)} reported severity`, points: {low:20,medium:40,high:60,critical:80}[severity] }];
  if (categories[category].impact) reasons.push({ label: `${categories[category].label} impact`, points: categories[category].impact });
  if (/\b(school|hospital|playground)\b/.test(text)) reasons.push({label:'School, hospital or playground mentioned',points:12});
  if (/\b(dangerous|danger|accident|injury|unsafe|exposed)\b/.test(text)) reasons.push({label:'Safety language in report',points:12});
  const score = Math.min(100,reasons.reduce((sum,reason)=>sum+reason.points,0));
  return { category, severity, department:categories[category].department, score, priority:score>=80?'Critical':score>=60?'High':score>=40?'Medium':'Low', reasons };
}
export function distanceMeters(a,b) {
  if (![a.lat,a.lng,b.lat,b.lng].every(value=>typeof value==='number' && Number.isFinite(value))) return Infinity;
  const r=Math.PI/180, dlat=(b.lat-a.lat)*r, dlng=(b.lng-a.lng)*r;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
export function duplicates(report,issues) {
  const category=analyze(report).category;
  return issues.filter(item=>item.id!==report.id && item.status!=='Resolved' && item.category===category && distanceMeters(report,item)<150).map(item=>({...item,distance:Math.round(distanceMeters(report,item))})).sort((a,b)=>a.distance-b.distance);
}
export function canTransition(issue,next,role,actorId,proof) {
  if (role==='staff') return (issue.status==='Reported' && next==='Assigned') || (issue.status==='Assigned' && next==='In progress') || (issue.status==='In progress' && next==='Awaiting confirmation' && !!proof);
  return issue.reporter_id===actorId && issue.status==='Awaiting confirmation' && ['Resolved','In progress'].includes(next);
}

// Visual keywords used for client-side image filename / description heuristics
export const imageKeywords = {
  roads: ['pothole','crack','asphalt','road','pavement','footpath','sidewalk','broken road','highway','divider'],
  sanitation: ['garbage','trash','waste','dump','litter','bin','rubbish','filth','sewage overflow','odor'],
  lighting: ['streetlight','lamppost','dark street','broken lamp','lighting','light pole','no light'],
  drainage: ['flood','waterlog','drain','overflow','puddle','stagnant water','sewage','blocked drain'],
  water: ['pipe leak','water leak','burst pipe','water supply','dry tap','no water','water seepage'],
  other: [],
};

// Civic issue visual detection — checks filename + any extracted text
export function detectCivicFromImage(filename='', altText='') {
  const haystack = (filename+' '+altText).toLowerCase();
  for(const [key, words] of Object.entries(imageKeywords)){
    if(key==='other') continue;
    if(words.some(w=>haystack.includes(w))) return { category:key, confidence:'medium' };
  }
  return null;
}

// Badge definitions
export const BADGES = [
  { id:'first_report',  icon:'🌱', label:'First Report',   desc:'Filed your very first civic report', threshold:1  },
  { id:'reporter_5',   icon:'📋', label:'Reporter',        desc:'Filed 5 civic reports',              threshold:5  },
  { id:'eagle_eye',    icon:'🦅', label:'Eagle Eye',       desc:'Filed 10 civic reports',             threshold:10 },
  { id:'civic_hero',   icon:'🏆', label:'Civic Hero',      desc:'Filed 25 civic reports',             threshold:25 },
  { id:'resolver',     icon:'✅', label:'Problem Solver',  desc:'One of your reports was resolved',   threshold:1, type:'resolved' },
  { id:'influencer',   icon:'🔥', label:'Influencer',      desc:'Got 10 upvotes on a single report',  threshold:10, type:'upvotes' },
];

export const IMPACT_MESSAGES = [
  'Your report is helping keep the neighbourhood safer.',
  'Residents nearby will benefit from your vigilance.',
  'Municipal crews are now aware thanks to you.',
  'This fix may reduce accident risk for hundreds of daily commuters.',
  'Your civic action keeps the city running smoothly.',
  'Great catch — this kind of report drives real change.',
];

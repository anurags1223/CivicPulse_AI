import { analyze } from './civic';
const cases = [
 ['demo-001','Deep pothole outside Government School','A dangerous pothole near the school gate needs urgent repair. Riders are swerving into traffic.','roads','critical','Sector 22 · School Road',30.7333,76.7794,'Reported'],
 ['demo-002','Waterlogging at the market crossing','The drain is blocked and flood water is spreading across the market entrance.','drainage','high','Sector 17 · Market',30.7400,76.7820,'In progress'],
 ['demo-003','Streetlights out along the walking route','Three streetlights are dark along the footpath. The area feels unsafe after sunset.','lighting','high','Sector 15 · Community Park',30.7502,76.7712,'Assigned'],
 ['demo-004','Waste collection missed for two days','Garbage bags have collected beside the neighbourhood bins. Please arrange a pickup.','sanitation','medium','Sector 35 · Community Bins',30.7214,76.7662,'Reported'],
 ['demo-005','Leaking water supply pipeline','Water leak from a damaged pipeline is wasting clean water beside the bus stop.','water','medium','Sector 43 · Bus Stand',30.7145,76.7498,'Awaiting confirmation'],
 ['demo-006','Footpath repaired near the community centre','Uneven footpath has been repaired and the walking route is accessible again.','roads','low','Sector 19 · Community Centre',30.7301,76.7931,'Resolved'],
];
export function seeds() { return cases.map(([id,title,description,category,severity,locality,lat,lng,status],index)=>({id,title,description,...analyze({title,description,category,severity}),locality,lat,lng,status,reporter_id:'demo-citizen',is_demo:true,created_at:new Date(Date.now()-(index+1)*7200000).toISOString(),support_count:[18,12,9,6,4,11][index],resolution_note:status==='Awaiting confirmation'?'Pipeline coupling replaced. Inspect the uploaded repair evidence before confirming.':null,events:[{status:'Reported',note:'Synthetic report created for demonstration.',created_at:new Date(Date.now()-(index+1)*7200000).toISOString()}]})); }

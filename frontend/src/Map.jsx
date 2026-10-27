// Map interaction adapted from the supplied React CivicFix LocationPicker.
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
const colors={Critical:'#111111',High:'#555555',Medium:'#888888',Low:'#bbbbbb'};
function Events({onPick}) {useMapEvents({click:e=>onPick?.({lat:e.latlng.lat,lng:e.latlng.lng})});return null;}
function Recenter({point}) {const map=useMap();useEffect(()=>{if(point)map.setView([point.lat,point.lng],map.getZoom());},[point?.lat,point?.lng,map]);return null;}
export default function CivicMap({issues=[],onSelect,onPick,point,large=false}) {
 return <div className={`map ${large?'map-large':''}`}><MapContainer center={point?[point.lat,point.lng]:[30.734,76.778]} zoom={13} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/><Events onPick={onPick}/><Recenter point={point}/>{issues.map(issue=><CircleMarker key={issue.id} center={[issue.lat,issue.lng]} radius={issue.priority==='Critical'?11:8} pathOptions={{color:'white',weight:3,fillColor:colors[issue.priority],fillOpacity:.95}} eventHandlers={{click:()=>onSelect?.(issue)}}><Popup><strong>{issue.title}</strong><br/>{issue.locality}<br/>{issue.priority} · {issue.status}</Popup></CircleMarker>)}{point&&<CircleMarker center={[point.lat,point.lng]} radius={9} pathOptions={{color:'#ffffff',fillColor:'#111111',fillOpacity:1}}/>}</MapContainer></div>;
}

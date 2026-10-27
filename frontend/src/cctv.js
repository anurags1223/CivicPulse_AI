/**
 * Smart City CCTV AI Vision Network
 * Continuously monitors municipal intersections, highways, and school zones.
 * Automatically detects potholes, road flooding, waste overflow, and infrastructure failures.
 */

export const INITIAL_CCTV_CAMERAS = [
  {
    id: 'CAM-HWY-04',
    name: 'Tribune Chowk Flyover · Highway NH-5',
    zone: 'South Arterial Highway',
    lat: 30.7046,
    lng: 76.7985,
    status: 'hazard',
    hazardType: 'Deep Asphalt Pothole · Fast Lane',
    category: 'roads',
    severity: 'critical',
    confidence: 98,
    fps: 30,
    resolution: '1080p · 60Hz',
    vehiclesPerHour: 4200,
    detectedAgo: '3m ago',
    details: 'Heavy vehicle impact caused 85cm asphalt crater in high-speed overtaking lane. High risk of rollover or tire burst for highway commuters.',
    box: { x: 35, y: 56, w: 28, h: 22, label: 'POTHOLE 98%' },
    bgType: 'highway'
  },
  {
    id: 'CAM-SCH22-08',
    name: 'Sector 22-C · Govt Model Senior School Gate',
    zone: 'Institutional School Zone',
    lat: 30.7333,
    lng: 76.7794,
    status: 'hazard',
    hazardType: 'Storm Drain Overflow & Road Waterlogging',
    category: 'drainage',
    severity: 'high',
    confidence: 95,
    fps: 25,
    resolution: '1080p · 50Hz',
    vehiclesPerHour: 1800,
    detectedAgo: '8m ago',
    details: 'Blocked runoff channel causing 15cm standing water across pedestrian crossing. Cyclists and students forced into vehicle lane.',
    box: { x: 22, y: 60, w: 52, h: 25, label: 'WATERLOG 95%' },
    bgType: 'school'
  },
  {
    id: 'CAM-SEC17-02',
    name: 'Sector 17 Central Commercial Plaza · North Entry',
    zone: 'City Center Commercial Hub',
    lat: 30.7410,
    lng: 76.7820,
    status: 'hazard',
    hazardType: 'Commercial Waste Spill & Sidewalk Blockage',
    category: 'sanitation',
    severity: 'medium',
    confidence: 92,
    fps: 30,
    resolution: '4K · 30Hz',
    vehiclesPerHour: 950,
    detectedAgo: '14m ago',
    details: 'Municipal bins overfilled past capacity; solid waste spilling across 4m of public walking corridor.',
    box: { x: 50, y: 46, w: 32, h: 30, label: 'WASTE SPILL 92%' },
    bgType: 'market'
  },
  {
    id: 'CAM-ITP-05',
    name: 'IT Park Expressway · Kishangarh Junction',
    zone: 'Tech Corridor Corridor',
    lat: 30.7230,
    lng: 76.8250,
    status: 'hazard',
    hazardType: 'Streetlight Mast Circuit Failure (Dark Corridor)',
    category: 'lighting',
    severity: 'high',
    confidence: 94,
    fps: 30,
    resolution: '1080p · 60Hz',
    vehiclesPerHour: 3100,
    detectedAgo: '22m ago',
    details: 'Three consecutive high-mast sodium lamps offline. 180m stretch with sub-2-lux illumination at blind curvature.',
    box: { x: 62, y: 18, w: 24, h: 42, label: 'LAMP OUT 94%' },
    bgType: 'night'
  },
  {
    id: 'CAM-SEC43-01',
    name: 'Sector 43 Bus Terminus (ISBT) Approach',
    zone: 'Transit Terminal',
    lat: 30.7160,
    lng: 76.7530,
    status: 'clear',
    hazardType: 'Traffic Normal · Road Clean',
    category: 'other',
    severity: 'low',
    confidence: 99,
    fps: 30,
    resolution: '1080p · 30Hz',
    vehiclesPerHour: 2800,
    detectedAgo: 'Active',
    details: 'No civic hazards detected in the last 60 minutes. Road surface integrity at 98%.',
    box: null,
    bgType: 'terminal'
  }
];

export function generateCCTVReport(cam) {
  return {
    title: `[CCTV AI #${cam.id}] ${cam.hazardType}`,
    description: `Automated Smart City AI incident flagged by Surveillance Camera ${cam.id} (${cam.name}).\n\nAI Detection Details: ${cam.details}\n\nConfidence: ${cam.confidence}% | Density: ${cam.vehiclesPerHour} veh/hr | Coordinates: ${cam.lat}, ${cam.lng}`,
    category: cam.category,
    severity: cam.severity,
    locality: cam.name,
    lat: cam.lat,
    lng: cam.lng,
    reporter_id: 'cctv-system',
    isCctv: true,
    cctvCamId: cam.id
  };
}

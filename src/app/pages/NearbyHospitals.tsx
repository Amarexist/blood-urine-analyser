import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, MapPin, Navigation, Phone, AlertTriangle, Hospital, Loader2, RefreshCw, ExternalLink, Siren, Cross } from 'lucide-react';

interface Facility {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
  emergency?: string;
  openingHours?: string;
}

const RADIUS_KM = 15;

const emergencyHelplines = [
  { name: 'National Emergency', number: '112', description: 'Police, Fire, Ambulance — Universal emergency number', color: '#ef4444', icon: '🚨' },
  { name: 'Ambulance', number: '102', description: 'Government ambulance service (free)', color: '#dc2626', icon: '🚑' },
  { name: 'Emergency Medical (EMRI)', number: '108', description: 'Emergency Response — Ambulance dispatch', color: '#b91c1c', icon: '🏥' },
  { name: 'Disaster Management', number: '1078', description: 'National Disaster Management Helpline', color: '#f97316', icon: '⚠️' },
  { name: 'Women Helpline', number: '1091', description: 'Women in distress — 24/7 helpline', color: '#ec4899', icon: '👩' },
  { name: 'Child Helpline', number: '1098', description: 'Children in need of care & protection', color: '#8b5cf6', icon: '👶' },
  { name: 'Mental Health (iCall)', number: '9152987821', description: 'Psychosocial counseling helpline', color: '#06b6d4', icon: '🧠' },
  { name: 'Poison Control', number: '1800-11-6117', description: 'National Poison Information Centre (AIIMS)', color: '#eab308', icon: '☠️' },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyHospitals() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [filter, setFilter] = useState<'all' | 'hospital' | 'clinic' | 'pharmacy'>('all');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('requesting');
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsStatus('granted');
      },
      (err) => {
        setGpsStatus('denied');
        switch (err.code) {
          case err.PERMISSION_DENIED: setGpsError('Location permission denied. Please enable GPS in your browser settings.'); break;
          case err.POSITION_UNAVAILABLE: setGpsError('Location information is unavailable.'); break;
          case err.TIMEOUT: setGpsError('Location request timed out. Please try again.'); break;
          default: setGpsError('An unknown error occurred while fetching location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!location) return;
    fetchNearbyFacilities(location.lat, location.lon);
  }, [location]);

  const fetchNearbyFacilities = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${RADIUS_KM * 1000},${lat},${lon});
          way["amenity"="hospital"](around:${RADIUS_KM * 1000},${lat},${lon});
          node["amenity"="clinic"](around:${RADIUS_KM * 1000},${lat},${lon});
          way["amenity"="clinic"](around:${RADIUS_KM * 1000},${lat},${lon});
          node["amenity"="pharmacy"](around:${RADIUS_KM * 1000},${lat},${lon});
          way["amenity"="pharmacy"](around:${RADIUS_KM * 1000},${lat},${lon});
        );
        out center body;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const data = await res.json();

      const results: Facility[] = data.elements
        .map((el: any) => {
          const fLat = el.lat ?? el.center?.lat;
          const fLon = el.lon ?? el.center?.lon;
          if (!fLat || !fLon) return null;
          const t = el.tags || {};
          return {
            id: el.id,
            name: t.name || t['name:en'] || `${(t.amenity || 'facility').charAt(0).toUpperCase() + (t.amenity || 'facility').slice(1)}`,
            type: t.amenity || 'hospital',
            lat: fLat,
            lon: fLon,
            distance: haversine(lat, lon, fLat, fLon),
            address: [t['addr:street'], t['addr:city'], t['addr:postcode']].filter(Boolean).join(', ') || undefined,
            phone: t.phone || t['contact:phone'] || undefined,
            emergency: t.emergency || undefined,
            openingHours: t.opening_hours || undefined,
          } as Facility;
        })
        .filter(Boolean)
        .sort((a: Facility, b: Facility) => a.distance - b.distance);

      setFacilities(results);
    } catch {
      setGpsError('Failed to fetch nearby facilities. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? facilities : facilities.filter(f => f.type === filter);

  const typeIcon = (t: string) => t === 'hospital' ? '🏥' : t === 'clinic' ? '🩺' : '💊';
  const typeColor = (t: string) => t === 'hospital' ? '#ef4444' : t === 'clinic' ? '#3b82f6' : '#22c55e';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)' }}>
      {/* Nav */}
      <nav style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', textDecoration: 'none', fontSize: 14, gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hospital size={18} color="#fff" />
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>Nearby Hospitals</span>
        </div>
        <div style={{ width: 100 }} />
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>

        {/* Emergency Helplines */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-glow 2s ease-in-out infinite' }}>
              <Siren size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: 0 }}>Emergency Helplines</h2>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Tap any number to call instantly — available 24/7</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {emergencyHelplines.map(h => (
              <a key={h.number} href={`tel:${h.number}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                  transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${h.color}22`; el.style.borderColor = `${h.color}66`; el.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)'; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: h.color, fontSize: 22, fontWeight: 800, letterSpacing: 1, fontFamily: 'monospace' }}>{h.number}</span>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${h.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={14} color={h.color} />
                    </div>
                  </div>
                  <p style={{ color: '#64748b', fontSize: 11, margin: '6px 0 0', lineHeight: 1.4 }}>{h.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* GPS Section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: 0 }}>Find Hospitals Nearby</h2>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Uses GPS to locate hospitals, clinics & pharmacies within {RADIUS_KM}km</p>
            </div>
          </div>

          {!location && (
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18, padding: 32, textAlign: 'center',
            }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
                <Navigation size={32} color="#fff" />
              </div>
              <h3 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Enable Location Access</h3>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                Allow GPS access to automatically discover hospitals, clinics, and pharmacies near your current location.
              </p>
              <button onClick={requestLocation} disabled={gpsStatus === 'requesting'} style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
                border: 'none', padding: '14px 36px', borderRadius: 14, fontSize: 15, fontWeight: 600,
                cursor: gpsStatus === 'requesting' ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(59,130,246,0.4)', transition: 'all 0.2s',
              }}>
                {gpsStatus === 'requesting' ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Detecting Location...</> : <><MapPin size={18} /> Enable GPS & Find Hospitals</>}
              </button>
            </div>
          )}

          {gpsError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 18px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#ef4444" />
              <span style={{ color: '#fca5a5', fontSize: 13 }}>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Location found — show results */}
        {location && (
          <>
            {/* Location badge + refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '8px 14px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 500 }}>
                  📍 {location.lat.toFixed(4)}, {location.lon.toFixed(4)} — {facilities.length} facilities found within {RADIUS_KM}km
                </span>
              </div>
              <button onClick={() => fetchNearbyFacilities(location.lat, location.lon)} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#94a3b8', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {([['all', '🏛️ All'], ['hospital', '🏥 Hospitals'], ['clinic', '🩺 Clinics'], ['pharmacy', '💊 Pharmacies']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  background: filter === key ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filter === key ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: filter === key ? '#a5b4fc' : '#94a3b8',
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, transition: 'all 0.2s',
                }}>
                  {label} {key !== 'all' ? `(${facilities.filter(f => f.type === key).length})` : `(${facilities.length})`}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader2 size={36} color="#60a5fa" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Searching for nearby hospitals...</p>
              </div>
            )}

            {/* Results */}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
                <p style={{ color: '#64748b', fontSize: 15 }}>No {filter === 'all' ? 'facilities' : filter + 's'} found within {RADIUS_KM}km radius.</p>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map((f, i) => (
                  <div key={f.id} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '18px 20px', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* Rank */}
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${typeColor(f.type)}22`, border: `1px solid ${typeColor(f.type)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 20 }}>{typeIcon(f.type)}</span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <h3 style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{f.name}</h3>
                          <span style={{ background: `${typeColor(f.type)}22`, color: typeColor(f.type), fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{f.type}</span>
                          {f.emergency === 'yes' && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>🚨 Emergency</span>}
                        </div>

                        {f.address && <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>📍 {f.address}</p>}
                        {f.phone && <p style={{ color: '#60a5fa', fontSize: 12, margin: '2px 0 0' }}>📞 <a href={`tel:${f.phone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>{f.phone}</a></p>}
                        {f.openingHours && <p style={{ color: '#94a3b8', fontSize: 11, margin: '2px 0 0' }}>🕐 {f.openingHours}</p>}
                      </div>

                      {/* Distance + directions */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 800 }}>{f.distance < 1 ? `${(f.distance * 1000).toFixed(0)}m` : `${f.distance.toFixed(1)}km`}</div>
                        <div style={{ color: '#64748b', fontSize: 10, marginBottom: 8 }}>away</div>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                            color: '#60a5fa', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textDecoration: 'none',
                          }}>
                          <Navigation size={11} /> Directions
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <div style={{ textAlign: 'center', marginTop: 40, color: '#334155', fontSize: 11, lineHeight: 1.6 }}>
          Hospital data sourced from OpenStreetMap. Information may not be complete or up-to-date.<br />
          In case of a life-threatening emergency, call <strong style={{ color: '#ef4444' }}>112</strong> or <strong style={{ color: '#ef4444' }}>108</strong> immediately.
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

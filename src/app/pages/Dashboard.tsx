import { Link } from 'react-router';
import { Activity, ClipboardList, Heart, ShoppingBag, ExternalLink, Pill, Stethoscope, Truck } from 'lucide-react';

const pharmacies = [
  {
    name: '1mg',
    tagline: 'India\'s most trusted online pharmacy',
    description: 'Order medicines, health products, lab tests & doctor consultations.',
    url: 'https://www.1mg.com',
    color: 'from-red-500 to-orange-500',
    badge: '🏆 Most Trusted',
    features: ['Genuine Medicines', 'Lab Tests at Home', 'Doctor Consultation'],
  },
  {
    name: 'PharmEasy',
    tagline: 'Medicine delivery in 2 hours',
    description: 'Upload prescription & get medicines delivered at your doorstep fast.',
    url: 'https://pharmeasy.in',
    color: 'from-green-500 to-emerald-600',
    badge: '⚡ Fastest Delivery',
    features: ['2-Hour Delivery', 'Easy Prescription Upload', 'Health Packages'],
  },
  {
    name: 'Netmeds',
    tagline: 'India ki pharmacy',
    description: 'Medicines, wellness products, and health essentials at best prices.',
    url: 'https://www.netmeds.com',
    color: 'from-blue-500 to-indigo-600',
    badge: '💰 Best Prices',
    features: ['Flat 20% Off', 'Wellness Products', 'Verified Medicines'],
  },
  {
    name: 'Apollo Pharmacy',
    tagline: 'Trusted healthcare since 1983',
    description: 'Pan-India network with 5000+ stores & same-day delivery.',
    url: 'https://www.apollopharmacy.in',
    color: 'from-violet-500 to-purple-600',
    badge: '🏥 Hospital Grade',
    features: ['Same-Day Delivery', '5000+ Stores', 'Apollo Health Pass'],
  },
];

export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={20} color="#fff" />
        </div>
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 20, letterSpacing: -0.5 }}>HealthTrack AI</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
            <Stethoscope size={14} color="#60a5fa" />
            <span style={{ color: '#60a5fa', fontSize: 13, fontWeight: 500 }}>Your Personal Health Companion</span>
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: 42, fontWeight: 800, margin: '0 0 12px', letterSpacing: -1 }}>
            Welcome to Your <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Health Dashboard</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 17, maxWidth: 540, margin: '0 auto' }}>
            Analyze your blood &amp; urine reports, get AI-powered insights, and take care of your mental wellness — all in one place.
          </p>
        </div>

        {/* Main Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 56 }}>

          {/* Manual Entry */}
          <Link to="/manual-entry" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              borderRadius: 20, padding: 28, cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(124,58,237,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(124,58,237,0.3)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={24} color="#fff" />
                </div>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>🔬 AI Powered</span>
              </div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Manual Entry</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
                Enter your blood &amp; urine test values and get instant AI-powered disease predictions with personalized recommendations.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['18 Blood Params', '12 Urine Params', '25+ Diseases'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: 11, padding: '3px 10px', borderRadius: 10 }}>{tag}</span>
                ))}
              </div>
            </div>
          </Link>

          {/* Wellness Chat */}
          <Link to="/wellness-chat" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0891b2, #0d9488)',
              borderRadius: 20, padding: 28, cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 8px 32px rgba(8,145,178,0.3)',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(8,145,178,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(8,145,178,0.3)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={24} color="#fff" />
                </div>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>🌿 Feel Better</span>
              </div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Wellness Chat</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
                Talk to Serena — your AI wellness companion. Get support for anxiety, stress, and emotional wellbeing anytime.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Anxiety Relief', 'Breathing Exercises', '24/7 Support'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: 11, padding: '3px 10px', borderRadius: 10 }}>{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        </div>

        {/* Online Pharmacy Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pill size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Online Pharmacy</h2>
              <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Order medicines, supplements &amp; health products online</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '8px 14px', width: 'fit-content' }}>
            <Truck size={13} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontSize: 12 }}>These are trusted external pharmacy partners. Links open in a new tab.</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {pharmacies.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18, padding: 22, cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s, background 0.2s',
                backdropFilter: 'blur(10px)',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.borderColor = 'rgba(255,255,255,0.2)'; el.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${p.color.replace('from-', '').replace('to-', '').split(' ')[0]}, ${p.color.replace('from-', '').replace('to-', '').split(' ')[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={20} color="#fff" />
                  </div>
                  <ExternalLink size={14} color="#64748b" />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 8, marginBottom: 6 }}>{p.badge}</span>
                </div>
                <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{p.name}</h3>
                <p style={{ color: '#60a5fa', fontSize: 12, margin: '0 0 8px', fontWeight: 500 }}>{p.tagline}</p>
                <p style={{ color: '#64748b', fontSize: 12.5, lineHeight: 1.5, margin: '0 0 14px' }}>{p.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: '8px 14px', background: `linear-gradient(135deg, var(--from), var(--to))`, borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>Visit {p.name} →</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: 48, color: '#334155', fontSize: 12 }}>
          HealthTrack AI — For informational purposes only. Always consult a licensed physician before purchasing or taking any medication.
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Send, Heart, Wind, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  from: 'user' | 'serena';
  text: string;
  time: string;
  type?: 'text' | 'breathe' | 'exercise';
}

interface QuickReply { label: string; value: string; }

// ── Response Engine ──────────────────────────────────────────────────────────
const responses: { patterns: string[]; replies: string[]; followUp?: string }[] = [
  {
    patterns: ['anxious', 'anxiety', 'panic', 'panicking', 'worried', 'worry', 'overthinking'],
    replies: [
      "I hear you. Anxiety can feel so overwhelming — like your mind won't slow down. You're not alone in this, and what you're feeling is valid. 💙",
      "When anxiety hits, our body goes into overdrive. Let's slow it down together. Would you like to try a quick breathing exercise? It really helps calm the nervous system.",
      "You're braver than you think. Anxiety lies to us — it makes things feel bigger and scarier than they are. Right now, you're safe. Let's breathe through this together.",
    ],
    followUp: 'breathe',
  },
  {
    patterns: ['stress', 'stressed', 'overwhelmed', 'burnout', 'exhausted', 'too much', 'cant cope'],
    replies: [
      "Feeling overwhelmed is your mind's way of saying you've been strong for too long. It's okay to pause. You don't have to carry everything at once. 🌿",
      "Stress is real, and it's heavy. One thing that helps: break it into tiny pieces. What is the ONE smallest thing you can handle right now? Just one. 💛",
      "You've survived every difficult day so far — that's a 100% track record. Today will be no different. Take a breath. You've got this.",
    ],
  },
  {
    patterns: ['sad', 'sadness', 'crying', 'depressed', 'depression', 'hopeless', 'empty', 'numb'],
    replies: [
      "I'm so glad you're talking to me. Sadness can feel really heavy, but you don't have to carry it alone. I'm here, and I'm listening. 💜",
      "It's completely okay to cry. Tears are how our body releases what words can't express. Be gentle with yourself today — you deserve that kindness.",
      "Even on your darkest days, you matter. Your feelings are real and valid. If things ever feel too heavy, please reach out to a mental health professional — they can help in ways I can't.",
    ],
  },
  {
    patterns: ['lonely', 'alone', 'isolated', 'nobody', 'no one', 'no friends'],
    replies: [
      "Loneliness is one of the hardest feelings. But right now, you're here, and I'm here with you. You are not invisible — you matter. 🌸",
      "Sometimes loneliness makes us feel like we're the only ones struggling, but so many people feel exactly this way. Reaching out — even to me — takes courage. I see you.",
      "You deserve connection and warmth. Is there one small step you could take today — a message to someone, a walk outside, or even a kind note to yourself?",
    ],
  },
  {
    patterns: ['angry', 'anger', 'furious', 'frustrated', 'rage', 'irritated'],
    replies: [
      "Anger is energy — it's telling you something matters to you. That's not bad. Let's find a healthy way to release it. Have you tried the 4-7-8 breathing technique? 🔥",
      "It's okay to be angry. What you're feeling is human. Can you tell me what's frustrating you? Sometimes just saying it out loud helps.",
      "When we're angry, our body is in fight mode. Let's gently bring it back. Try this: clench your fists tight for 5 seconds, then release. Feel that tension melt away.",
    ],
    followUp: 'breathe',
  },
  {
    patterns: ['cant sleep', 'insomnia', 'sleep', 'tired', 'fatigue', 'sleepless'],
    replies: [
      "Poor sleep is so draining — it affects everything. Your body is asking for rest. Tonight, try keeping your phone away 30 minutes before bed and do some gentle stretching. 🌙",
      "A bedtime ritual can really help. Try: dim lights → warm drink → 5 deep breaths → gratitude journal. Your mind needs a 'wind down' signal that sleep is coming.",
      "If racing thoughts keep you awake, try the '5-4-3-2-1' grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
    ],
  },
  {
    patterns: ['breathe', 'breathing', 'calm down', 'relax', 'exercise', 'meditation'],
    replies: [
      "Let's do this together. 🌬️ Try the **4-7-8 technique**: Breathe IN for 4 counts... Hold for 7 counts... Breathe OUT slowly for 8 counts. Repeat 3 times. Want me to guide you through it?",
      "Breathing is the fastest way to calm your nervous system. Let's try: breathe in slowly for 4 counts, hold for 4, out for 4. This is called 'box breathing' — it's used by Navy SEALs to stay calm under pressure. 💪",
    ],
    followUp: 'breathe',
  },
  {
    patterns: ['happy', 'good', 'great', 'amazing', 'wonderful', 'fantastic', 'excited', 'better'],
    replies: [
      "That genuinely makes me smile! 😊 I love hearing that. What's brought this good energy today? Tell me more!",
      "Yes! That positive energy is so precious — hold onto it. You deserve every bit of happiness coming your way. 🌟",
      "Wonderful! On good days, it's beautiful to take a moment and notice what's right. Savour this feeling — your mind will remember it.",
    ],
  },
  {
    patterns: ['grateful', 'gratitude', 'thankful', 'blessed'],
    replies: [
      "Gratitude is so powerful — science shows it literally rewires the brain toward happiness. What are you grateful for today? 🌻",
      "That's beautiful. Gratitude shifts our focus from what's missing to what's present. You're already practicing one of the most powerful mental health tools there is.",
    ],
  },
  {
    patterns: ['hello', 'hi', 'hey', 'hiya', 'howdy', 'good morning', 'good evening', 'good night'],
    replies: [
      "Hello! I'm Serena, your wellness companion. 🌿 I'm here to listen, support, and help you feel a little lighter. How are you feeling right now?",
      "Hi there! So glad you're here. 💙 I'm Serena — think of me as a calm, caring friend. What's on your mind today?",
    ],
  },
  {
    patterns: ['who are you', 'what are you', 'are you ai', 'are you a bot', 'are you human'],
    replies: [
      "I'm Serena — an AI wellness companion. 🌸 I'm not a replacement for therapy or medical care, but I'm here to listen, offer gentle support, and remind you that you matter. What can I help you with today?",
    ],
  },
  {
    patterns: ['help', 'what can you do', 'how can you help'],
    replies: [
      "I'm here to support you! 💛 I can:\n• Listen and offer a safe space to vent\n• Guide you through breathing exercises\n• Share calming techniques for anxiety and stress\n• Offer gentle encouragement when you're feeling low\n\nWhat would you like to talk about?",
    ],
  },
  {
    patterns: ['suicide', 'kill myself', 'end my life', 'want to die', 'dont want to live'],
    replies: [
      "I hear you, and I'm truly concerned about you. Please know you are not alone, and this pain can get better. 💙\n\n**Please reach out right now:**\n• iCall India: 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7)\n• International: befrienders.org\n\nYou deserve support from someone trained to help. Please make that call.",
    ],
  },
];

const defaultReplies = [
  "I'm listening. Tell me more — I'm here for you. 💙",
  "That sounds really hard. You don't have to face it alone. Can you share a little more about what you're feeling?",
  "Thank you for trusting me with this. How long have you been feeling this way?",
  "I hear you. Sometimes just putting words to feelings is the first step. You're doing great by talking about it. 🌿",
];

const quickReplies: QuickReply[] = [
  { label: '😟 I feel anxious', value: 'I am feeling very anxious' },
  { label: '😔 I feel sad', value: 'I am feeling really sad today' },
  { label: '😤 I feel stressed', value: 'I am completely overwhelmed with stress' },
  { label: '😴 I can\'t sleep', value: 'I cannot sleep at all lately' },
  { label: '🌬️ Breathing exercise', value: 'Can you guide me through a breathing exercise' },
  { label: '😊 I feel good today', value: 'I am feeling happy and good today' },
];

function getResponse(input: string): { text: string; followUp?: string } {
  const lower = input.toLowerCase();
  for (const r of responses) {
    if (r.patterns.some(p => lower.includes(p))) {
      const text = r.replies[Math.floor(Math.random() * r.replies.length)];
      return { text, followUp: r.followUp };
    }
  }
  return { text: defaultReplies[Math.floor(Math.random() * defaultReplies.length)] };
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const uid = () => Math.random().toString(36).slice(2);

// ── Breathing Guide ──────────────────────────────────────────────────────────
function BreathingGuide({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (cycles >= 3) return;
    const phases: { phase: 'in' | 'hold' | 'out'; duration: number; scale: number }[] = [
      { phase: 'in', duration: 4, scale: 1.5 },
      { phase: 'hold', duration: 7, scale: 1.5 },
      { phase: 'out', duration: 8, scale: 1 },
    ];
    let current = 0;
    let remaining = phases[0].duration;
    setPhase(phases[0].phase);
    setCount(phases[0].duration);
    setScale(phases[0].scale);

    const timer = setInterval(() => {
      remaining--;
      setCount(remaining);
      if (remaining <= 0) {
        current = (current + 1) % 3;
        if (current === 0) setCycles(c => c + 1);
        remaining = phases[current].duration;
        setPhase(phases[current].phase);
        setCount(phases[current].duration);
        setScale(phases[current].scale);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cycles]);

  const label = phase === 'in' ? 'Breathe In' : phase === 'hold' ? 'Hold' : 'Breathe Out';
  const phaseColor = phase === 'in' ? '#60a5fa' : phase === 'hold' ? '#a78bfa' : '#34d399';

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', borderRadius: 20, padding: 32, textAlign: 'center', color: '#fff', maxWidth: 340, margin: '0 auto' }}>
      <p style={{ marginBottom: 8, fontSize: 14, color: '#94a3b8' }}>4 — 7 — 8 Breathing</p>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, marginBottom: 16 }}>
        {[1.8, 1.4, 1].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 80 * s, height: 80 * s,
            borderRadius: '50%',
            background: phaseColor,
            opacity: 0.15 - i * 0.04,
            transform: `scale(${scale})`,
            transition: `transform ${phase === 'in' ? 4 : phase === 'hold' ? 0.3 : 8}s ease-in-out`,
          }}/>
        ))}
        <div style={{
          position: 'relative', zIndex: 1,
          width: 80, height: 80, borderRadius: '50%',
          background: phaseColor, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          transform: `scale(${scale})`,
          transition: `transform ${phase === 'in' ? 4 : phase === 'hold' ? 0.3 : 8}s ease-in-out`,
          boxShadow: `0 0 30px ${phaseColor}66`,
        }}>
          <span style={{ fontSize: 26, fontWeight: 700 }}>{count}</span>
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, color: phaseColor }}>{label}</p>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
        {cycles < 3 ? `Cycle ${cycles + 1} of 3` : '✅ Exercise complete! Well done. 💙'}
      </p>
      <button onClick={onClose} style={{
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 14,
      }}>
        {cycles >= 3 ? 'Back to Chat' : 'Exit Exercise'}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WellnessChat() {
  const [messages, setMessages] = useState<Message[]>([{
    id: uid(), from: 'serena', time: now(),
    text: "Hello! I'm **Serena**, your personal wellness companion. 🌿\n\nI'm here to listen without judgment, support you through tough moments, and help you find calm. How are you feeling right now?",
  }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showBreath, setShowBreath] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing, showBreath]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: uid(), from: 'user', text: text.trim(), time: now() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);

    const delay = 900 + Math.random() * 800;
    setTimeout(() => {
      const { text: reply, followUp } = getResponse(text);
      const botMsg: Message = { id: uid(), from: 'serena', text: reply, time: now() };
      setMessages(m => [...m, botMsg]);
      setTyping(false);
      if (followUp === 'breathe') {
        setTimeout(() => setShowBreath(true), 600);
      }
    }, delay);
  };

  const renderText = (text: string) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line.replace(/\*\*(.*?)\*\*/g, (_: string, m: string) => m).split(/\*\*(.*?)\*\*/g).map((part: string, j: number) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', textDecoration: 'none', fontSize: 14, gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15 }}>Serena</div>
            <div style={{ color: '#4ade80', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Here for you
            </div>
          </div>
        </div>
        <button onClick={() => setShowBreath(!showBreath)} style={{
          background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)',
          color: '#60a5fa', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Wind size={14} /> Breathe
        </button>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 16px' }}>

        {/* Breathing overlay */}
        {showBreath && (
          <div style={{ padding: '24px 0' }}>
            <BreathingGuide onClose={() => setShowBreath(false)} />
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, paddingTop: 20, paddingBottom: 8 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
              {msg.from === 'serena' && (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0, alignSelf: 'flex-end' }}>
                  <Heart size={14} color="#fff" />
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.from === 'user'
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.07)',
                  border: msg.from === 'serena' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  color: '#f1f5f9',
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  backdropFilter: 'blur(10px)',
                }}>
                  {renderText(msg.text)}
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4, textAlign: msg.from === 'user' ? 'right' : 'left', paddingLeft: msg.from === 'serena' ? 4 : 0 }}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={14} color="#fff" />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px 18px 18px 4px', padding: '14px 18px', display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#60a5fa',
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Replies */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 12 }}>
          {quickReplies.map(q => (
            <button key={q.value} onClick={() => sendMessage(q.value)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#cbd5e1', padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(96,165,250,0.15)'; (e.target as HTMLElement).style.color = '#93c5fd'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.target as HTMLElement).style.color = '#cbd5e1'; }}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 24, alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Share what's on your mind..."
            style={{
              flex: 1, padding: '14px 18px', borderRadius: 16,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#f1f5f9', fontSize: 14.5, outline: 'none',
              backdropFilter: 'blur(10px)',
            }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()} style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            flexShrink: 0,
          }}>
            <Send size={18} color={input.trim() ? '#fff' : '#475569'} />
          </button>
        </div>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

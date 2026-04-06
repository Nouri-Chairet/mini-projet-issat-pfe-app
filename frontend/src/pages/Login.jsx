import React, { useState } from 'react';
import { users } from '../data/mockData';

const roles = [
  { key: 'chef', label: 'Chef de département', icon: '◈', accent: '#00e5a0', desc: 'Gérer les PFE, jurys et plannings' },
  { key: 'enseignant', label: 'Enseignant', icon: '◆', accent: '#ff6b35', desc: 'Encadrer, disponibilités, jurys' },
  { key: 'etudiant', label: 'Étudiant', icon: '◉', accent: '#7c9eff', desc: 'Suivre mon PFE et ma soutenance' },
];

export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accent = selectedRole ? roles.find(r => r.key === selectedRole)?.accent : '#00e5a0';

  const handleSubmit = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = users.find(u => u.email === email && u.password === password && u.role === selectedRole);
      if (user) { onLogin(user); }
      else { setError('Identifiants incorrects ou rôle incompatible.'); }
      setLoading(false);
    }, 700);
  };

  const quickLogin = (role) => {
    const u = users.find(u => u.role === role);
    if (u) onLogin(u);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden', padding: 20
    }}>
      {/* Animated background geometry */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`, transition: 'background 0.6s ease' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,158,255,0.05) 0%, transparent 70%)' }} />
        {/* Grid lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Corner bracket top-left */}
        <div style={{ position: 'absolute', top: 32, left: 32, width: 48, height: 48, borderTop: '1px solid rgba(255,255,255,0.15)', borderLeft: '1px solid rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', bottom: 32, right: 32, width: 48, height: 48, borderBottom: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="fu" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '6px 16px', border: '1px solid var(--border2)', borderRadius: 40, background: 'var(--surface)' }}>
            <span style={{ color: accent, fontSize: 16, transition: 'color 0.4s' }}>◈</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', letterSpacing: '2px', textTransform: 'uppercase' }}>Université — Dépt. Informatique</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,6vw,64px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', color: 'var(--text)' }}>
            Gestion<span style={{ color: accent, transition: 'color 0.4s', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}> PFE</span>
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Session 2024 — 2025</p>
        </div>

        {/* Role cards */}
        <div className="fu1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          {roles.map(r => (
            <button
              key={r.key}
              onClick={() => { setSelectedRole(r.key); setEmail(''); setPassword(''); setError(''); }}
              style={{
                padding: '24px 20px', border: `1px solid ${selectedRole === r.key ? r.accent + '60' : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)', background: selectedRole === r.key ? r.accent + '08' : 'var(--surface)',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                transform: selectedRole === r.key ? 'translateY(-3px)' : 'none',
                boxShadow: selectedRole === r.key ? `0 8px 32px ${r.accent}20` : 'none',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={e => { if (selectedRole !== r.key) e.currentTarget.style.borderColor = r.accent + '30'; }}
              onMouseLeave={e => { if (selectedRole !== r.key) e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {selectedRole === r.key && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: r.accent, borderRadius: '2px 2px 0 0' }} />}
              <div style={{ fontSize: 24, color: r.accent, marginBottom: 12 }}>{r.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 5 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{r.desc}</div>
            </button>
          ))}
        </div>

        {/* Login form */}
        {selectedRole && (
          <div className="fu" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r-lg)', padding: '28px 32px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={`ex: ${users.find(u => u.role === selectedRole)?.email || ''}`}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg2)', border: `1px solid ${error ? 'var(--danger)30' : 'var(--border2)'}`, borderRadius: 'var(--r-md)', color: 'var(--text)', outline: 'none', transition: 'border 0.2s' }}
                  onFocus={e => e.target.style.borderColor = accent + '80'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>Mot de passe</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg2)', border: `1px solid ${error ? 'var(--danger)30' : 'var(--border2)'}`, borderRadius: 'var(--r-md)', color: 'var(--text)', outline: 'none', transition: 'border 0.2s' }}
                  onFocus={e => e.target.style.borderColor = accent + '80'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
            </div>
            {error && <div style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}
            <button
              onClick={handleSubmit}
              style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 'var(--r-md)', background: accent, color: '#000', fontWeight: 700, fontSize: 14, letterSpacing: '0.5px', transition: 'opacity 0.2s, transform 0.1s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? '···' : 'Connexion →'}
            </button>
          </div>
        )}

        {/* Quick access hint */}
        <div className="fu2" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Accès rapide démo</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {roles.map(r => (
              <button key={r.key} onClick={() => quickLogin(r.key)} style={{ padding: '7px 16px', border: `1px solid ${r.accent}30`, borderRadius: 40, background: 'transparent', color: r.accent, fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = r.accent + '15'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >{r.icon} {r.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

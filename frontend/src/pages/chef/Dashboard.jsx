import React from 'react';
import { sujets, enseignants } from '../../data/mockData';
import { Stat, StatusTag, Avatar, Btn } from '../../components/UI';

const A = 'var(--chef-accent)';

export default function ChefDashboard({ onNav }) {
  const planifies = sujets.filter(s => s.statut === 'planifié').length;
  const valides = sujets.filter(s => s.statut === 'validé').length;
  const enAttente = sujets.filter(s => s.statut === 'en attente').length;
  const sansJury = sujets.filter(s => s.jury.length === 0).length;

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1200 }}>
      {/* Hero */}
      <div className="fu" style={{ marginBottom: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>◈ Vue d'ensemble</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, color: 'var(--text)' }}>
            Tableau de<br/>
            <span style={{ color: A, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>bord</span>
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {sujets.length} sujets · Session 2024–2025
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => onNav('sujets')} accent={A} variant="ghost">+ Nouveau sujet</Btn>
          <Btn onClick={() => onNav('export')} accent={A}>Exporter PDF →</Btn>
        </div>
      </div>

      {/* Stats grid */}
      <div className="fu1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 36 }}>
        <Stat label="Total sujets" value={sujets.length} accent={A} sub="↑ +3 cette session" />
        <Stat label="Planifiés" value={planifies} accent="var(--etu-accent)" sub={`${Math.round(planifies/sujets.length*100)}% du total`} />
        <Stat label="Validés" value={valides} accent={A} sub="Soutenances terminées" />
        <Stat label="En attente" value={enAttente} accent="var(--warning)" sub={`${sansJury} sans jury`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Sujets list */}
        <div className="fu2" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Sujets récents</span>
            <button onClick={() => onNav('sujets')} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, background: 'none', border: 'none', cursor: 'pointer' }}>Voir tout →</button>
          </div>
          {sujets.map((s, i) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
              borderBottom: i < sujets.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar initials={s.etudiant.avatar} accent={A} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.titre}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.etudiant.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {s.datePresentation && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{new Date(s.datePresentation).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</span>}
                <StatusTag statut={s.statut} />
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="fu3" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Alerts */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '20px 22px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)', marginBottom: 14 }}>Alertes système</div>
            {[
              { text: `${sansJury} sujet(s) sans jury attribué`, color: 'var(--warning)', icon: '▲' },
              { text: `${enAttente} soutenance(s) non planifiée(s)`, color: 'var(--danger)', icon: '●' },
              { text: '80% des disponibilités saisies', color: A, icon: '✓' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: a.color, fontSize: 10 }}>{a.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{a.text}</span>
              </div>
            ))}
          </div>

          {/* Enseignants */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '20px 22px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)', marginBottom: 14 }}>Charge enseignants</div>
            {enseignants.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar initials={e.avatar} accent="var(--ens-accent)" size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                  <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(e.nbSujets / 3) * 100}%`, background: 'var(--ens-accent)', borderRadius: 2 }} />
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{e.nbSujets * 3} sessions</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Planning', icon: '▤', page: 'planning' },
              { label: 'Jurys', icon: '◈', page: 'jurys' },
              { label: 'Forum', icon: '◎', page: 'forum' },
              { label: 'Export', icon: '↓', page: 'export' },
            ].map(a => (
              <button key={a.page} onClick={() => onNav(a.page)} style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = A + '40'; e.currentTarget.style.background = 'var(--chef-dim)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <span style={{ color: A, fontSize: 18 }}>{a.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

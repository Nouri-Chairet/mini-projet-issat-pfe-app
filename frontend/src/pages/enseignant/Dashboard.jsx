import React, { useState } from 'react';
import { sujets, enseignants } from '../../data/mockData';
import { Stat, StatusTag, Avatar, Btn } from '../../components/UI';

const A = 'var(--ens-accent)';

export default function EnseignantDashboard({ user, onNav }) {
  const prof = enseignants.find(e => e.name === user.name) || enseignants[0];
  const mesSujets = sujets.filter(s => s.encadreur.name === user.name);
  const mesJurys = sujets.filter(s => s.jury.some(j => j.name === user.name));
  const total = mesSujets.length + mesJurys.length;

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1100 }}>
      {/* Hero */}
      <div className="fu" style={{ marginBottom: 44 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>◆ Espace enseignant</div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05 }}>
          Bonjour,<br />
          <span style={{ color: A, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>{user.name.split(' ').slice(-1)[0]}</span>
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {mesSujets.length} sujet(s) encadré(s) · {total} participations totales
        </p>
      </div>

      {/* Stats */}
      <div className="fu1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 36 }}>
        <Stat label="Sujets encadrés" value={mesSujets.length} accent={A} sub={`${mesSujets.length * 3} participations requises`} />
        <Stat label="Jurys assignés" value={mesJurys.length} accent="var(--etu-accent)" sub="Comme président ou rapporteur" />
        <Stat label="Disponibilités" value={prof?.disponibilites?.length || 0} accent="var(--chef-accent)" sub="Dates déclarées" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Mes sujets */}
        <div className="fu2">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 }}>◆ Sujets encadrés</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mesSujets.length === 0 && <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Aucun sujet encadré</div>}
            {mesSujets.map(s => (
              <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '18px 22px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = A + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <Avatar initials={s.etudiant.avatar} accent={A} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 4 }}>{s.titre}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>{s.etudiant.name}</div>
                  </div>
                  <StatusTag statut={s.statut} />
                </div>
                {s.datePresentation && (
                  <div style={{ display: 'flex', gap: 20, padding: '10px 0 0', borderTop: '1px solid var(--border)' }}>
                    {[
                      ['DATE', new Date(s.datePresentation).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})],
                      ['HEURE', s.heure],
                      ['SALLE', s.salle],
                    ].map(([k,v]) => (
                      <div key={k}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{k}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: A, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Jurys */}
          {mesJurys.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--etu-accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 }}>● Participations jury</div>
              {mesJurys.map(s => {
                const role = s.jury.find(j => j.name === user.name)?.role;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 10 }}>
                    <Avatar initials={s.etudiant.avatar} accent="var(--etu-accent)" size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.etudiant.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{s.datePresentation ? new Date(s.datePresentation).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '—'}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: role==='président'?'var(--warning)':'var(--etu-accent)', border: `1px solid ${role==='président'?'var(--warning)':'var(--etu-accent)'}40`, padding: '3px 10px', borderRadius: 40 }}>{role}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="fu3" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Disponibilités */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mes disponibilités</div>
              <button onClick={() => onNav('disponibilites')} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, background: 'none', border: 'none', cursor: 'pointer' }}>Modifier →</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(prof?.disponibilites || []).map(d => (
                <span key={d} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '6px 12px', borderRadius: 40, background: 'var(--ens-dim)', color: A, border: `1px solid ${A}30` }}>
                  {new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                </span>
              ))}
            </div>
          </div>

          {/* Règle participation */}
          <div style={{ background: 'var(--surface)', border: `1px solid ${A}20`, borderRadius: 'var(--r-xl)', padding: '20px 22px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Règle de participation</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: A, letterSpacing: '-2px' }}>{mesSujets.length}</span>
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>sujet(s) × 3 =</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px' }}>{mesSujets.length * 3}</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (total / Math.max(1, mesSujets.length * 3)) * 100)}%`, background: A, borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              {total}/{mesSujets.length * 3} participations effectuées
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['Planning','▤','planning'],['Forum','◎','forum'],['Disponibilités','◌','disponibilites']].map(([l,ic,p]) => (
              <button key={p} onClick={() => onNav(p)} style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s', textAlign: 'left', gridColumn: l==='Disponibilités'?'span 2':'auto' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = A + '40'; e.currentTarget.style.background = 'var(--ens-dim)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <span style={{ color: A, fontSize: 16 }}>{ic}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{l}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

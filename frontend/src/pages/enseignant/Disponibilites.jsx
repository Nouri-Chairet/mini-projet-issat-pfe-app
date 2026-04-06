import React, { useState } from 'react';
import { enseignants } from '../../data/mockData';
import { Btn } from '../../components/UI';

const A = 'var(--ens-accent)';
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS = ['D','L','M','M','J','V','S'];

export default function EnseignantDisponibilites({ user }) {
  const prof = enseignants.find(e => e.name === user.name) || enseignants[0];
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selected, setSelected] = useState(new Set(prof?.disponibilites || []));
  const [saved, setSaved] = useState(false);

  const first = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month+1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length: lastDay}, (_,i) => i+1)];

  const toggleDay = (day) => {
    const str = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const next = new Set(selected);
    if (next.has(str)) next.delete(str); else next.add(str);
    setSelected(next);
    setSaved(false);
  };

  const dateStr = d => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const allDates = [...selected].sort();

  return (
    <div style={{ padding: '36px 40px', maxWidth: 900 }}>
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>◌ Calendrier</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px' }}>Mes <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: A, fontWeight: 400 }}>disponibilités</span></h1>
          <p style={{ color: 'var(--text2)', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{selected.size} jour(s) sélectionné(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn accent={A} variant="ghost" onClick={() => setSelected(new Set())}>Réinitialiser</Btn>
          <Btn accent={A} onClick={() => setSaved(true)}>{saved ? '✓ Sauvegardé' : 'Sauvegarder'}</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* Calendar */}
        <div className="fu1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <button onClick={() => month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border2)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 18 }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 17 }}>{MONTHS[month]} {year}</span>
            <button onClick={() => month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border2)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 18 }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
            {DAYS.map((d,i) => <div key={i} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const ds = dateStr(day);
              const isSel = selected.has(ds);
              const isWeekend = (new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6);
              return (
                <button key={i} onClick={() => !isWeekend && toggleDay(day)} style={{
                  aspectRatio: '1', minHeight: 42, borderRadius: 10, border: isSel ? `1px solid ${A}` : '1px solid transparent',
                  background: isSel ? 'var(--ens-dim)' : 'transparent',
                  color: isWeekend ? 'var(--text3)' : isSel ? A : 'var(--text)',
                  cursor: isWeekend ? 'not-allowed' : 'pointer', fontSize: 13,
                  fontWeight: isSel ? 700 : 400,
                  transition: 'all 0.12s',
                  position: 'relative'
                }}
                  onMouseEnter={e => { if (!isSel && !isWeekend) e.currentTarget.style.background = 'rgba(255,107,53,0.05)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {day}
                  {isSel && <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: A }} />}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
            <span>● Sélectionné</span>
            <span style={{ opacity: 0.4 }}>Cliquer pour (dé)sélectionner</span>
          </div>
        </div>

        {/* Selected list */}
        <div className="fu2">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Dates sélectionnées</div>
          {allDates.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Aucune date sélectionnée</div>
          ) : allDates.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: `1px solid ${A}25`, borderRadius: 'var(--r-md)', marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: A, fontWeight: 600 }}>
                  {new Date(d).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                </span>
              </div>
              <button onClick={() => { const n = new Set(selected); n.delete(d); setSelected(n); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
          ))}

          {saved && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(0,229,160,0.06)', border: '1px solid var(--chef-accent)30', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--chef-accent)' }}>
              ✓ Disponibilités sauvegardées
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { sujets, enseignants } from '../../data/mockData';
import { StatusTag, Avatar, Btn } from '../../components/UI';

const A = 'var(--chef-accent)';
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS = ['D','L','M','M','J','V','S'];
const planifies = sujets.filter(s => s.datePresentation);

function getPres(y, m, d) {
  const str = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return planifies.filter(s => s.datePresentation === str);
}

export default function ChefPlanning() {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('cal');

  const first = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month+1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length: lastDay}, (_,i) => i+1)];

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1100 }}>
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>▤ Planning</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px' }}>Soutenances <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: A, fontWeight: 400 }}>2025</span></h1>
        </div>
        <Btn accent={A}>⚡ Générer automatiquement</Btn>
      </div>

      {/* Tabs */}
      <div className="fu1" style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 40, padding: 4, marginBottom: 24, gap: 4 }}>
        {[['cal','Calendrier'],['list','Liste'],['dispo','Disponibilités']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 20px', borderRadius: 40, border: 'none', background: tab===id ? A : 'transparent', color: tab===id ? '#000' : 'var(--text2)', fontWeight: tab===id ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'cal' && (
        <div className="fu2" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 28 }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <button onClick={() => month===0 ? (setMonth(11),setYear(y=>y-1)) : setMonth(m=>m-1)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border2)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{MONTHS[month]} {year}</span>
              <button onClick={() => month===11 ? (setMonth(0),setYear(y=>y+1)) : setMonth(m=>m+1)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border2)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
              {DAYS.map((d,i) => <div key={i} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', padding: '4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const pres = getPres(year, month, day);
                const isSel = selected === day;
                return (
                  <button key={i} onClick={() => setSelected(day === selected ? null : day)} style={{
                    aspectRatio: '1', borderRadius: 10, border: isSel ? `1px solid ${A}` : '1px solid transparent',
                    background: isSel ? 'var(--chef-dim)' : pres.length ? 'rgba(0,229,160,0.04)' : 'transparent',
                    color: isSel ? A : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: isSel ? 700 : 400,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.12s', minHeight: 46
                  }}>
                    {day}
                    {pres.length > 0 && <div style={{ display: 'flex', gap: 2 }}>{pres.map((_,pi) => <div key={pi} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? A : A + '80' }} />)}</div>}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Day detail */}
          <div>
            {selected && getPres(year, month, selected).length > 0 ? getPres(year, month, selected).map(s => (
              <div key={s.id} style={{ background: 'var(--surface)', border: `1px solid ${A}25`, borderRadius: 'var(--r-xl)', padding: '20px 22px', marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: A, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>{s.heure} · {s.salle}</div>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 12 }}>{s.titre}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Avatar initials={s.etudiant.avatar} accent={A} size={26} />
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.etudiant.name}</span>
                </div>
                {s.jury.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                    {s.jury.map(j => (
                      <div key={j.id} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                        <span style={{ color: j.role==='président' ? 'var(--warning)' : 'var(--etu-accent)', marginRight: 6 }}>{j.role==='président' ? '▲' : '◆'}</span>{j.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 28, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {selected ? 'Aucune soutenance ce jour' : 'Sélectionner une date'}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div className="fu2" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr', padding: '10px 22px', borderBottom: '1px solid var(--border)', gap: 16 }}>
            {['Date / Heure', 'Étudiant', 'Sujet', 'Jury'].map(h => <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)' }}>{h}</div>)}
          </div>
          {planifies.map((s, i) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr', padding: '16px 22px', gap: 16, alignItems: 'center', borderBottom: i < planifies.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{new Date(s.datePresentation).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A }}>{s.heure} · {s.salle}</div>
              </div>
              <span style={{ fontSize: 13 }}>{s.etudiant.name}</span>
              <div style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.titre}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {s.jury.map(j => <Avatar key={j.id} initials={j.name.split(' ').map(n=>n[0]).join('').slice(0,2)} accent={j.role==='président'?'var(--warning)':'var(--etu-accent)'} size={26} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'dispo' && (
        <div className="fu2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {enseignants.map(e => (
            <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar initials={e.avatar} accent="var(--ens-accent)" size={36} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{e.specialite}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {e.disponibilites.map(d => (
                  <span key={d} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 10px', borderRadius: 40, background: 'var(--chef-dim)', color: A, border: `1px solid ${A}30` }}>
                    {new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                  </span>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
                {e.nbSujets} sujet(s) · <span style={{ color: A }}>{e.nbSujets * 3} participations requises</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

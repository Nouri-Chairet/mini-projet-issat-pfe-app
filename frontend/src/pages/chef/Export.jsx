import React, { useState } from 'react';
import { sujets } from '../../data/mockData';
import { Btn } from '../../components/UI';

const A = 'var(--chef-accent)';
const planifies = sujets.filter(s => s.datePresentation);

const docs = [
  { id: 'planning', title: 'Planning complet des soutenances', desc: `${planifies.length} présentations · Session 2024–2025`, type: 'PDF', icon: '▤' },
  { id: 'jurys', title: 'Liste des membres du jury', desc: 'Composition des jurys par soutenance', type: 'PDF', icon: '◈' },
  { id: 'convocs', title: 'Convocations étudiants', desc: `${sujets.length} convocations individuelles`, type: 'PDF', icon: '◉' },
  { id: 'excel', title: 'Tableau de bord Excel', desc: 'Planning + disponibilités + statistiques', type: 'XLSX', icon: '▦' },
];

export default function ChefExport() {
  const [state, setState] = useState({});

  const generate = id => {
    setState(p => ({ ...p, [id]: 'loading' }));
    setTimeout(() => setState(p => ({ ...p, [id]: 'done' })), 1800);
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: 900 }}>
      <div className="fu" style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>↓ Export</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px' }}>Rapports & <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: A, fontWeight: 400 }}>documents</span></h1>
      </div>

      {/* Import zone */}
      <div className="fu1" style={{ border: '1px dashed var(--border2)', borderRadius: 'var(--r-xl)', padding: '36px 24px', textAlign: 'center', marginBottom: 32, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = A + '60'; e.currentTarget.style.background = 'var(--chef-dim)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <input type="file" accept=".xlsx,.xls,.csv" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        <div style={{ fontSize: 32, marginBottom: 12 }}>↑</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Importer un fichier Excel</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
          Colonnes attendues : Sujet PFE · Étudiant · Encadreur · Date
        </div>
      </div>

      {/* Docs */}
      <div className="fu2" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {docs.map(doc => {
          const s = state[doc.id];
          return (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 22px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = A + '35'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--chef-dim)', border: `1px solid ${A}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: A, fontSize: 20, flexShrink: 0 }}>{doc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{doc.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{doc.desc}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', border: '1px solid var(--border2)', padding: '3px 10px', borderRadius: 40 }}>{doc.type}</span>
              {s === 'done' ? (
                <Btn accent={A} style={{ gap: 7 }}>↓ Télécharger</Btn>
              ) : (
                <button onClick={() => generate(doc.id)} style={{ padding: '9px 18px', border: `1px solid ${A}50`, borderRadius: 'var(--r-md)', background: 'transparent', color: A, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--chef-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {s === 'loading' ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span> : '→'} {s === 'loading' ? 'Génération…' : 'Générer'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview table */}
      <div className="fu3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Aperçu du planning</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{planifies.length} entrées</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Étudiant', 'Date', 'Heure', 'Salle', 'Jury'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planifies.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < planifies.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{String(i+1).padStart(2,'0')}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{s.etudiant.name}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: A }}>{new Date(s.datePresentation).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{s.heure}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{s.salle}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {s.jury.map(j => <span key={j.id} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: j.role==='président'?'var(--warning)':'var(--etu-accent)' }}>{j.name.split(' ').slice(-1)[0]}</span>).reduce((a,e,i) => [...a, i?<span key={`sep${i}`} style={{color:'var(--text3)',margin:'0 2px'}}>·</span>:null,e],[])}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

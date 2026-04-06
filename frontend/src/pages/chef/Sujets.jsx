import React, { useState } from 'react';
import { sujets as init, enseignants } from '../../data/mockData';
import { Card, StatusTag, Avatar, Btn, Input, Select, Modal } from '../../components/UI';

const A = 'var(--chef-accent)';

export default function ChefSujets() {
  const [sujets, setSujets] = useState(init);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = sujets.filter(s => {
    const q = search.toLowerCase();
    return (filter === 'tous' || s.statut === filter) &&
      (s.titre.toLowerCase().includes(q) || s.etudiant.name.toLowerCase().includes(q));
  });

  const openAdd = () => { setForm({ titre: '', etudiantName: '', etudiantEmail: '', encadreurId: enseignants[0].id, statut: 'en attente' }); setModal('add'); };
  const openEdit = (s) => { setForm({ ...s, etudiantName: s.etudiant.name, etudiantEmail: s.etudiant.email, encadreurId: enseignants.find(e => e.name === s.encadreur.name)?.id || enseignants[0].id }); setModal('edit'); };
  const handleSave = () => {
    const enc = enseignants.find(e => e.id === parseInt(form.encadreurId)) || enseignants[0];
    const initials = form.etudiantName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (modal === 'add') {
      setSujets(p => [...p, { ...form, id: Date.now(), etudiant: { name: form.etudiantName, email: form.etudiantEmail, avatar: initials }, encadreur: { name: enc.name, avatar: enc.avatar }, jury: [], datePresentation: null, heure: null, salle: null }]);
    } else {
      setSujets(p => p.map(s => s.id === form.id ? { ...s, titre: form.titre, etudiant: { ...s.etudiant, name: form.etudiantName, email: form.etudiantEmail, avatar: initials }, encadreur: { name: enc.name, avatar: enc.avatar }, statut: form.statut } : s));
    }
    setModal(null);
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1100 }}>
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>◈ Gestion</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px' }}>Sujets <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: A, fontWeight: 400 }}>PFE</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn accent={A} variant="ghost">↑ Importer Excel</Btn>
          <Btn accent={A} onClick={openAdd}>+ Nouveau sujet</Btn>
        </div>
      </div>

      {/* Filters */}
      <div className="fu1" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ width: '100%', padding: '10px 14px 10px 38px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r-md)', color: 'var(--text)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['tous', 'en attente', 'planifié', 'validé'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: 40, border: `1px solid ${filter === f ? A + '60' : 'var(--border)'}`, background: filter === f ? 'var(--chef-dim)' : 'transparent', color: filter === f ? A : 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="fu2" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px 100px', padding: '10px 22px', borderBottom: '1px solid var(--border)', gap: 16 }}>
          {['Sujet / Étudiant', 'Encadreur', 'Date', 'Statut', ''].map(h => (
            <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)' }}>{h}</div>
          ))}
        </div>
        {filtered.map((s, i) => (
          <div key={s.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px 100px',
            padding: '16px 22px', gap: 16, alignItems: 'center',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer', transition: 'background 0.12s'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <Avatar initials={s.etudiant.avatar} accent={A} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.titre}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.etudiant.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar initials={s.encadreur.avatar} accent="var(--ens-accent)" size={26} />
              <span style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.encadreur.name}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: s.datePresentation ? 'var(--text)' : 'var(--text3)' }}>
              {s.datePresentation ? new Date(s.datePresentation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
            </div>
            <StatusTag statut={s.statut} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(s)} style={{ padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>Éditer</button>
              <button onClick={() => setSujets(p => p.filter(x => x.id !== s.id))} style={{ padding: '6px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Aucun résultat</div>}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Nouveau sujet PFE' : 'Modifier le sujet'} onClose={() => setModal(null)} accent={A}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Titre du sujet" accent={A} value={form.titre || ''} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} placeholder="Ex: Système IA pour..." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Nom de l'étudiant" accent={A} value={form.etudiantName || ''} onChange={e => setForm(p => ({ ...p, etudiantName: e.target.value }))} placeholder="Prénom Nom" />
              <Input label="Email étudiant" accent={A} value={form.etudiantEmail || ''} onChange={e => setForm(p => ({ ...p, etudiantEmail: e.target.value }))} placeholder="email@univ.tn" />
            </div>
            <Select label="Encadreur" accent={A} value={form.encadreurId || ''} onChange={e => setForm(p => ({ ...p, encadreurId: parseInt(e.target.value) }))}>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
            <Select label="Statut" accent={A} value={form.statut || 'en attente'} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
              <option value="en attente">En attente</option>
              <option value="planifié">Planifié</option>
              <option value="validé">Validé</option>
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="muted">Annuler</Btn>
            <Btn onClick={handleSave} accent={A}>{modal === 'add' ? 'Créer' : 'Sauvegarder'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

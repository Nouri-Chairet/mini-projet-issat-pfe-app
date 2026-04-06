import React, { useState } from 'react';
import { forumMessages as init } from '../../data/mockData';
import { Avatar, Btn, Modal, Input } from '../../components/UI';

const roleIcon = { enseignant: '◆', etudiant: '◉', chef: '◈' };
const roleColor = { enseignant: 'var(--ens-accent)', etudiant: 'var(--etu-accent)', chef: 'var(--chef-accent)' };

export default function Forum({ user }) {
  const accent = roleColor[user.role];
  const [messages, setMessages] = useState(init);
  const [expanded, setExpanded] = useState({});
  const [replyText, setReplyText] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ sujet: '', message: '' });

  const toggleExp = id => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const handleReply = id => {
    const t = replyText[id]?.trim();
    if (!t) return;
    setMessages(p => p.map(m => m.id !== id ? m : { ...m, reponses: [...m.reponses, { id: Date.now(), auteur: { name: user.name, avatar: user.avatar, role: user.role }, message: t, date: new Date().toISOString().split('T')[0] }] }));
    setReplyText(p => ({ ...p, [id]: '' }));
    setExpanded(p => ({ ...p, [id]: true }));
  };
  const handleNew = () => {
    if (!newForm.sujet.trim() || !newForm.message.trim()) return;
    setMessages(p => [{ id: Date.now(), auteur: { name: user.name, avatar: user.avatar, role: user.role }, sujet: newForm.sujet, message: newForm.message, date: new Date().toISOString().split('T')[0], reponses: [] }, ...p]);
    setNewForm({ sujet: '', message: '' }); setShowNew(false);
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: 800 }}>
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>◎ Discussion</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px' }}>Forum <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: accent, fontWeight: 400 }}>PFE</span></h1>
        </div>
        <Btn accent={accent} onClick={() => setShowNew(true)}>+ Nouvelle discussion</Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map(msg => (
          <div key={msg.id} className="fu1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = accent + '30'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Avatar initials={msg.auteur.avatar} accent={roleColor[msg.auteur.role]} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{msg.auteur.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: roleColor[msg.auteur.role] }}>{roleIcon[msg.auteur.role]} {msg.auteur.role}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>
                      {new Date(msg.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>{msg.sujet}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{msg.message}</p>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => toggleExp(msg.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', border: '1px solid var(--border2)', borderRadius: 40, background: 'none', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {expanded[msg.id] ? '▲' : '▼'} {msg.reponses.length} réponse{msg.reponses.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
            {expanded[msg.id] && (
              <div style={{ borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                {msg.reponses.map((r, ri) => (
                  <div key={r.id} style={{ padding: '14px 24px 14px 52px', borderBottom: ri < msg.reponses.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12 }}>
                    <Avatar initials={r.auteur.avatar} accent={roleColor[r.auteur.role]} size={30} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{r.auteur.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: roleColor[r.auteur.role] }}>{roleIcon[r.auteur.role]}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{new Date(r.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{r.message}</p>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '14px 24px', display: 'flex', gap: 10, alignItems: 'center', borderTop: msg.reponses.length ? '1px solid var(--border)' : 'none' }}>
                  <Avatar initials={user.avatar} accent={accent} size={30} />
                  <input
                    value={replyText[msg.id] || ''}
                    onChange={e => setReplyText(p => ({ ...p, [msg.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                    placeholder="Répondre…"
                    style={{ flex: 1, padding: '9px 14px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 40, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', fontSize: 13 }}
                    onFocus={e => e.target.style.borderColor = accent + '60'}
                    onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                  />
                  <button onClick={() => handleReply(msg.id)} style={{ width: 34, height: 34, borderRadius: '50%', background: accent, border: 'none', color: '#000', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>→</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="Nouvelle discussion" onClose={() => setShowNew(false)} accent={accent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <Input label="Titre" accent={accent} value={newForm.sujet} onChange={e => setNewForm(p => ({ ...p, sujet: e.target.value }))} placeholder="Sujet de la discussion" />
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text2)', display: 'block', marginBottom: 7 }}>Message</label>
              <textarea value={newForm.message} onChange={e => setNewForm(p => ({ ...p, message: e.target.value }))} placeholder="Votre message…" rows={5}
                style={{ width: '100%', padding: '11px 15px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-md)', color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setShowNew(false)} variant="muted">Annuler</Btn>
            <Btn onClick={handleNew} accent={accent}>Publier</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

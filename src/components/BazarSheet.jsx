import { useState } from 'react';
import { uid, fmt } from '../utils/helpers';

export default function BazarSheet({ members, monthData, monthKey, onUpdate, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ member: currentUser || members[0] || '', note: '', amount: '', date: today });

  const allEntries = [];
  members.forEach(m => {
    (monthData.bazar[m] || []).forEach(e => {
      allEntries.push({ ...e, member: m });
    });
  });
  allEntries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const addEntry = () => {
    if (!form.amount || !form.member) return;
    const entry = { id: uid(), date: form.date, note: form.note || 'Groceries', amount: Number(form.amount), createdBy: currentUser || form.member };
    onUpdate(prev => {
      const bazar = { ...prev.bazar };
      if (!bazar[form.member]) bazar[form.member] = [];
      bazar[form.member] = [...bazar[form.member], entry];
      const log = { date: form.date, timestamp: new Date().toISOString(), emoji: '🛒', text: 'bought ' + (form.note || 'Groceries') + ' (৳' + fmt(form.amount) + ')', user: currentUser || form.member, member: form.member, amount: Number(form.amount), type: 'bazar' };
      return { ...prev, bazar, activityLog: [...(prev.activityLog || []), log] };
    });
    setForm({ member: currentUser || members[0] || '', note: '', amount: '', date: today });
    setShowForm(false);
  };

  const deleteEntry = (member, id) => {
    onUpdate(prev => {
      const entry = (prev.bazar[member] || []).find(e => e.id === id);
      const bazar = { ...prev.bazar };
      bazar[member] = (bazar[member] || []).filter(e => e.id !== id);
      const log = { date: today, timestamp: new Date().toISOString(), emoji: '🗑', text: 'deleted bazar entry' + (entry ? ' (' + (entry.note || '') + ')' : ''), user: currentUser || '—', member, amount: 0, type: 'delete' };
      return { ...prev, bazar, activityLog: [...(prev.activityLog || []), log] };
    });
  };

  return (
    <div>
      <h2 className="section-title">Bazar</h2>

      {!showForm && (
        <button className="btn small" onClick={() => { setForm({ ...form, member: currentUser || members[0] || '' }); setShowForm(true); }} style={{ marginBottom: 10 }}>+ Add Entry</button>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="edit-form">
            <div className="ef-row">
              <label>Date</label>
              <input type="date" className="excel-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="ef-row">
              <label>Who bought</label>
              <select className="excel-input" value={form.member} onChange={e => setForm({ ...form, member: e.target.value })}>
                {members.map(m => <option key={m} value={m}>{m}{m === currentUser ? ' (you)' : ''}</option>)}
              </select>
            </div>
            <div className="ef-row">
              <label>Item</label>
              <input type="text" className="excel-input" placeholder="What did they buy?" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="ef-row">
              <label>Amount (৳)</label>
              <input type="number" step="1" min="0" className="excel-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="actions-row">
              <button className="btn small" onClick={addEntry}>Save</button>
              <button className="btn small secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="excel-table">
        <div className="excel-row excel-header">
          <span className="excel-c" style={{ width: 70 }}>Date</span>
          <span className="excel-c" style={{ width: 80 }}>Member</span>
          <span className="excel-c" style={{ flex: 1 }}>Item</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>Amount</span>
          <span className="excel-c" style={{ width: 50, textAlign: 'center' }}></span>
        </div>
        {!allEntries.length && (
          <div className="excel-row"><span className="excel-c" style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)', width: '100%' }}>No entries yet</span></div>
        )}
        {allEntries.map((e, i) => (
          <div key={e.id || i} className="excel-row" style={e.member === currentUser ? { background: '#e8f4e8' } : {}}>
            <span className="excel-c" style={{ width: 70, fontFamily: 'monospace' }}>{(e.date || '').slice(5) || '—'}</span>
            <span className="excel-c" style={{ width: 80, fontWeight: 600 }}>{e.member}{e.member === currentUser ? ' (you)' : ''}</span>
            <span className="excel-c" style={{ flex: 1 }}>{e.note || 'Groceries'}</span>
            <span className="excel-c" style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>৳{fmt(e.amount)}</span>
            <span className="excel-c" style={{ width: 50, textAlign: 'center' }}>
              <button className="btn small danger" onClick={() => deleteEntry(e.member, e.id)}>✕</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { uid, fmt } from '../utils/helpers';

export default function DailyActivitySheet({ members, monthData, monthKey, onUpdate, currentUser, userEmail }) {
  const [selectedMember, setSelectedMember] = useState('');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [bazarMember, setBazarMember] = useState(currentUser || members[0] || '');
  const [editingId, setEditingId] = useState(null);
  const [editItem, setEditItem] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [mItem, setMItem] = useState('');
  const [mAmount, setMAmount] = useState('');

  const memberBazarTotal = (m) => (monthData.bazar[m] || []).reduce((a, e) => a + Number(e.amount || 0), 0);

  const logs = (monthData.activityLog || []).slice().reverse();
  const grouped = {};
  logs.forEach(log => {
    const date = log.date || log.timestamp?.slice(0, 10) || 'unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const addBazarEntry = () => {
    if (!amount || !bazarMember) return;
    const eid = uid();
    const itemName = item.trim() || 'Bazar';
    const entry = { id: eid, item: itemName, amount: Number(amount), date: new Date().toISOString().slice(0, 10), timestamp: new Date().toISOString(), user: currentUser || bazarMember };
    const log = { id: uid(), date: entry.date, timestamp: entry.timestamp, emoji: '🛒', text: 'bazar: ' + itemName + ' (৳' + entry.amount + ')', user: currentUser || bazarMember, member: bazarMember, amount: entry.amount, type: 'bazar', email: userEmail, refId: eid };
    onUpdate(prev => ({
      ...prev,
      bazar: { ...prev.bazar, [bazarMember]: [...(prev.bazar[bazarMember] || []), entry] },
      activityLog: [...(prev.activityLog || []), log]
    }));
    setItem('');
    setAmount('');
  };

  const deleteBazarEntry = (logEntry) => {
    const memberName = logEntry.member;
    onUpdate(prev => {
      const updatedBazar = { ...prev.bazar };
      if (updatedBazar[memberName]) {
        updatedBazar[memberName] = updatedBazar[memberName].filter(e => e.id !== logEntry.refId);
      }
      return { ...prev, bazar: updatedBazar, activityLog: (prev.activityLog || []).filter(l => l.id !== logEntry.id) };
    });
  };

  const startEdit = (log) => {
    setEditingId(log.id);
    const match = log.text.match(/bazar:\s*(.+?)\s*\(/);
    setEditItem(match ? match[1] : '');
    setEditAmount(String(log.amount));
  };

  const saveEdit = (log) => {
    if (!editItem.trim() || !editAmount) return;
    const newAmount = Number(editAmount);
    const newText = 'bazar: ' + editItem.trim() + ' (৳' + newAmount + ')';
    const memberName = log.member;
    onUpdate(prev => ({
      ...prev,
      bazar: {
        ...prev.bazar,
        [memberName]: (prev.bazar[memberName] || []).map(e =>
          e.id === log.refId ? { ...e, item: editItem.trim(), amount: newAmount } : e
        )
      },
      activityLog: (prev.activityLog || []).map(l =>
        l.id === log.id ? { ...l, text: newText, amount: newAmount } : l
      )
    }));
    setEditingId(null);
  };

  const addMemberBazar = () => {
    if (!mAmount || !selectedMember) return;
    const eid = uid();
    const itemName = mItem.trim() || 'Bazar';
    const entry = { id: eid, item: itemName, amount: Number(mAmount), date: addDate, timestamp: new Date().toISOString(), user: currentUser || selectedMember };
    const log = { id: uid(), date: addDate, timestamp: entry.timestamp, emoji: '🛒', text: 'bazar: ' + itemName + ' (৳' + entry.amount + ')', user: currentUser || selectedMember, member: selectedMember, amount: entry.amount, type: 'bazar', email: userEmail, refId: eid };
    onUpdate(prev => ({
      ...prev,
      bazar: { ...prev.bazar, [selectedMember]: [...(prev.bazar[selectedMember] || []), entry] },
      activityLog: [...(prev.activityLog || []), log]
    }));
    setMItem('');
    setMAmount('');
  };

  const startEditMember = (e) => {
    setEditingId(e.id);
    setEditItem(e.item || '');
    setEditAmount(String(e.amount));
  };

  const saveEditMember = (e) => {
    if (!editItem.trim() || !editAmount) return;
    const na = Number(editAmount);
    onUpdate(prev => ({
      ...prev,
      bazar: {
        ...prev.bazar,
        [selectedMember]: (prev.bazar[selectedMember] || []).map(x => x.id === e.id ? { ...x, item: editItem.trim(), amount: na } : x)
      },
      activityLog: (prev.activityLog || []).map(l => l.refId === e.id ? { ...l, text: 'bazar: ' + editItem.trim() + ' (৳' + na + ')', amount: na } : l)
    }));
    setEditingId(null);
  };

  const deleteMemberEntry = (e) => {
    onUpdate(prev => ({
      ...prev,
      bazar: { ...prev.bazar, [selectedMember]: (prev.bazar[selectedMember] || []).filter(x => x.id !== e.id) },
      activityLog: (prev.activityLog || []).filter(l => l.refId !== e.id)
    }));
  };

  if (selectedMember) {
    const entries = (monthData.bazar[selectedMember] || [])
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const totalRaw = entries.reduce((a, e) => a + Number(e.amount || 0), 0);

    return (
      <div>
        <h2 className="section-title">Bazar — {selectedMember}</h2>
        <button className="btn small secondary" onClick={() => { setSelectedMember(''); setEditingId(null); }} style={{ marginBottom: 12 }}>‹ Back to members</button>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
              style={{ width: 130, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit' }} />
            <input type="text" placeholder="Item" value={mItem} onChange={e => setMItem(e.target.value)}
              style={{ flex: 1, minWidth: 100, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit' }} />
            <input type="number" placeholder="Amount" value={mAmount} onChange={e => setMAmount(e.target.value)}
              style={{ width: 90, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit', textAlign: 'right' }} />
            <button className="btn small" onClick={addMemberBazar}>+ Add</button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state"><p>No bazar entries yet for {selectedMember}.</p></div>
        ) : (
          <div className="excel-table" style={{ marginBottom: 12 }}>
            <div className="excel-row excel-header">
              <span className="excel-c" style={{ width: 50 }}>Day</span>
              <span className="excel-c" style={{ flex: 1 }}>Item</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>Amount</span>
              <span className="excel-c" style={{ width: 60 }}></span>
            </div>
            {entries.map(e => (
              <div key={e.id} className="excel-row">
                <span className="excel-c" style={{ width: 50, fontSize: '.78rem', color: 'var(--text-soft)' }}>{e.date ? e.date.slice(8, 10) : '—'}</span>
                {editingId === e.id ? (
                  <span className="excel-c" style={{ flex: 1, gap: 4 }}>
                    <input type="text" value={editItem} onChange={e2 => setEditItem(e2.target.value)}
                      style={{ width: '45%', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: '.78rem', fontFamily: 'inherit' }} />
                    <input type="number" value={editAmount} onChange={e2 => setEditAmount(e2.target.value)}
                      style={{ width: 70, border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: '.78rem', fontFamily: 'inherit', textAlign: 'right' }} />
                    <button className="btn small" onClick={() => saveEditMember(e)} style={{ padding: '2px 8px' }}>✓</button>
                    <button className="btn small secondary" onClick={() => setEditingId(null)} style={{ padding: '2px 8px' }}>✕</button>
                  </span>
                ) : (
                  <span className="excel-c" style={{ flex: 1 }}>{e.item || 'Bazar'}</span>
                )}
                {editingId !== e.id && (
                  <span className="excel-c" style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>৳{e.amount}</span>
                )}
                {editingId !== e.id && (
                  <span className="excel-c" style={{ width: 60, justifyContent: 'center', gap: 2 }}>
                    <button onClick={() => startEditMember(e)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '.7rem', padding: '2px 4px' }}>✎</button>
                    <button onClick={() => deleteMemberEntry(e)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '.7rem', padding: '2px 4px' }}>✕</button>
                  </span>
                )}
              </div>
            ))}
            <div className="excel-row excel-header">
              <span className="excel-c" style={{ width: 50 }}></span>
              <span className="excel-c" style={{ flex: 1, fontWeight: 700 }}>TOTAL (raw)</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right', fontWeight: 700 }}>৳{totalRaw}</span>
              <span className="excel-c" style={{ width: 60 }}></span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title">Daily Activity</h2>

      <h3 className="sub-title">Members — tap a card for that person's monthly Bazar sheet</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {members.map(m => {
          const tot = memberBazarTotal(m);
          return (
            <button key={m} onClick={() => setSelectedMember(m)}
              style={{
                flex: '1 1 120px', maxWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '12px 10px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 1px 3px rgba(0,0,0,.08)', transition: 'transform .1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <span style={{ fontSize: '1.4rem' }}>🛒</span>
              <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{m}</span>
              <span style={{ fontSize: '.78rem', fontWeight: 600, color: tot > 0 ? 'var(--accent)' : 'var(--text-soft)' }}>৳{tot}</span>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={bazarMember} onChange={e => setBazarMember(e.target.value)}
            style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit', background: 'var(--surface)' }}>
            {members.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="text" placeholder="Item" value={item} onChange={e => setItem(e.target.value)}
            style={{ flex: 1, minWidth: 80, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit' }} />
          <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ width: 90, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit', textAlign: 'right' }} />
          <button className="btn small" onClick={addBazarEntry}>Add Bazar</button>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="empty-state"><p>No activity yet.</p></div>
      ) : (
        sortedDates.map(date => (
          <div key={date} style={{ marginBottom: 12 }}>
            <h3 className="sub-title" style={{ marginBottom: 4 }}>{date}</h3>
            <div className="excel-table">
              {grouped[date].map((log, i) => (
                <div key={i} className="excel-row" style={{ alignItems: 'stretch' }}>
                  <span className="excel-c" style={{ width: 30, textAlign: 'center', fontSize: '.85rem' }}>{log.emoji || '📝'}</span>
                  <span className="excel-c" style={{ width: 90, fontWeight: 600, fontSize: '.75rem', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                    <span>{log.member || log.user || '—'}</span>
                    {log.email && <span style={{ fontSize: '.6rem', color: 'var(--text-soft)', fontWeight: 400 }}>by {log.email}</span>}
                  </span>
                  {editingId === log.id ? (
                    <span className="excel-c" style={{ flex: 1, gap: 4 }}>
                      <input type="text" value={editItem} onChange={e => setEditItem(e.target.value)}
                        style={{ width: '40%', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: '.78rem', fontFamily: 'inherit' }} />
                      <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                        style={{ width: 80, border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: '.78rem', fontFamily: 'inherit', textAlign: 'right' }} />
                      <button className="btn small" onClick={() => saveEdit(log)} style={{ padding: '2px 8px' }}>✓</button>
                      <button className="btn small secondary" onClick={() => setEditingId(null)} style={{ padding: '2px 8px' }}>✕</button>
                    </span>
                  ) : (
                    <span className="excel-c" style={{ flex: 1, fontSize: '.78rem' }}>{log.text}</span>
                  )}
                  {log.amount > 0 && editingId !== log.id && (
                    <span className="excel-c" style={{ width: 60, textAlign: 'right', fontSize: '.75rem', fontWeight: 600 }}>
                      ৳{fmt(log.amount)}
                    </span>
                  )}
                  {log.type === 'bazar' && editingId !== log.id && (
                    <button onClick={() => startEdit(log)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '.7rem', padding: '6px 8px', alignSelf: 'center' }}>✎</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

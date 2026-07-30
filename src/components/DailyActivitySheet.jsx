import { useState } from 'react';
import { uid, fmt } from '../utils/helpers';

export default function DailyActivitySheet({ members, monthData, monthKey, onUpdate, currentUser, userEmail }) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [bazarMember, setBazarMember] = useState(currentUser || members[0] || '');
  const [editingId, setEditingId] = useState(null);
  const [editItem, setEditItem] = useState('');
  const [editAmount, setEditAmount] = useState('');

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

  return (
    <div>
      <h2 className="section-title">Daily Activity</h2>

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

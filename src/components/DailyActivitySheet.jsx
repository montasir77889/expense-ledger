import { useState } from 'react';
import { uid, fmt } from '../utils/helpers';

export default function DailyActivitySheet({ members, monthData, monthKey, onUpdate, currentUser, userEmail }) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [bazarMember, setBazarMember] = useState(currentUser || members[0] || '');

  const logs = (monthData.activityLog || []).slice().reverse();
  const grouped = {};
  logs.forEach(log => {
    const date = log.date || log.timestamp?.slice(0, 10) || 'unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const addBazarEntry = () => {
    if (!item.trim() || !amount || !bazarMember) return;
    const eid = uid();
    const entry = { id: eid, item: item.trim(), amount: Number(amount), date: new Date().toISOString().slice(0, 10), timestamp: new Date().toISOString(), user: currentUser || bazarMember };
    const log = { id: uid(), date: entry.date, timestamp: entry.timestamp, emoji: '🛒', text: 'bazar: ' + entry.item + ' (৳' + entry.amount + ')', user: currentUser || bazarMember, member: bazarMember, amount: entry.amount, type: 'bazar', email: userEmail, refId: eid };
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
      return {
        ...prev,
        bazar: updatedBazar,
        activityLog: (prev.activityLog || []).filter(l => l.id !== logEntry.id)
      };
    });
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
                  <span className="excel-c" style={{ width: 70, fontWeight: 600, fontSize: '.78rem' }}>{log.user || log.member || '—'}</span>
                  <span className="excel-c" style={{ flex: 1, fontSize: '.78rem' }}>{log.text}
                    {log.email && <span style={{ display: 'block', fontSize: '.65rem', color: 'var(--text-soft)', fontWeight: 400 }}>by {log.email}</span>}
                  </span>
                  {log.amount > 0 && (
                    <span className="excel-c" style={{ width: 60, textAlign: 'right', fontSize: '.75rem', fontWeight: 600 }}>
                      ৳{fmt(log.amount)}
                    </span>
                  )}
                  {log.type === 'bazar' && (
                    <button className="btn small danger" onClick={() => deleteBazarEntry(log)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', padding: '4px 6px', fontSize: '.75rem', alignSelf: 'center' }}>✕</button>
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

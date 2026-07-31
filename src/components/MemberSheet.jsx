import { useState } from 'react';
import { computeTotals } from '../utils/calculations';
import { fmt, daysInMonth, parseNum } from '../utils/helpers';

export default function MemberSheet({ member, members, monthData, monthKey, onUpdate, currentUser, userEmail }) {
  const [editingBazarId, setEditingBazarId] = useState(null);
  const [editItem, setEditItem] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const days = daysInMonth(monthKey);
  const t = computeTotals(members, monthData);
  const row = t.rows.find(r => r.member === member);
  const myMeals = monthData.meals[member] || {};
  const myBazar = (monthData.bazar[member] || []).slice().reverse();
  const logs = (monthData.activityLog || []).filter(l => l.member === member || l.user === member).reverse().slice(0, 10);

  const myRent = Number(monthData.bills.houseRent[member] || 0);
  const myUtilities = (monthData.bills.utilities || []).filter(u => u.participants.includes(member));
  const mySC = members.length ? Number(monthData.bills.serviceCharge || 0) / members.length : 0;

  const setMeal = (day, value) => {
    const v = parseNum(value);
    onUpdate(prev => {
      const meals = { ...prev.meals };
      if (!meals[member]) meals[member] = {};
      if (v > 0) meals[member] = { ...meals[member], [day]: v };
      else {
        const copy = { ...meals[member] };
        delete copy[day];
        meals[member] = copy;
      }
      const log = { date: new Date().toISOString().slice(0, 10), timestamp: new Date().toISOString(), emoji: '🍚', text: 'logged ' + v + ' meals on day ' + day, user: currentUser || member, member, amount: 0, type: 'meal', email: userEmail };
      return { ...prev, meals, activityLog: [...(prev.activityLog || []), log] };
    });
  };

  const addToMeal = (day, delta) => {
    const current = parseNum(myMeals[day]);
    setMeal(day, Math.max(0, current + delta));
  };

  if (!row) {
    return <div className="empty-state"><p>No data for {member}.</p></div>;
  }

  const bal = row.total;

  return (
    <div>
      <div className="badges-row" style={{ marginBottom: 12 }}>
        <div className="badge-card">
          <div className="b-icon">🍚</div>
          <div className="b-title">Meals</div>
          <div className="b-name">{row.meals}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">🛒</div>
          <div className="b-title">Bazar</div>
          <div className="b-name">৳{fmt(row.bazar)}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">💰</div>
          <div className="b-title">Meal Bill</div>
          <div className="b-name">৳{fmt(row.mealBill)}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">{bal > 0 ? '🔴' : '🟢'}</div>
          <div className="b-title">Balance</div>
          <div className="b-name" style={{ color: bal > 0 ? 'var(--red)' : 'var(--green)' }}>
            ৳{fmt(Math.abs(bal))} {bal > 0 ? 'due' : 'extra'}
          </div>
        </div>
      </div>

      {myBazar.length > 0 && (
        <>
          <h3 className="sub-title">Bazar Contributions</h3>
          <div className="excel-table" style={{ marginBottom: 12 }}>
            <div className="excel-row excel-header">
              <span className="excel-c" style={{ width: 60 }}>Date</span>
              <span className="excel-c" style={{ flex: 1 }}>Item</span>
              <span className="excel-c" style={{ width: 70, textAlign: 'right' }}>Amount</span>
              <span className="excel-c" style={{ width: 50 }}></span>
            </div>
            {myBazar.map((entry, i) => (
              <div key={i} className="excel-row">
                <span className="excel-c" style={{ width: 60, fontSize: '.75rem', color: 'var(--text-soft)' }}>{entry.date || (entry.timestamp ? entry.timestamp.slice(0, 10) : '—')}</span>
                {editingBazarId === entry.id ? (
                  <span className="excel-c" style={{ flex: 1, gap: 4 }}>
                    <input type="text" value={editItem} onChange={e => setEditItem(e.target.value)}
                      style={{ width: '45%', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: '.78rem', fontFamily: 'inherit' }} />
                    <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                      style={{ width: 70, border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: '.78rem', fontFamily: 'inherit', textAlign: 'right' }} />
                    <button className="btn small" onClick={() => {
                      if (!editItem.trim() || !editAmount) return;
                      const na = Number(editAmount);
                      onUpdate(prev => ({
                        ...prev,
                        bazar: { ...prev.bazar, [member]: (prev.bazar[member] || []).map(e => e.id === entry.id ? { ...e, item: editItem.trim(), amount: na } : e) },
                        activityLog: (prev.activityLog || []).map(l => l.refId === entry.id ? { ...l, text: 'bazar: ' + editItem.trim() + ' (৳' + na + ')', amount: na } : l)
                      }));
                      setEditingBazarId(null);
                    }} style={{ padding: '2px 8px' }}>✓</button>
                    <button className="btn small secondary" onClick={() => setEditingBazarId(null)} style={{ padding: '2px 8px' }}>✕</button>
                  </span>
                ) : (
                  <span className="excel-c" style={{ flex: 1 }}>{entry.item || entry.text || 'Bazar'}</span>
                )}
                {editingBazarId !== entry.id && (
                  <span className="excel-c" style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>৳{fmt(entry.amount)}</span>
                )}
                <span className="excel-c" style={{ width: 50, justifyContent: 'center', gap: 2 }}>
                  <button onClick={() => { setEditingBazarId(entry.id); setEditItem(entry.item || ''); setEditAmount(String(entry.amount)); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '.7rem', padding: '2px 4px' }}>✎</button>
                  <button onClick={() => {
                    onUpdate(prev => ({
                      ...prev,
                      bazar: { ...prev.bazar, [member]: (prev.bazar[member] || []).filter(e => e.id !== entry.id) },
                      activityLog: (prev.activityLog || []).filter(l => l.refId !== entry.id)
                    }));
                  }} style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '.7rem', padding: '2px 4px' }}>✕</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="sub-title">Bills & Utilities</h3>
      <div className="excel-table" style={{ marginBottom: 12 }}>
        <div className="excel-row excel-header">
          <span className="excel-c" style={{ flex: 1 }}>Item</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>Amount</span>
        </div>
        <div className="excel-row">
          <span className="excel-c" style={{ flex: 1 }}>House Rent</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>৳{fmt(myRent)}</span>
        </div>
        {myUtilities.map(u => (
          <div key={u.id} className="excel-row">
            <span className="excel-c" style={{ flex: 1 }}>
              {u.name}
              {u.paidBy === member ? <span style={{ color: 'var(--green)', fontSize: '.7rem', marginLeft: 4 }}>(paid full)</span> : ''}
              {u.paidBy && u.paidBy !== member ? <span style={{ color: 'var(--text-soft)', fontSize: '.7rem', marginLeft: 4 }}>(paid by {u.paidBy})</span> : ''}
            </span>
            <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{u.mode === 'custom' ? (u.customAmounts[member] || 0) : Number(u.amount) / u.participants.length}</span>
          </div>
        ))}
        <div className="excel-row">
          <span className="excel-c" style={{ flex: 1 }}>Service Charge</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>৳{fmt(mySC)}</span>
        </div>
      </div>

      {!myBazar.length && myUtilities.length === 0 && !myRent && (
        <p style={{ fontSize: '.78rem', color: 'var(--text-soft)', marginBottom: 12 }}>No bills recorded yet.</p>
      )}

      <h3 className="sub-title">Meal Log — {member}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const raw = myMeals[day];
          const val = raw !== undefined && raw !== null ? raw : '';
          return (
            <div key={day} style={{
              display: 'flex', alignItems: 'center', gap: 2,
              border: '1px solid var(--border)', borderRadius: 4, padding: '2px 4px',
              background: parseNum(raw) > 0 ? '#f0fdf4' : 'var(--surface)',
              fontSize: '.72rem'
            }}>
              <span style={{ fontWeight: 600, minWidth: 16, textAlign: 'center', fontSize: '.65rem', color: 'var(--text-soft)' }}>{day}</span>
              <input type="text" inputMode="decimal" value={val}
                onChange={e => setMeal(day, e.target.value)}
                style={{ width: 36, border: 'none', textAlign: 'center', fontSize: '.72rem', fontFamily: 'inherit', background: 'transparent', padding: 0 }}
              />
            </div>
          );
        })}
      </div>

      {logs.length > 0 && (
        <>
          <h3 className="sub-title">Recent Activity</h3>
          <div className="excel-table">
            {logs.map((log, i) => (
              <div key={i} className="excel-row">
                <span className="excel-c" style={{ width: 30, textAlign: 'center' }}>{log.emoji || '📝'}</span>
                <span className="excel-c" style={{ flex: 1, fontSize: '.78rem' }}>
                  {log.text}
                  {log.email && <span style={{ display: 'block', fontSize: '.65rem', color: 'var(--text-soft)', fontWeight: 400 }}>by {log.email}</span>}
                </span>
                <span className="excel-c" style={{ width: 60, textAlign: 'right', fontSize: '.7rem', color: 'var(--text-soft)' }}>
                  {log.date ? log.date.slice(5) : (log.timestamp ? log.timestamp.slice(5, 10) : '')}
                </span>
                {log.type === 'bazar' && (
                  <button onClick={() => {
                    onUpdate(prev => ({
                      ...prev,
                      bazar: { ...prev.bazar, [log.member]: (prev.bazar[log.member] || []).filter(e => e.id !== log.refId) },
                      activityLog: (prev.activityLog || []).filter(l => l.id !== log.id)
                    }));
                  }} style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '.7rem', padding: '4px' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

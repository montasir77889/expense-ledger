import { computeTotals } from '../utils/calculations';
import { fmt, daysInMonth } from '../utils/helpers';

export default function MemberSheet({ member, members, monthData, monthKey, onUpdate, currentUser, userEmail }) {
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
    onUpdate(prev => {
      const meals = { ...prev.meals };
      if (!meals[member]) meals[member] = {};
      if (value > 0) meals[member] = { ...meals[member], [day]: value };
      else {
        const copy = { ...meals[member] };
        delete copy[day];
        meals[member] = copy;
      }
      const log = { date: new Date().toISOString().slice(0, 10), timestamp: new Date().toISOString(), emoji: '🍚', text: 'logged ' + value + ' meals on day ' + day, user: currentUser || member, member, amount: 0, type: 'meal', email: userEmail };
      return { ...prev, meals, activityLog: [...(prev.activityLog || []), log] };
    });
  };

  const addToMeal = (day, delta) => {
    const current = myMeals[day] || 0;
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
          <div className="b-name">{row.meals.toFixed(1)}</div>
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
              <span className="excel-c" style={{ width: 30 }}></span>
            </div>
            {myBazar.map((entry, i) => (
              <div key={i} className="excel-row">
                <span className="excel-c" style={{ width: 60, fontSize: '.75rem', color: 'var(--text-soft)' }}>{entry.date || (entry.timestamp ? entry.timestamp.slice(0, 10) : '—')}</span>
                <span className="excel-c" style={{ flex: 1 }}>{entry.item || entry.text || 'Bazar'}</span>
                <span className="excel-c" style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>৳{fmt(entry.amount)}</span>
                <span className="excel-c" style={{ width: 30, justifyContent: 'center' }}>
                  <button onClick={() => {
                    onUpdate(prev => ({
                      ...prev,
                      bazar: { ...prev.bazar, [member]: (prev.bazar[member] || []).filter(e => e.id !== entry.id) },
                      activityLog: (prev.activityLog || []).filter(l => l.refId !== entry.id)
                    }));
                  }} style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: '.78rem', padding: 0 }}>✕</button>
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
            <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(u.mode === 'custom' ? (u.customAmounts[member] || 0) : Number(u.amount) / u.participants.length)}</span>
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
          const val = myMeals[day] || '';
          return (
            <div key={day} style={{
              display: 'flex', alignItems: 'center', gap: 2,
              border: '1px solid var(--border)', borderRadius: 4, padding: '2px 4px',
              background: val ? '#f0fdf4' : 'var(--surface)',
              fontSize: '.72rem'
            }}>
              <span style={{ fontWeight: 600, minWidth: 16, textAlign: 'center', fontSize: '.65rem', color: 'var(--text-soft)' }}>{day}</span>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0, lineHeight: 1 }} onClick={() => addToMeal(day, -0.25)}>−</button>
              <input type="number" step="0.25" min="0" value={val}
                onChange={e => setMeal(day, parseFloat(e.target.value) || 0)}
                style={{ width: 36, border: 'none', textAlign: 'center', fontSize: '.72rem', fontFamily: 'inherit', background: 'transparent', padding: 0 }}
              />
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--green)', padding: 0, lineHeight: 1 }} onClick={() => addToMeal(day, 0.25)}>+</button>
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

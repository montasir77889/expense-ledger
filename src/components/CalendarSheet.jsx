import { computeTotals } from '../utils/calculations';
import { fmt, daysInMonth } from '../utils/helpers';

export default function CalendarSheet({ members, monthData, monthKey, currentUser }) {
  const [y, m] = monthKey.split('-').map(Number);
  const days = daysInMonth(monthKey);
  const t = computeTotals(members, monthData);

  const firstDay = new Date(y, m - 1, 1).getDay();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weeks = [];
  let day = 1;
  for (let w = 0; day <= days; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      if (w === 0 && d < firstDay) row.push(null);
      else if (day <= days) row.push(day++);
      else row.push(null);
    }
    weeks.push(row);
  }

  const today = new Date();

  return (
    <div>
      {!currentUser && (
        <div style={{ padding: '8px 12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, marginBottom: 10, fontSize: '.75rem' }}>
          Select your name from the top-right dropdown so the app knows who's inputting.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="stat-chip">🍚 {t.totalMealUnits.toFixed(1)} meals</span>
        <span className="stat-chip">🛒 ৳{fmt(t.totalBazar)} bazar</span>
        <span className="stat-chip">💰 ৳{fmt(t.mealCostPerUnit)}/meal</span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 6px', background: 'var(--bg)', textAlign: 'left', fontWeight: 600, fontSize: '.68rem' }}>W</th>
              {dayLabels.map(d => (
                <th key={d} style={{ padding: '4px 2px', background: 'var(--bg)', textAlign: 'center', fontWeight: 600, fontSize: '.65rem', color: (d === 'Sat' || d === 'Sun') ? 'var(--red)' : undefined }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((row, wi) => (
              <tr key={wi}>
                <td style={{ padding: '3px 6px', fontWeight: 600, background: 'var(--bg)', fontSize: '.65rem' }}>{wi + 1}</td>
                {row.map((d, di) => {
                  const isToday = d && y === today.getFullYear() && m === (today.getMonth() + 1) && d === today.getDate();
                  const hasMeal = d && members.some(mem => (monthData.meals[mem] || {})[d] > 0);
                  return (
                    <td key={di} style={{
                      padding: '3px 2px', textAlign: 'center', fontSize: '.7rem',
                      background: isToday ? '#dbeafe' : hasMeal ? '#f0fdf4' : undefined,
                      fontWeight: d ? 500 : 400,
                      color: !d ? '#eee' : (di === 0 || di === 6) ? 'var(--red)' : undefined,
                      borderRadius: isToday ? 3 : 0
                    }}>
                      {d || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="excel-table">
        {t.rows.map(r => {
          const bal = r.total;
          const isYou = r.member === currentUser;
          return (
            <div key={r.member} className="excel-row" style={isYou ? { background: '#e8f4e8' } : {}}>
              <span className="excel-c" style={{ flex: 1, fontWeight: 600, fontSize: '.75rem' }}>
                {r.member} {isYou && <span style={{ fontSize: '.62rem', color: 'var(--green)', fontWeight: 400 }}>(you)</span>}
              </span>
              <span className="excel-c" style={{ width: 46, textAlign: 'right', fontSize: '.72rem' }}>{r.meals.toFixed(1)}</span>
              <span className="excel-c" style={{ width: 64, textAlign: 'right', fontSize: '.72rem' }}>৳{fmt(r.bazar)}</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right', fontWeight: 700, fontSize: '.75rem', color: bal > 0 ? 'var(--red)' : 'var(--green)' }}>
                ৳{fmt(Math.abs(bal))} {bal > 0 ? 'due' : 'extra'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

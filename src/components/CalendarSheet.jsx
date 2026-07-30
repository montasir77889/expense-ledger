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
        <div style={{ padding: '6px 10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, marginBottom: 8, fontSize: '.7rem' }}>
          Select your name from the top-right dropdown.
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span className="stat-chip">🍚 {t.totalMealUnits.toFixed(1)}</span>
        <span className="stat-chip">🛒 ৳{fmt(t.totalBazar)}</span>
        <span className="stat-chip">💰 ৳{fmt(t.mealCostPerUnit)}/meal</span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.65rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '2px 4px', background: 'var(--bg)', textAlign: 'left', fontWeight: 600, fontSize: '.6rem' }}>W</th>
              {dayLabels.map(d => (
                <th key={d} style={{ padding: '2px 1px', background: 'var(--bg)', textAlign: 'center', fontWeight: 600, fontSize: '.58rem', color: (d === 'Sat' || d === 'Sun') ? 'var(--red)' : undefined }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((row, wi) => (
              <tr key={wi}>
                <td style={{ padding: '2px 4px', fontWeight: 600, background: 'var(--bg)', fontSize: '.6rem' }}>{wi + 1}</td>
                {row.map((d, di) => {
                  const isToday = d && y === today.getFullYear() && m === (today.getMonth() + 1) && d === today.getDate();
                  const hasMeal = d && members.some(mem => (monthData.meals[mem] || {})[d] > 0);
                  return (
                    <td key={di} style={{
                      padding: '2px 1px', textAlign: 'center', fontSize: '.62rem',
                      background: isToday ? '#dbeafe' : hasMeal ? '#f0fdf4' : undefined,
                      fontWeight: d ? 500 : 400,
                      color: !d ? '#eee' : (di === 0 || di === 6) ? 'var(--red)' : undefined,
                      borderRadius: isToday ? 2 : 0
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
              <span className="excel-c" style={{ flex: 1, fontWeight: 600, fontSize: '.7rem', padding: '4px 6px' }}>
                {r.member}
              </span>
              <span className="excel-c" style={{ width: 40, textAlign: 'right', fontSize: '.65rem', padding: '4px 4px' }}>{r.meals.toFixed(1)}</span>
              <span className="excel-c" style={{ width: 56, textAlign: 'right', fontSize: '.65rem', padding: '4px 4px' }}>৳{fmt(r.bazar)}</span>
              <span className="excel-c" style={{ width: 72, textAlign: 'right', fontWeight: 700, fontSize: '.68rem', padding: '4px 4px', color: bal > 0 ? 'var(--red)' : 'var(--green)' }}>
                ৳{fmt(Math.abs(bal))} {bal > 0 ? 'due' : 'extra'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

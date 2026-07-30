import { computeTotals } from '../utils/calculations';
import { fmt, monthLabel, daysInMonth } from '../utils/helpers';

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
      if (w === 0 && d < firstDay) {
        row.push(null);
      } else if (day <= days) {
        row.push(day++);
      } else {
        row.push(null);
      }
    }
    weeks.push(row);
  }

  return (
    <div>
      {!currentUser && (
        <div style={{ padding: '10px 14px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, marginBottom: 12, fontSize: '.82rem' }}>
          Select your name from the top-right dropdown so the app knows who's inputting.
        </div>
      )}

      <div className="badges-row" style={{ marginBottom: 12 }}>
        <div className="badge-card">
          <div className="b-icon">🍚</div>
          <div className="b-title">Total Meals</div>
          <div className="b-name">{t.totalMealUnits.toFixed(1)}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">🛒</div>
          <div className="b-title">Total Bazar</div>
          <div className="b-name">৳{fmt(t.totalBazar)}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">💰</div>
          <div className="b-title">Meal Rate</div>
          <div className="b-name">৳{fmt(t.mealCostPerUnit)}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 8px', background: 'var(--bg)', textAlign: 'left', fontWeight: 600 }}>Week</th>
              {dayLabels.map(d => (
                <th key={d} style={{ padding: '6px 4px', background: 'var(--bg)', textAlign: 'center', fontWeight: 600, color: (d === 'Sat' || d === 'Sun') ? 'var(--red)' : undefined }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((row, wi) => (
              <tr key={wi}>
                <td style={{ padding: '6px 8px', fontWeight: 600, background: 'var(--bg)' }}>Week-{wi + 1}</td>
                {row.map((d, di) => {
                  const today = new Date();
                  const isToday = d && y === today.getFullYear() && m === (today.getMonth() + 1) && d === today.getDate();
                  const hasMeal = d && members.some(mem => (monthData.meals[mem] || {})[d] > 0);
                  return (
                    <td key={di} style={{
                      padding: '6px 4px', textAlign: 'center',
                      background: isToday ? '#dbeafe' : hasMeal ? '#f0fdf4' : undefined,
                      fontWeight: d ? 500 : 400,
                      color: !d ? '#ccc' : (di === 0 || di === 6) ? 'var(--red)' : undefined,
                      borderRadius: isToday ? 4 : 0
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

      <div className="excel-table" style={{ marginBottom: 12 }}>
        {t.rows.map(r => {
          const bal = r.total;
          const isYou = r.member === currentUser;
          return (
            <div key={r.member} className="excel-row" style={isYou ? { background: '#e8f4e8' } : {}}>
              <span className="excel-c" style={{ flex: 1, fontWeight: 600 }}>
                {r.member} {isYou && <span style={{ fontSize: '.68rem', color: 'var(--green)', fontWeight: 400 }}>(you)</span>}
              </span>
              <span className="excel-c" style={{ width: 60, textAlign: 'right' }}>{r.meals.toFixed(1)}</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(r.bazar)}</span>
              <span className="excel-c" style={{ width: 100, textAlign: 'right', fontWeight: 700, color: bal > 0 ? 'var(--red)' : 'var(--green)' }}>
                ৳{fmt(Math.abs(bal))} {bal > 0 ? 'due' : 'extra'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

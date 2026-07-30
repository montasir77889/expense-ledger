import { computeTotals } from '../utils/calculations';
import { fmt } from '../utils/helpers';

export default function Dashboard({ members, monthData, monthKey, currentUser }) {
  const t = computeTotals(members, monthData);
  const logs = (monthData.activityLog || []).slice().reverse().slice(0, 20);

  return (
    <div>
      {!currentUser && (
        <div style={{ padding: '10px 14px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, marginBottom: 12, fontSize: '.82rem' }}>
          👤 Select your name from the top-right dropdown so the app knows who's inputting.
        </div>
      )}

      <h2 className="section-title">Overview</h2>

      <div className="badges-row" style={{ marginBottom: 16 }}>
        <div className="badge-card">
          <div className="b-icon">🍚</div>
          <div className="b-title">Total Meals</div>
          <div className="b-name">{t.totalMealUnits}</div>
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

      <h3 className="sub-title">Members</h3>
      <div className="excel-table" style={{ marginBottom: 16 }}>
        {t.rows.map(r => {
          const bal = r.total;
          const isYou = r.member === currentUser;
          return (
            <div key={r.member} className="excel-row" style={isYou ? { background: '#e8f4e8' } : {}}>
              <span className="excel-c" style={{ flex: 1, fontWeight: 600 }}>
                {r.member} {isYou && <span style={{ fontSize: '.68rem', color: 'var(--green)', fontWeight: 400 }}>(you)</span>}
              </span>
              <span className="excel-c" style={{ width: 60, textAlign: 'right' }}>{r.meals}</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(r.bazar)}</span>
              <span className="excel-c" style={{ width: 100, textAlign: 'right', fontWeight: 700, color: bal > 0 ? 'var(--red)' : 'var(--green)' }}>
                ৳{fmt(Math.abs(bal))} {bal > 0 ? 'due' : 'extra'}
              </span>
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
                <span className="excel-c" style={{ width: 50, textAlign: 'center' }}>{log.emoji || '📝'}</span>
                <span className="excel-c" style={{ width: 80, fontWeight: 600 }}>{log.user || log.member || '—'}</span>
                <span className="excel-c" style={{ flex: 1, fontSize: '.78rem' }}>{log.text}</span>
                <span className="excel-c" style={{ width: 60, textAlign: 'right', fontSize: '.7rem', color: 'var(--text-soft)' }}>
                  {log.date ? log.date.slice(5) : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

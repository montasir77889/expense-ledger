import { DOW, daysInMonth } from '../utils/helpers';

export default function DutiesSheet({ members, monthData, monthKey, onUpdate }) {
  const days = daysInMonth(monthKey);
  const numWeeks = Math.ceil(days / 7);

  const setCooking = (member, value) => {
    onUpdate(prev => ({
      ...prev,
      cookingDuty: { ...prev.cookingDuty, [member]: Number(value) || 0 }
    }));
  };

  const setWatering = (week, day, value) => {
    onUpdate(prev => {
      const watering = { ...prev.watering };
      if (!watering[week]) watering[week] = {};
      if (value) watering[week] = { ...watering[week], [day]: value };
      else {
        const copy = { ...watering[week] };
        delete copy[day];
        watering[week] = copy;
      }
      return { ...prev, watering };
    });
  };

  return (
    <div>
      <h2 className="section-title">Duties</h2>

      <h3 className="sub-title">Cooking (days this month)</h3>
      <div className="excel-table" style={{ marginBottom: 16 }}>
        {members.map(m => (
          <div key={m} className="excel-row">
            <span className="excel-c" style={{ flex: 1, fontWeight: 600 }}>{m}</span>
            <span className="excel-c" style={{ width: 100, textAlign: 'right' }}>
              <input type="number" min="0" className="excel-input" style={{ width: 70, textAlign: 'right' }}
                value={monthData.cookingDuty[m] || 0}
                onChange={e => setCooking(m, e.target.value)} />
            </span>
          </div>
        ))}
      </div>

      <h3 className="sub-title">Watering Roster</h3>
      {Array.from({ length: numWeeks }, (_, i) => {
        const wk = 'w' + (i + 1);
        const weekData = monthData.watering[wk] || {};
        return (
          <div key={wk} className="card" style={{ marginBottom: 8 }}>
            <strong style={{ display: 'block', marginBottom: 6, fontSize: '.82rem' }}>Week {i + 1}</strong>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DOW.map(d => (
                <label key={d} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '.78rem' }}>
                  {d}
                  <select className="excel-input" style={{ width: 100 }}
                    value={weekData[d] || ''}
                    onChange={e => setWatering(wk, d, e.target.value)}>
                    <option value="">—</option>
                    {members.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

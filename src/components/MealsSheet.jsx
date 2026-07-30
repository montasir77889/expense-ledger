import { daysInMonth, fmt } from '../utils/helpers';

export default function MealsSheet({ members, monthData, monthKey, onUpdate, currentUser }) {
  const days = daysInMonth(monthKey);
  const [y, m] = monthKey.split('-').map(Number);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const setMeal = (member, day, value) => {
    onUpdate(prev => {
      const meals = { ...prev.meals };
      if (!meals[member]) meals[member] = {};
      if (value > 0) meals[member] = { ...meals[member], [day]: value };
      else {
        const copy = { ...meals[member] };
        delete copy[day];
        meals[member] = copy;
      }
      const log = { date: new Date().toISOString().slice(0, 10), timestamp: new Date().toISOString(), emoji: '🍚', text: 'logged ' + value + ' meals on day ' + day, user: currentUser || member, member, amount: 0, type: 'meal' };
      return { ...prev, meals, activityLog: [...(prev.activityLog || []), log] };
    });
  };

  const addToMeal = (member, day, delta) => {
    const current = (monthData.meals[member] || {})[day] || 0;
    setMeal(member, day, Math.max(0, current + delta));
  };

  const totalMealPerDay = {};
  for (let d = 1; d <= days; d++) {
    totalMealPerDay[d] = members.reduce((a, m) => a + Number((monthData.meals[m] || {})[d] || 0), 0);
  }
  const grandTotal = Object.values(totalMealPerDay).reduce((a, v) => a + v, 0);

  const colTemplate = '100px repeat(' + days + ', 1fr) 70px';

  return (
    <div>
      <h2 className="section-title">Meal</h2>
      <p style={{ fontSize: '.72rem', color: 'var(--text-soft)', marginBottom: 6 }}>Tap +/- to log meals. Click a number to edit.</p>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: colTemplate, fontSize: '.72rem', minWidth: 600 }}>
          <div className="meal-grid-header meal-grid-name-header" style={{ fontWeight: 600 }}>Name</div>
          {Array.from({ length: days }, (_, i) => (
            <div key={i} className="meal-grid-header">{i + 1}</div>
          ))}
          <div className="meal-grid-header" style={{ fontWeight: 600 }}>Total Meal per person</div>

          <div className="meal-grid-header meal-grid-name-header" style={{ fontSize: '.6rem', fontWeight: 400, color: 'var(--text-soft)' }}></div>
          {Array.from({ length: days }, (_, i) => {
            const dow = new Date(y, m - 1, i + 1).getDay();
            return (
              <div key={i} className="meal-grid-header" style={{ fontSize: '.6rem', fontWeight: 400, color: 'var(--text-soft)' }}>{dayNames[dow]}</div>
            );
          })}
          <div className="meal-grid-header" style={{ fontSize: '.6rem' }}></div>

          {members.map(member => {
            const total = Object.values(monthData.meals[member] || {}).reduce((a, v) => a + Number(v || 0), 0);
            const isYou = member === currentUser;
            return (
              <div key={member} style={{ display: 'contents' }}>
                <div className="meal-grid-cell meal-grid-name" style={isYou ? { background: '#e8f4e8' } : {}}>
                  {member}{isYou ? <span style={{ fontSize: '.6rem', color: 'var(--green)', marginLeft: 3 }}>(you)</span> : ''}
                </div>
                {Array.from({ length: days }, (_, i) => {
                  const day = i + 1;
                  const val = (monthData.meals[member] || {})[day] || '';
                  return (
                    <div key={day} className="meal-grid-cell" style={{ padding: 2, display: 'flex', alignItems: 'center' }}>
                      <button
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '.65rem', color: 'var(--red)', padding: '0 1px', lineHeight: 1, flexShrink: 0 }}
                        onClick={() => addToMeal(member, day, -0.5)}
                      >−</button>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={val}
                        onChange={e => setMeal(member, day, parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', minWidth: 20, border: 'none', textAlign: 'center', fontSize: '.72rem', fontFamily: 'inherit', background: 'transparent', padding: 0 }}
                      />
                      <button
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '.65rem', color: 'var(--green)', padding: '0 1px', lineHeight: 1, flexShrink: 0 }}
                        onClick={() => addToMeal(member, day, 0.5)}
                      >+</button>
                    </div>
                  );
                })}
                <div className="meal-grid-cell" style={{ fontWeight: 700, textAlign: 'center' }}>{total.toFixed(2)}</div>
              </div>
            );
          })}

          <div className="meal-grid-cell meal-grid-name" style={{ fontWeight: 700, background: 'var(--bg)' }}>Total Meal per day</div>
          {Array.from({ length: days }, (_, i) => (
            <div key={i} className="meal-grid-cell" style={{ fontWeight: 600, background: 'var(--bg)' }}>{totalMealPerDay[i + 1].toFixed(2)}</div>
          ))}
          <div className="meal-grid-cell" style={{ fontWeight: 700, background: 'var(--bg)' }}>{grandTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

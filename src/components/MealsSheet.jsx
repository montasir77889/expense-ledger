import { daysInMonth } from '../utils/helpers';

export default function MealsSheet({ members, monthData, monthKey, onUpdate, currentUser, userEmail }) {
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
      const log = { date: new Date().toISOString().slice(0, 10), timestamp: new Date().toISOString(), emoji: '🍚', text: 'logged ' + value + ' meals on day ' + day, user: currentUser || member, member, amount: 0, type: 'meal', email: userEmail };
      return { ...prev, meals, activityLog: [...(prev.activityLog || []), log] };
    });
  };

  const totalMealPerDay = {};
  for (let d = 1; d <= days; d++) {
    totalMealPerDay[d] = members.reduce((a, m) => a + Number((monthData.meals[m] || {})[d] || 0), 0);
  }
  const grandTotal = Object.values(totalMealPerDay).reduce((a, v) => a + v, 0);

  const today = new Date();
  const currentDay = today.getFullYear() === y && today.getMonth() + 1 === m ? today.getDate() : 0;

  const colTemplate = '100px repeat(' + days + ', 44px) 70px';

  return (
    <div>
      <h2 className="section-title">Meal</h2>
      <div style={{ overflowX: 'auto', overflowY: 'visible', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: colTemplate, fontSize: '.75rem', minWidth: days * 44 + 200 }}>
          <div className="mg-h mg-name-h" style={{ fontWeight: 600 }}>Name</div>
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const isToday = day === currentDay;
            return (
              <div key={i} className="mg-h" style={{ fontWeight: isToday ? 700 : 500, background: isToday ? 'var(--accent)' : 'var(--bg)', color: isToday ? '#fff' : undefined }}>
                {day}
                <span className="mg-dow">{dayNames[new Date(y, m - 1, day).getDay()]}</span>
              </div>
            );
          })}
          <div className="mg-h" style={{ fontWeight: 600 }}>Total</div>

          {members.map(member => {
            const total = Object.values(monthData.meals[member] || {}).reduce((a, v) => a + Number(v || 0), 0);
            const isYou = member === currentUser;
            return (
              <div key={member} style={{ display: 'contents' }}>
                <div className="mg-c mg-name" style={isYou ? { background: '#e8f4e8' } : {}}>
                  {member}{isYou ? <span style={{ fontSize: '.6rem', color: 'var(--green)', marginLeft: 3 }}>(you)</span> : ''}
                </div>
                {Array.from({ length: days }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === currentDay;
                  const val = (monthData.meals[member] || {})[day] || '';
                  return (
                    <div key={day} className="mg-c" style={{ padding: 0, background: isToday ? '#f0f7ff' : '' }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={val}
                        onChange={e => setMeal(member, day, parseFloat(e.target.value) || 0)}
                        className="mg-input"
                      />
                    </div>
                  );
                })}
                <div className="mg-c" style={{ fontWeight: 700, textAlign: 'center', background: 'var(--bg)' }}>{total.toFixed(2)}</div>
              </div>
            );
          })}

          <div className="mg-c mg-name" style={{ fontWeight: 700 }}>Per day total</div>
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const isToday = day === currentDay;
            return (
              <div key={i} className="mg-c" style={{ fontWeight: 600, background: isToday ? '#e8f4e8' : 'var(--bg)' }}>{totalMealPerDay[day].toFixed(2)}</div>
            );
          })}
          <div className="mg-c" style={{ fontWeight: 700, background: 'var(--bg)' }}>{grandTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

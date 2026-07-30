import { daysInMonth, parseNum } from '../utils/helpers';

export default function MealsSheet({ members, monthData, monthKey, onUpdate, currentUser, userEmail }) {
  const days = daysInMonth(monthKey);
  const [y, m] = monthKey.split('-').map(Number);

  const setMeal = (member, day, value) => {
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

  const totalMealPerDay = {};
  for (let d = 1; d <= days; d++) {
    totalMealPerDay[d] = members.reduce((a, m) => a + parseNum((monthData.meals[m] || {})[d]), 0);
  }
  const grandTotal = Object.values(totalMealPerDay).reduce((a, v) => a + v, 0);
  const today = new Date();
  const currentDay = today.getFullYear() === y && today.getMonth() + 1 === m ? today.getDate() : 0;

  const colWidth = days > 28 ? 30 : 34;
  const colTemplate = '78px repeat(' + days + ', ' + colWidth + 'px) 48px';

  return (
    <div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: colTemplate, fontSize: '.7rem', minWidth: days * colWidth + 140 }}>
          <div className="mg-h mg-name-h">Name</div>
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const isToday = day === currentDay;
            return (
              <div key={i} className="mg-h" style={{
                fontWeight: isToday ? 700 : 500,
                background: isToday ? 'var(--accent)' : 'var(--bg)',
                color: isToday ? '#fff' : undefined
              }}>
                {day}
              </div>
            );
          })}
          <div className="mg-h" style={{ fontWeight: 600 }}>Ttl</div>

          {members.map(member => {
            const total = Object.values(monthData.meals[member] || {}).reduce((a, v) => a + parseNum(v), 0);
            const isYou = member === currentUser;
            return (
              <div key={member} style={{ display: 'contents' }}>
                <div className="mg-c mg-name" style={isYou ? { background: '#e8f4e8' } : {}}>
                  {member}{isYou ? <span style={{ fontSize: '.55rem', color: 'var(--green)', marginLeft: 2 }}>●</span> : ''}
                </div>
                {Array.from({ length: days }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === currentDay;
                  const raw = (monthData.meals[member] || {})[day];
                  const val = raw !== undefined && raw !== null ? raw : '';
                  return (
                    <div key={day} className="mg-c" style={{
                      padding: 0,
                      background: isToday ? '#f0f7ff' : (parseNum(raw) > 0 ? '#fafdfa' : '')
                    }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={val}
                        onChange={e => setMeal(member, day, e.target.value)}
                        className="mg-input"
                      />
                    </div>
                  );
                })}
                <div className="mg-c" style={{ fontWeight: 700, textAlign: 'center', background: 'var(--bg)', fontSize: '.65rem' }}>{total}</div>
              </div>
            );
          })}

          <div className="mg-c mg-name" style={{ fontWeight: 600, fontSize: '.65rem', color: 'var(--text-soft)' }}>Daily</div>
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const isToday = day === currentDay;
            return (
              <div key={i} className="mg-c" style={{ fontWeight: 600, fontSize: '.6rem', background: isToday ? '#e8f4e8' : 'var(--bg)' }}>{totalMealPerDay[day]}</div>
            );
          })}
          <div className="mg-c" style={{ fontWeight: 700, fontSize: '.65rem', background: 'var(--bg)' }}>{grandTotal}</div>
        </div>
      </div>
    </div>
  );
}

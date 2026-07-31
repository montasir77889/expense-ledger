import { useState } from 'react';
import { fmt } from '../utils/helpers';

const TYPE_META = {
  meal: { label: 'Meals', emoji: '🍚', color: 'var(--green)' },
  bazar: { label: 'Bazar', emoji: '🛒', color: '#d97706' },
};
const TYPE_KEYS = Object.keys(TYPE_META);

const mealsInLog = (log) => {
  if (log.type !== 'meal') return 0;
  const m = /logged\s+([\d.]+)\s+meals/.exec(log.text || '');
  return m ? parseFloat(m[1]) : 0;
};

const weekday = (dateStr) => {
  if (!dateStr || dateStr === 'unknown') return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' });
  } catch { return ''; }
};

export default function HistorySheet({ members, monthData, currentUser }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const logs = (monthData.activityLog || []).slice().reverse();

  const filtered = logs.filter(log => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    if (memberFilter !== 'all') {
      const name = log.member || log.user || '';
      if (name !== memberFilter) return false;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      const hay = ((log.member || '') + ' ' + (log.user || '') + ' ' + (log.text || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const grouped = {};
  filtered.forEach(log => {
    const date = log.date || log.timestamp?.slice(0, 10) || 'unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalBazar = filtered.filter(l => l.type === 'bazar').reduce((a, l) => a + Number(l.amount || 0), 0);
  const totalMeals = filtered.reduce((a, l) => a + mealsInLog(l), 0);

  const toggleDate = (date) => setCollapsed(prev => ({ ...prev, [date]: !prev[date] }));

  return (
    <div>
      <h2 className="section-title">History</h2>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', ...TYPE_KEYS].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="btn small"
              style={{
                background: typeFilter === t ? 'var(--accent)' : 'transparent',
                color: typeFilter === t ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)'
              }}>
              {t === 'all' ? 'All' : (TYPE_META[t].emoji + ' ' + TYPE_META[t].label)}
            </button>
          ))}
          <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)}
            style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit', background: 'var(--surface)' }}>
            <option value="all">All members</option>
            {members.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="text" placeholder="🔍 Search..." value={query} onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 120, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit' }} />
        </div>
      </div>

      <div className="badges-row" style={{ marginBottom: 12 }}>
        <div className="badge-card">
          <div className="b-icon">📄</div>
          <div className="b-title">Entries</div>
          <div className="b-name">{filtered.length}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">🛒</div>
          <div className="b-title">Bazar</div>
          <div className="b-name">৳{totalBazar}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">🍚</div>
          <div className="b-title">Meals</div>
          <div className="b-name">{totalMeals}</div>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="empty-state"><p>No activity matches your filters.</p></div>
      ) : (
        sortedDates.map(date => {
          const dayLogs = grouped[date];
          const dayMoney = dayLogs.filter(l => l.type === 'bazar').reduce((a, l) => a + Number(l.amount || 0), 0);
          const dayMeals = dayLogs.reduce((a, l) => a + mealsInLog(l), 0);
          const isCollapsed = collapsed[date];
          return (
            <div key={date} style={{ marginBottom: 12 }}>
              <div
                onClick={() => toggleDate(date)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none',
                  padding: '6px 4px', borderRadius: 6, marginBottom: 4
                }}>
                <span style={{ fontSize: '.7rem', color: 'var(--text-soft)', width: 14 }}>{isCollapsed ? '▸' : '▾'}</span>
                <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{date === 'unknown' ? date : date.slice(8, 10) + ' ' + date.slice(5, 7)}</span>
                {weekday(date) && <span style={{ fontSize: '.7rem', color: 'var(--text-soft)' }}>{weekday(date)}</span>}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: '.72rem', color: 'var(--text-soft)' }}>{dayLogs.length} entries{dayMoney > 0 ? ' · ৳' + dayMoney : ''}{dayMeals > 0 ? ' · +' + dayMeals + ' meals' : ''}</span>
              </div>
              {!isCollapsed && (
                <div className="excel-table">
                  {dayLogs.map((log, i) => {
                    const meta = TYPE_META[log.type] || { emoji: '📝', color: 'var(--text)' };
                    return (
                      <div key={log.id || i} className="excel-row" style={{ alignItems: 'stretch', borderLeft: '3px solid ' + meta.color }}>
                        <span className="excel-c" style={{ width: 30, textAlign: 'center', fontSize: '.85rem' }}>{log.emoji || meta.emoji}</span>
                        <span className="excel-c" style={{ width: 90, fontWeight: 600, fontSize: '.75rem', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                          <span>{log.member || log.user || '—'}{log.member === currentUser ? ' (you)' : ''}</span>
                          {log.email && <span style={{ fontSize: '.6rem', color: 'var(--text-soft)', fontWeight: 400 }}>by {log.email}</span>}
                        </span>
                        <span className="excel-c" style={{ flex: 1, fontSize: '.78rem', textDecoration: log.type === 'delete' ? 'line-through' : 'none' }}>{log.text}</span>
                        {log.amount > 0 && (
                          <span className="excel-c" style={{ width: 70, textAlign: 'right', fontSize: '.75rem', fontWeight: 600 }}>
                            ৳{fmt(log.amount)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

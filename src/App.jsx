import { useState, useEffect, useCallback } from 'react';
import { loadMonthData, saveMonthData, loadMembers, saveMembers, loadMonthsList, saveMonthsList } from './db/firebase';
import { DEFAULT_MEMBERS, defaultMonthData, monthLabel } from './utils/helpers';
import TabBar from './components/TabBar';
import CalendarSheet from './components/CalendarSheet';
import MealsSheet from './components/MealsSheet';
import DailyActivitySheet from './components/DailyActivitySheet';
import BillsSheet from './components/BillsSheet';
import ReportsSheet from './components/ReportsSheet';
import SlipsSheet from './components/SlipsSheet';
import MemberSheet from './components/MemberSheet';
import ImportModal from './components/ImportModal';
import './App.css';

export default function App() {
  const [members, setMembers] = useState([]);
  const [monthKey, setMonthKey] = useState('');
  const [monthData, setMonthData] = useState(defaultMonthData());
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('mess_current_user') || '');

  const TABS = [
    { id: 'calendar', label: 'Calender' },
    { id: 'meal', label: 'Meal' },
    { id: 'daily_activity', label: 'Daily Activity' },
    ...members.map(m => ({ id: 'member_' + m, label: m })),
    { id: 'summary', label: 'Summary' },
    { id: 'payment_slip', label: 'Payment Slip' },
    { id: 'bill_collection', label: 'Bill Collection' },
  ];

  useEffect(() => {
    if (currentUser) localStorage.setItem('mess_current_user', currentUser);
  }, [currentUser]);

  const saveCurrentMonth = useCallback(async (data) => {
    if (!monthKey) return;
    try { await saveMonthData(monthKey, data); } catch (e) { console.error('save error', e); }
  }, [monthKey]);

  const updateMonthData = useCallback((updater) => {
    setMonthData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveCurrentMonth(next);
      return next;
    });
  }, [saveCurrentMonth]);

  useEffect(() => {
    (async () => {
      try {
        const [mems, months] = await Promise.all([loadMembers(), loadMonthsList()]);
        setMembers(mems.length ? mems : DEFAULT_MEMBERS);
        let mk = months.length ? months[months.length - 1] : '';
        if (!mk) {
          const now = new Date();
          mk = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
          await saveMonthsList([mk]);
        }
        setMonthKey(mk);
        const md = await loadMonthData(mk);
        setMonthData(md || defaultMonthData());
      } catch (e) {
        console.error('load error', e);
        setMembers(DEFAULT_MEMBERS);
        setError('Failed to load data.');
      }
      setLoading(false);
    })();
  }, []);

  const handleImport = useCallback((parsed) => {
    if (parsed.members && parsed.members.length) setMembers(parsed.members);
    if (parsed.meals || parsed.bazar || parsed.bills) {
      setMonthData(prev => ({
        ...prev,
        meals: parsed.meals || prev.meals,
        bazar: parsed.bazar || prev.bazar,
        bills: parsed.bills || prev.bills,
        cookingDuty: parsed.cookingDuty || prev.cookingDuty,
        watering: parsed.watering || prev.watering,
        activityLog: parsed.activityLog || prev.activityLog
      }));
    }
    alert('Data imported successfully');
  }, []);

  useEffect(() => {
    if (monthKey && members.length) saveMembers(members).catch(() => {});
  }, [members, monthKey]);

  if (loading) {
    return <div className="app-loading"><div className="spinner" /><p>Loading ledger...</p></div>;
  }

  if (error) {
    return <div className="app-error"><h2>Error</h2><p>{error}</p></div>;
  }

  const renderSheet = () => {
    if (activeTab.startsWith('member_')) {
      const member = activeTab.replace('member_', '');
      return <MemberSheet member={member} members={members} monthData={monthData} monthKey={monthKey} onUpdate={updateMonthData} currentUser={currentUser} />;
    }
    switch (activeTab) {
      case 'calendar':
        return <CalendarSheet members={members} monthData={monthData} monthKey={monthKey} currentUser={currentUser} />;
      case 'meal':
        return <MealsSheet members={members} monthData={monthData} monthKey={monthKey} onUpdate={updateMonthData} currentUser={currentUser} />;
      case 'daily_activity':
        return <DailyActivitySheet members={members} monthData={monthData} monthKey={monthKey} onUpdate={updateMonthData} currentUser={currentUser} />;
      case 'bill_collection':
        return <BillsSheet members={members} monthData={monthData} monthKey={monthKey} onUpdate={updateMonthData} />;
      case 'summary':
        return <ReportsSheet members={members} monthData={monthData} />;
      case 'payment_slip':
        return <SlipsSheet members={members} monthData={monthData} monthKey={monthKey} />;
      default:
        return <CalendarSheet members={members} monthData={monthData} monthKey={monthKey} currentUser={currentUser} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Mess Khata</h1>
        <span className="month-label">{monthLabel(monthKey)}</span>
        <button className="btn small secondary" onClick={() => setShowImport(true)} style={{ fontSize: '.7rem', marginLeft: 8 }}>Import</button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={currentUser} onChange={e => setCurrentUser(e.target.value)}
            style={{ fontSize: '.78rem', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontFamily: 'inherit', background: 'var(--bg)' }}>
            <option value="">Who's using?</option>
            {members.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>
      <main className="app-main">
        {renderSheet()}
      </main>
      <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} members={members} monthKey={monthKey} />}
    </div>
  );
}

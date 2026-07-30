import { useState, useEffect, useCallback } from 'react';
import { loadMonthData, saveMonthData, loadMembers, saveMembers, loadMonthsList, saveMonthsList } from './db/firebase';
import { getSession, signOut, onAuthChange } from './db/auth';
import { DEFAULT_MEMBERS, defaultMonthData, monthLabel, daysInMonth } from './utils/helpers';
import TabBar from './components/TabBar';
import CalendarSheet from './components/CalendarSheet';
import MealsSheet from './components/MealsSheet';
import DailyActivitySheet from './components/DailyActivitySheet';
import BillsSheet from './components/BillsSheet';
import ReportsSheet from './components/ReportsSheet';
import SlipsSheet from './components/SlipsSheet';
import MemberSheet from './components/MemberSheet';
import ImportModal from './components/ImportModal';
import AuthPage from './components/AuthPage';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [members, setMembers] = useState([]);
  const [monthKey, setMonthKey] = useState('');
  const [monthData, setMonthData] = useState(defaultMonthData());
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('mess_current_user') || '');

  useEffect(() => {
    getSession()
      .then(s => { if (s) setSession(s); })
      .catch(e => console.error('getSession error', e))
      .finally(() => setCheckingAuth(false));
    const { data: { subscription } } = onAuthChange(s => setSession(s));
    return () => subscription?.unsubscribe();
  }, []);

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

  const handleExport = () => {
    const payload = { monthKey, members, monthData, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledger-' + monthKey + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewMonth = async () => {
    const hasData = monthData && Object.keys(monthData.meals || {}).length > 0;
    if (hasData && !window.confirm('Data exists for ' + monthLabel(monthKey) + '. Download a backup first?\n\nClick OK to continue without backup, Cancel to stay.')) {
      return;
    }
    const now = new Date();
    const mk = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    if (mk === monthKey) { alert('Already on current month.'); return; }
    const months = await loadMonthsList();
    if (!months.includes(mk)) {
      await saveMonthsList([...months, mk]);
    }
    setMonthKey(mk);
    setMonthData(defaultMonthData());
    setActiveTab('calendar');
    const md = await loadMonthData(mk);
    setMonthData(md || defaultMonthData());
  };

  if (checkingAuth) {
    return <div className="app-loading"><div className="spinner" /><p>Loading...</p></div>;
  }

  if (!session) {
    return <AuthPage onAuth={() => window.location.reload()} />;
  }

  const userEmail = session.user.email;
  const TABS = [
    { id: 'calendar', label: 'Calender' },
    { id: 'meal', label: 'Meal' },
    { id: 'daily_activity', label: 'Daily Activity' },
    ...members.map(m => ({ id: 'member_' + m, label: m })),
    { id: 'summary', label: 'Summary' },
    { id: 'payment_slip', label: 'Payment Slip' },
    { id: 'bill_collection', label: 'Bill Collection' },
  ];

  if (loading) {
    return <div className="app-loading"><div className="spinner" /><p>Loading ledger...</p></div>;
  }

  if (error) {
    return <div className="app-error"><h2>Error</h2><p>{error}</p></div>;
  }

  const renderSheet = () => {
    if (activeTab.startsWith('member_')) {
      const member = activeTab.replace('member_', '');
      return <MemberSheet member={member} members={members} monthData={monthData} monthKey={monthKey} onUpdate={updateMonthData} currentUser={currentUser} userEmail={userEmail} />;
    }
    switch (activeTab) {
      case 'calendar':
        return <CalendarSheet members={members} monthData={monthData} monthKey={monthKey} currentUser={currentUser} />;
      case 'meal':
        return <MealsSheet members={members} monthData={monthData} monthKey={monthKey} onUpdate={updateMonthData} currentUser={currentUser} userEmail={userEmail} />;
      case 'daily_activity':
        return <DailyActivitySheet members={members} monthData={monthData} monthKey={monthKey} onUpdate={updateMonthData} currentUser={currentUser} userEmail={userEmail} />;
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
        <h1 className="app-title">Ledger</h1>
        <span className="month-label">{monthLabel(monthKey)}</span>
        <button className="btn small secondary" onClick={handleExport} style={{ fontSize: '.7rem', marginLeft: 8 }}>Export</button>
        <button className="btn small secondary" onClick={handleNewMonth} style={{ fontSize: '.7rem' }}>+ New Month</button>
        <button className="btn small secondary" onClick={() => setShowImport(true)} style={{ fontSize: '.7rem' }}>Import</button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={currentUser} onChange={e => setCurrentUser(e.target.value)}
            style={{ fontSize: '.78rem', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontFamily: 'inherit', background: 'var(--bg)' }}>
            <option value="">Who's using?</option>
            {members.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ fontSize: '.7rem', color: 'var(--text-soft)' }}>{userEmail}</span>
          <button className="btn small secondary" onClick={async () => { await signOut(); }} style={{ fontSize: '.7rem' }}>Logout</button>
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

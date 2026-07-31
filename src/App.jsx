import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { loadMonthData, saveMonthData, loadMembers, saveMembers, loadMonthsList, saveMonthsList } from './db/firebase';
import { getSession, signOut, onAuthChange } from './db/auth';
import { DEFAULT_MEMBERS, defaultMonthData, monthLabel, daysInMonth, fmt, canonicalizeMembers, matchMember } from './utils/helpers';
import { computeTotals } from './utils/calculations';
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
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthsList, setMonthsList] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('mess_current_user') || '');
  const monthLabelRef = useRef(null);
  const [monthPickerStyle, setMonthPickerStyle] = useState({});

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

  useEffect(() => {
    if (currentUser) {
      const canon = matchMember(currentUser, members);
      if (canon && canon !== currentUser) setCurrentUser(canon);
    }
  }, [members, currentUser]);

  useEffect(() => {
    if (!showMonthPicker) return;
    const handler = (e) => {
      if (e.target.closest('.month-picker-wrap')) return;
      setShowMonthPicker(false);
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [showMonthPicker]);

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
        const cm = canonicalizeMembers(mems);
        setMembers(cm.length ? cm : DEFAULT_MEMBERS);
        let mk = months.length ? months[months.length - 1] : '';
        if (!mk) {
          const now = new Date();
          mk = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
          await saveMonthsList([mk]);
        }
        setMonthKey(mk);
        setMonthsList(months.length ? months : [mk]);
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

  const switchMonth = async (mk) => {
    if (mk === monthKey) { setShowMonthPicker(false); return; }
    setMonthData(defaultMonthData());
    setMonthKey(mk);
    setActiveTab('calendar');
    setShowMonthPicker(false);
    const md = await loadMonthData(mk);
    setMonthData(md || defaultMonthData());
  };

  const handleNewMonth = async () => {
    const hasData = monthData && Object.keys(monthData.meals || {}).length > 0;
    if (hasData && !window.confirm('Data exists for ' + monthLabel(monthKey) + '. Click OK to continue, Cancel to stay.')) return;
    const [cy, cm] = monthKey.split('-').map(Number);
    const mk = cm === 12 ? (cy + 1) + '-01' : cy + '-' + String(cm + 1).padStart(2, '0');
    if (mk === monthKey) { alert('Already on that month.'); return; }
    const months = await loadMonthsList();
    if (!months.includes(mk)) await saveMonthsList([...months, mk]);
    setShowMonthPicker(false);
    setMonthsList([...months, mk].filter((v,i,a) => a.indexOf(v)===i));
    setMonthKey(mk);
    setMonthData(defaultMonthData());
    setActiveTab('calendar');
    const md = await loadMonthData(mk);
    setMonthData(md || defaultMonthData());
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const days = daysInMonth(monthKey);
    const mealHeader = ['Name', ...Array.from({length: days}, (_, i) => String(i+1)), 'Total'];
    const mealRows = members.map(m => {
      const meals = monthData.meals[m] || {};
      const row = Array.from({length: days}, (_, i) => meals[i+1] || 0);
      const total = row.reduce((a, v) => a + Number(v), 0);
      return [m, ...row, total];
    });
    const dayTotals = Array.from({length: days}, (_, i) =>
      members.reduce((a, m) => a + Number((monthData.meals[m] || {})[i+1] || 0), 0)
    );
    mealRows.push(['Total per day', ...dayTotals, dayTotals.reduce((a, v) => a + v, 0)]);
    const wsMeal = XLSX.utils.aoa_to_sheet([mealHeader, ...mealRows]);
    XLSX.utils.book_append_sheet(wb, wsMeal, 'Meal');

    const bazarHeader = ['Member', 'Date', 'Item', 'Amount'];
    const bazarRows = [];
    members.forEach(m => {
      (monthData.bazar[m] || []).forEach(e => {
        bazarRows.push([m, e.date || '', e.item || 'Bazar', e.amount]);
      });
    });
    if (bazarRows.length) {
      const wsBazar = XLSX.utils.aoa_to_sheet([bazarHeader, ...bazarRows]);
      XLSX.utils.book_append_sheet(wb, wsBazar, 'Bazar');
    }

    const computed = computeTotals(members, monthData);
    const billRows = members.map(m => {
      const rent = Number(monthData.bills.houseRent[m] || 0);
      const mealBill = computed.rows.find(r => r.member === m)?.mealBill || 0;
      const utility = (monthData.bills.utilities || []).filter(u => u.participants.includes(m))
        .reduce((a, u) => a + Number(u.amount) / u.participants.length, 0);
      const electricity = computed.rows.find(r => r.member === m)?.electricityBill || 0;
      const sc = members.length ? Number(monthData.bills.serviceCharge || 0) / members.length : 0;
      const total = mealBill + utility + electricity + sc + rent;
      return [m, rent, utility, electricity, sc, mealBill, total];
    });
    const wsBills = XLSX.utils.aoa_to_sheet([
      ['Member', 'Rent', 'Utility', 'Electricity', 'Service Charge', 'Meal Bill', 'Balance'],
      ...billRows
    ]);
    XLSX.utils.book_append_sheet(wb, wsBills, 'Summary');

    const actRows = (monthData.activityLog || []).map(l => [
      l.date || '', l.user || l.member || '', l.text || '', l.amount || 0, l.email || ''
    ]);
    if (actRows.length) {
      const wsAct = XLSX.utils.aoa_to_sheet([['Date', 'Member', 'Activity', 'Amount', 'By Email'], ...actRows]);
      XLSX.utils.book_append_sheet(wb, wsAct, 'Activity');
    }

    const metaPayload = JSON.stringify({
      members, meals: monthData.meals, bazar: monthData.bazar, bills: monthData.bills,
      cookingDuty: monthData.cookingDuty, watering: monthData.watering,
      activityLog: monthData.activityLog
    });
    const wsMeta = XLSX.utils.aoa_to_sheet([['month-meta:', metaPayload]]);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Meta');

    XLSX.writeFile(wb, 'ledger-' + monthKey + '.xlsx');
  };

  const handleImport = useCallback((parsed) => {
    if (parsed.members && parsed.members.length) setMembers(parsed.members);
    setMonthData(prev => {
      const next = { ...prev };
      if (parsed.meals && Object.keys(parsed.meals).length) next.meals = parsed.meals;
      if (parsed.bazar) next.bazar = parsed.bazar;
      if (parsed.bills) next.bills = parsed.bills;
      if (parsed.cookingDuty) next.cookingDuty = parsed.cookingDuty;
      if (parsed.watering) next.watering = parsed.watering;
      if (parsed.activityLog) next.activityLog = parsed.activityLog;
      return next;
    });
    alert('Data imported successfully');
  }, []);

  useEffect(() => {
    if (monthKey && members.length) saveMembers(members).catch(() => {});
  }, [members, monthKey]);

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
        <span className="month-label" ref={monthLabelRef} onClick={() => {
          if (!showMonthPicker && monthLabelRef.current) {
            const rect = monthLabelRef.current.getBoundingClientRect();
            setMonthPickerStyle({ top: rect.bottom + 4, left: rect.left });
          }
          setShowMonthPicker(!showMonthPicker);
        }}
          style={{ cursor: 'pointer', userSelect: 'none' }}>
          {monthLabel(monthKey)} ▾
        </span>
        <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
          ৳{fmt(computeTotals(members, monthData).mealCostPerUnit)}/meal
        </span>
        <button className="btn small secondary" onClick={handleExport} style={{ fontSize: '.7rem', marginLeft: 4 }}>Export</button>
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
      {showMonthPicker && (
        <div style={{
          position: 'fixed', ...monthPickerStyle, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,.2)',
          minWidth: 160, overflow: 'hidden'
        }}>
          {monthsList.map(mk => (
            <div key={mk} onClick={() => switchMonth(mk)}
              style={{
                padding: '10px 16px', fontSize: '.9rem', cursor: 'pointer',
                background: mk === monthKey ? 'var(--bg)' : '',
                fontWeight: mk === monthKey ? 700 : 400
              }}>
              {monthLabel(mk)}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div onClick={async () => { setShowMonthPicker(false); await handleNewMonth(); }}
              style={{ padding: '10px 16px', fontSize: '.9rem', cursor: 'pointer', color: 'var(--accent)' }}>
              + New Month
            </div>
          </div>
        </div>
      )}
      <main className="app-main">
        {renderSheet()}
      </main>
      <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} members={members} monthKey={monthKey} />}
    </div>
  );
}

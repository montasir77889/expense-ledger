import { useState } from 'react';
import { uid, fmt, ROOMS, defaultElectricityPresent } from '../utils/helpers';

export default function BillsSheet({ members, monthData, monthKey, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [billForm, setBillForm] = useState({ name: '', amount: '', participants: members.slice(), paidBy: '' });

  const setRent = (member, value) => {
    onUpdate(prev => ({
      ...prev,
      bills: { ...prev.bills, houseRent: { ...prev.bills.houseRent, [member]: Number(value) || 0 } }
    }));
  };

  const setServiceCharge = (value) => {
    onUpdate(prev => ({
      ...prev,
      bills: { ...prev.bills, serviceCharge: Number(value) || 0 }
    }));
  };

  const setElectricityTotal = (value) => {
    const total = Number(value) || 0;
    onUpdate(prev => {
      const eb = prev.bills.electricityBill || { total: 0, present: {} };
      if (!Object.keys(eb.present).length) eb.present = defaultElectricityPresent();
      return { ...prev, bills: { ...prev.bills, electricityBill: { ...eb, total } } };
    });
  };

  const toggleRoomPresence = (roomIdx, member) => {
    onUpdate(prev => {
      const eb = { ...(prev.bills.electricityBill || { total: 0, present: {} }) };
      if (!eb.present) eb.present = {};
      const roomPresent = [...(eb.present[roomIdx] || ROOMS[roomIdx].members)];
      if (roomPresent.includes(member)) {
        eb.present = { ...eb.present, [roomIdx]: roomPresent.filter(m => m !== member) };
      } else {
        eb.present = { ...eb.present, [roomIdx]: [...roomPresent, member] };
      }
      return { ...prev, bills: { ...prev.bills, electricityBill: eb } };
    });
  };

  const setElectricityPaidBy = (value) => {
    onUpdate(prev => {
      const eb = { ...(prev.bills.electricityBill || { total: 0, present: {}, paidBy: '' }) };
      if (!Object.keys(eb.present).length) eb.present = defaultElectricityPresent();
      return { ...prev, bills: { ...prev.bills, electricityBill: { ...eb, paidBy: value } } };
    });
  };

  const eb = monthData.bills.electricityBill || { total: 0, present: {}, paidBy: '' };
  const ebPresent = eb.present || {};
  const occupiedCount = ROOMS.filter((_, ri) => {
    const stored = ebPresent[ri];
    if (stored === undefined) return true;
    return stored.length > 0;
  }).length;
  const electricityPerRoom = eb.total / (occupiedCount || ROOMS.length);

  const saveUtility = () => {
    if (!billForm.name || !billForm.amount) return;
    const payload = { name: billForm.name, amount: Number(billForm.amount), mode: 'equal', participants: billForm.participants.slice(), customAmounts: {}, paidBy: billForm.paidBy || '' };
    onUpdate(prev => {
      const utilities = editingId
        ? (prev.bills.utilities || []).map(u => u.id === editingId ? { ...u, ...payload } : u)
        : [...(prev.bills.utilities || []), { id: uid(), ...payload }];
      return { ...prev, bills: { ...prev.bills, utilities } };
    });
    setBillForm({ name: '', amount: '', participants: members.slice(), paidBy: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const deleteUtility = (id) => {
    onUpdate(prev => ({
      ...prev,
      bills: { ...prev.bills, utilities: (prev.bills.utilities || []).filter(u => u.id !== id) }
    }));
  };

  const toggleParticipant = (id, member) => {
    onUpdate(prev => {
      const utils = (prev.bills.utilities || []).map(u => {
        if (u.id !== id) return u;
        const parts = u.participants.includes(member)
          ? u.participants.filter(p => p !== member)
          : [...u.participants, member];
        return { ...u, participants: parts };
      });
      return { ...prev, bills: { ...prev.bills, utilities: utils } };
    });
  };

  const startEdit = (u) => {
    setBillForm({ name: u.name, amount: String(u.amount), participants: u.participants.slice(), paidBy: u.paidBy || '' });
    setEditingId(u.id);
    setShowForm(true);
  };

  return (
    <div>
      <h2 className="section-title">Bills</h2>

      <h3 className="sub-title">House Rent</h3>
      <div className="excel-table" style={{ marginBottom: 12 }}>
        {members.map(m => (
          <div key={m} className="excel-row">
            <span className="excel-c" style={{ flex: 1, fontWeight: 600 }}>{m}</span>
            <span className="excel-c" style={{ width: 120, textAlign: 'right' }}>
              <input type="number" className="excel-input" style={{ width: 100, textAlign: 'right' }}
                value={monthData.bills.houseRent[m] || ''}
                onChange={e => setRent(m, e.target.value)} />
            </span>
          </div>
        ))}
      </div>

      <h3 className="sub-title">Electricity Bill</h3>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span>Total</span>
          <input type="number" className="excel-input" style={{ width: 120, textAlign: 'right' }}
            value={eb.total || ''}
            onChange={e => setElectricityTotal(e.target.value)} />
          <span style={{ fontSize: '.78rem', color: 'var(--text-soft)' }}>
            ৳{fmt(electricityPerRoom)}/room
          </span>
        </div>
        {ROOMS.map((room, ri) => {
          const present = ebPresent[ri] !== undefined ? ebPresent[ri] : room.members;
          const roomShare = present.length ? electricityPerRoom : 0;
          const perHead = present.length ? roomShare / present.length : 0;
          return (
            <div key={ri} className="card" style={{ marginBottom: 6, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 600, fontSize: '.78rem', marginBottom: 4 }}>{room.name} — ৳{fmt(roomShare)}{!present.length && <span style={{ color: 'var(--red)', fontSize: '.68rem' }}> (empty)</span>}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {room.members.map(m => {
                  const isPresent = present.includes(m);
                  return (
                    <label key={m} style={{ fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '3px 8px', borderRadius: 4, background: isPresent ? '#e8f4e8' : '#fff0f0', border: '1px solid', borderColor: isPresent ? 'var(--green)' : 'var(--red)' }}>
                      <input type="checkbox" checked={isPresent}
                        onChange={() => toggleRoomPresence(ri, m)} />
                      <span>{m}</span>
                      {isPresent && <span style={{ fontSize: '.65rem', color: 'var(--text-soft)' }}>৳{fmt(perHead)}</span>}
                      {!isPresent && <span style={{ fontSize: '.65rem', color: 'var(--red)' }}>absent</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="ef-row" style={{ marginTop: 8 }}>
          <label>Paid by (who paid the bill)</label>
          <select value={eb.paidBy || ''} onChange={e => setElectricityPaidBy(e.target.value)}
            style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit', background: 'var(--surface)', width: '100%' }}>
            <option value="">— Split per room —</option>
            {members.map(m => <option key={m} value={m}>{m} (paid full)</option>)}
          </select>
        </div>
      </div>

      <h3 className="sub-title">Utility Bills</h3>
      {!showForm && (
        <button className="btn small" onClick={() => { setShowForm(true); setEditingId(null); setBillForm({ name: '', amount: '', participants: members.slice(), paidBy: '' }); }} style={{ marginBottom: 8 }}>+ Add Utility</button>
      )}
      {showForm && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="edit-form">
            <div className="ef-row"><label>Bill Name</label>
              <input type="text" className="excel-input" value={billForm.name} onChange={e => setBillForm({ ...billForm, name: e.target.value })} />
            </div>
            <div className="ef-row"><label>Amount (৳)</label>
              <input type="number" className="excel-input" value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: e.target.value })} />
            </div>
            <div className="ef-row"><label>Shared by</label>
              <div className="ef-members">
                {members.map(m => (
                  <label key={m} className="ef-member">
                    <input type="checkbox" checked={billForm.participants.includes(m)}
                      onChange={e => setBillForm({
                        ...billForm,
                        participants: e.target.checked
                          ? [...billForm.participants, m]
                          : billForm.participants.filter(p => p !== m)
                      })} /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div className="ef-row"><label>Paid by (optional)</label>
              <select value={billForm.paidBy} onChange={e => setBillForm({ ...billForm, paidBy: e.target.value })}
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: '.78rem', fontFamily: 'inherit', background: 'var(--surface)', width: '100%' }}>
                <option value="">— Split equally —</option>
                {members.map(m => <option key={m} value={m}>{m} (paid full)</option>)}
              </select>
            </div>
            <div className="actions-row">
              <button className="btn small" onClick={saveUtility}>{editingId ? 'Update' : 'Save'}</button>
              <button className="btn small secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {(monthData.bills.utilities || []).map(u => (
        <div key={u.id} className="card" style={{ marginBottom: 6 }}>
          <div className="bill-row">
            <strong style={{ flex: 1 }}>{u.name}</strong>
            <span>৳{fmt(u.amount)}</span>
            <button className="btn small secondary" onClick={() => startEdit(u)} style={{ padding: '2px 8px', fontSize: '.7rem' }}>✎</button>
            <button className="btn small danger" onClick={() => deleteUtility(u.id)}>✕</button>
          </div>
          {u.paidBy && (
            <div style={{ fontSize: '.75rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              Paid by {u.paidBy}
            </div>
          )}
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {members.map(m => (
              <label key={m} style={{ fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                <input type="checkbox" checked={u.participants.includes(m)}
                  onChange={() => toggleParticipant(u.id, m)} /> {m}
              </label>
            ))}
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-soft)', marginTop: 4 }}>
            Each: ৳{fmt(u.mode === 'custom' ? 0 : Number(u.amount) / (u.participants.length || 1))}
          </div>
        </div>
      ))}

      <h3 className="sub-title">Service Charge</h3>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Total</span>
          <input type="number" className="excel-input" style={{ width: 120, textAlign: 'right' }}
            value={monthData.bills.serviceCharge || ''}
            onChange={e => setServiceCharge(e.target.value)} />
          <span style={{ fontSize: '.78rem', color: 'var(--text-soft)' }}>
            Each: ৳{fmt(members.length ? Number(monthData.bills.serviceCharge || 0) / members.length : 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { DEFAULT_MEMBERS } from '../utils/helpers';

export default function MembersSheet({ members, setMembers, monthData, onUpdate }) {
  const [newName, setNewName] = useState('');

  const addMember = () => {
    const name = newName.trim();
    if (!name || members.includes(name)) return;
    setMembers([...members, name]);
    onUpdate(prev => {
      const meals = { ...prev.meals, [name]: {} };
      const bazar = { ...prev.bazar, [name]: [] };
      const cookingDuty = { ...prev.cookingDuty, [name]: 0 };
      const houseRent = { ...prev.bills.houseRent, [name]: 0 };
      return { ...prev, meals, bazar, cookingDuty, bills: { ...prev.bills, houseRent } };
    });
    setNewName('');
  };

  const removeMember = (name) => {
    setMembers(members.filter(m => m !== name));
    onUpdate(prev => {
      const meals = { ...prev.meals }; delete meals[name];
      const bazar = { ...prev.bazar }; delete bazar[name];
      const cookingDuty = { ...prev.cookingDuty }; delete cookingDuty[name];
      const watering = { ...prev.watering };
      Object.keys(watering).forEach(wk => {
        Object.keys(watering[wk]).forEach(d => {
          if (watering[wk][d] === name) watering[wk][d] = '';
        });
      });
      const houseRent = { ...prev.bills.houseRent }; delete houseRent[name];
      return { ...prev, meals, bazar, cookingDuty, watering, bills: { ...prev.bills, houseRent } };
    });
  };

  return (
    <div>
      <h2 className="section-title">Members</h2>
      <div className="excel-table" style={{ marginBottom: 12 }}>
        {members.map(m => (
          <div key={m} className="excel-row">
            <span className="excel-c" style={{ flex: 1, fontWeight: 600 }}>{m}</span>
            <span className="excel-c" style={{ width: 50 }}>
              <button className="btn small danger" onClick={() => removeMember(m)}>✕</button>
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" className="excel-input" style={{ maxWidth: 220 }}
          placeholder="New member's name"
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addMember()} />
        <button className="btn small" onClick={addMember}>+ Add</button>
      </div>
    </div>
  );
}

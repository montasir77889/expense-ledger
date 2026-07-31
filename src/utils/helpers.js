export const DEFAULT_MEMBERS = ['Afsan', 'Ridwan', 'Muntasir', 'Shafi', 'Emon', 'Ashiq'];
export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const UTILITY_SUGGESTIONS = ['Electricity', 'Gas', 'Water', 'Internet', 'Waste', 'Security', 'Maintenance'];
export const ROOMS = [
  { name: 'Room 1', members: ['Afsan', 'Ridwan'] },
  { name: 'Room 2', members: ['Emon', 'Ashiq'] },
  { name: 'Room 3', members: ['Muntasir', 'Shafi'] },
];

let uidCounter = Date.now();
export function uid() { return (++uidCounter).toString(36); }

export function fmt(n) {
  if (n === undefined || n === null) return '0';
  return Number(n).toFixed(2);
}

export function matchMember(name, members) {
  if (!name) return null;
  const exact = members.find(m => m === name);
  if (exact) return exact;
  return members.find(m => m.toLowerCase() === String(name).toLowerCase()) || null;
}

export function parseNum(v) {
  if (v === '' || v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  if (s.includes(',') && !s.includes('.')) {
    if (/,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export function monthLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[m - 1] + ' ' + y;
}

export function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function defaultMonthData() {
  return {
    meals: {},
    bazar: {},
    cookingDuty: {},
    watering: {},
    bills: { houseRent: {}, serviceCharge: 0, utilities: [], electricityBill: { total: 0, present: {}, paidBy: '' } },
    activityLog: [],
    checkin: {}
  };
}

export function defaultElectricityPresent() {
  return ROOMS.reduce((acc, room, i) => {
    acc[i] = [...room.members];
    return acc;
  }, {});
}

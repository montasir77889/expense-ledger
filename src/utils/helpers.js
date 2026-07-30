export const DEFAULT_MEMBERS = ['Afsan', 'Ridwan', 'Muntasir', 'Shafi', 'Emon', 'Ashiq'];
export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const UTILITY_SUGGESTIONS = ['Electricity', 'Gas', 'Water', 'Internet', 'Waste', 'Security', 'Maintenance'];

let uidCounter = Date.now();
export function uid() { return (++uidCounter).toString(36); }

export function fmt(n) {
  if (n === undefined || n === null) return '0';
  return Number(n).toFixed(2);
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
    bills: { houseRent: {}, serviceCharge: 0, utilities: [] },
    activityLog: [],
    checkin: {}
  };
}

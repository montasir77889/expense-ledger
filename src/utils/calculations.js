import { parseNum, matchMember, ROOMS } from './helpers';

export function computeTotals(members, monthData) {
  const totalBazar = members.reduce((s, m) =>
    s + (monthData.bazar[m] || []).reduce((a, e) => a + Number(e.amount || 0), 0), 0);

  const mealsByMember = {};
  let totalMealUnits = 0;
  members.forEach(m => {
    const days = monthData.meals[m] || {};
    const t = Object.values(days).reduce((a, v) => a + parseNum(v), 0);
    mealsByMember[m] = t;
    totalMealUnits += t;
  });

  const mealCostPerUnit = totalMealUnits > 0 ? totalBazar / totalMealUnits : 0;

  const bazarByMember = {};
  members.forEach(m => {
    bazarByMember[m] = (monthData.bazar[m] || []).reduce((a, e) => a + Number(e.amount || 0), 0);
  });

  const utilityByMember = {};
  members.forEach(m => utilityByMember[m] = 0);
  (monthData.bills.utilities || []).forEach(u => {
    const parts = u.participants || [];
    if (!parts.length) return;
    if (u.mode === 'custom') {
      parts.forEach(p => {
        utilityByMember[p] = (utilityByMember[p] || 0) + Number((u.customAmounts || {})[p] || 0);
      });
    } else {
      const share = Number(u.amount || 0) / parts.length;
      parts.forEach(p => { utilityByMember[p] = (utilityByMember[p] || 0) + share; });
    }
    if (u.paidBy) {
      utilityByMember[u.paidBy] = (utilityByMember[u.paidBy] || 0) - Number(u.amount || 0);
    }
  });

  // Electricity bill: room-based splitting
  const electricityByMember = {};
  members.forEach(m => electricityByMember[m] = 0);
  const eb = monthData.bills.electricityBill || { total: 0, present: {}, paidBy: '' };
  const roomsPresent = eb.present || {};
  const totalElectricity = Number(eb.total) || 0;
  const occupiedCount = ROOMS.filter((_, ri) => {
    const stored = roomsPresent[ri];
    if (stored === undefined) return true;
    return stored.length > 0;
  }).length;
  const perRoom = totalElectricity / (occupiedCount || ROOMS.length);
  ROOMS.forEach((room, ri) => {
    const stored = roomsPresent[ri];
    if (stored !== undefined && stored.length === 0) return;
    const present = stored && stored.length ? stored : room.members;
    const perHead = present.length ? perRoom / present.length : 0;
    present.forEach(name => {
      const canon = matchMember(name, members);
      if (canon) electricityByMember[canon] = (electricityByMember[canon] || 0) + perHead;
    });
  });
  // If one person paid the full bill, credit them the full amount
  if (eb.paidBy && members.includes(eb.paidBy)) {
    electricityByMember[eb.paidBy] = (electricityByMember[eb.paidBy] || 0) - totalElectricity;
  }

  const serviceChargeShare = members.length ? Number(monthData.bills.serviceCharge || 0) / members.length : 0;

  const rows = members.map(m => {
    const mealBill = mealCostPerUnit * mealsByMember[m] - bazarByMember[m];
    const utilityBill = utilityByMember[m] || 0;
    const electricityBill = electricityByMember[m] || 0;
    const rent = Number(monthData.bills.houseRent[m] || 0);
    const total = mealBill + utilityBill + electricityBill + serviceChargeShare + rent;
    return {
      member: m,
      meals: mealsByMember[m],
      bazar: bazarByMember[m],
      mealBill,
      utilityBill,
      electricityBill,
      rent,
      serviceCharge: serviceChargeShare,
      total
    };
  });

  return {
    totalBazar,
    totalMealUnits,
    mealCostPerUnit,
    serviceChargeShare,
    totalElectricity,
    rows,
    grandTotal: rows.reduce((a, r) => a + r.total, 0)
  };
}

export function getSettlements(members, monthData) {
  const t = computeTotals(members, monthData);
  if (!t.rows.length) return null;

  const maxMealMember = t.rows.reduce((a, b) => a.meals > b.meals ? a : b, t.rows[0]);
  const maxBazarMember = t.rows.reduce((a, b) => a.bazar > b.bazar ? a : b, t.rows[0]);

  const rows = t.rows.map(r => ({ ...r, net: r.total }));
  const pos = rows.filter(r => r.net > 0).sort((a, b) => b.net - a.net);
  const neg = rows.filter(r => r.net < 0).sort((a, b) => a.net - b.net);

  const settlements = [];
  let i = 0, j = 0;
  while (i < pos.length && j < neg.length) {
    const amt = Math.min(pos[i].net, -neg[j].net);
    if (amt > 1) settlements.push({ from: pos[i].member, to: neg[j].member, amt });
    pos[i].net -= amt;
    neg[j].net += amt;
    if (pos[i].net < 1) i++;
    if (neg[j].net > -1) j++;
  }

  return { totals: t, maxMealMember, maxBazarMember, settlements };
}

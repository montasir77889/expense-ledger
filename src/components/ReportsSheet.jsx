import { computeTotals, getSettlements } from '../utils/calculations';
import { fmt, monthLabel } from '../utils/helpers';

export default function ReportsSheet({ members, monthData }) {
  const review = getSettlements(members, monthData);
  if (!review) {
    return <div className="empty-state"><p>Add members and data to see reports.</p></div>;
  }

  const { totals: t, maxMealMember, maxBazarMember, settlements } = review;
  const totalUtil = (monthData.bills.utilities || []).reduce((a, u) => a + Number(u.amount || 0), 0);
  const totalRent = members.reduce((a, m) => a + Number(monthData.bills.houseRent[m] || 0), 0);
  const totalSC = members.length ? Number(monthData.bills.serviceCharge || 0) : 0;
  const totalElec = t.totalElectricity || 0;

  return (
    <div>
      <h2 className="section-title">Monthly Report</h2>

      <div className="excel-table" style={{ marginBottom: 16 }}>
        <div className="excel-row excel-header">
          <span className="excel-c" style={{ flex: 1 }}>Member</span>
          <span className="excel-c" style={{ width: 60, textAlign: 'right' }}>Meals</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>Bazar</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>Utilities</span>
          <span className="excel-c" style={{ width: 70, textAlign: 'right' }}>Electric</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>Rent</span>
          <span className="excel-c" style={{ width: 70, textAlign: 'right' }}>S/Chg</span>
          <span className="excel-c" style={{ width: 100, textAlign: 'right' }}>Balance</span>
        </div>
        {t.rows.map(r => {
          const bal = r.total;
          return (
            <div key={r.member} className="excel-row">
              <span className="excel-c" style={{ flex: 1, fontWeight: 600 }}>{r.member}</span>
              <span className="excel-c" style={{ width: 60, textAlign: 'right' }}>{r.meals.toFixed(1)}</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(r.bazar)}</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(r.utilityBill)}</span>
              <span className="excel-c" style={{ width: 70, textAlign: 'right' }}>৳{fmt(r.electricityBill)}</span>
              <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(r.rent)}</span>
              <span className="excel-c" style={{ width: 70, textAlign: 'right' }}>৳{fmt(r.serviceCharge)}</span>
              <span className="excel-c" style={{ width: 100, textAlign: 'right', fontWeight: 700, color: bal > 0 ? 'var(--red)' : 'var(--green)' }}>
                ৳{fmt(Math.abs(bal))} {bal > 0 ? 'due' : 'extra'}
              </span>
            </div>
          );
        })}
        <div className="excel-row" style={{ fontWeight: 700, borderTop: '2px solid var(--text)' }}>
          <span className="excel-c" style={{ flex: 1 }}>Total</span>
          <span className="excel-c" style={{ width: 60, textAlign: 'right' }}>{t.totalMealUnits.toFixed(1)}</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(t.totalBazar)}</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(totalUtil)}</span>
          <span className="excel-c" style={{ width: 70, textAlign: 'right' }}>৳{fmt(totalElec)}</span>
          <span className="excel-c" style={{ width: 80, textAlign: 'right' }}>৳{fmt(totalRent)}</span>
          <span className="excel-c" style={{ width: 70, textAlign: 'right' }}>৳{fmt(totalSC)}</span>
          <span className="excel-c" style={{ width: 100, textAlign: 'right' }}>৳{fmt(t.grandTotal)}</span>
        </div>
      </div>

      {settlements.length > 0 && (
        <>
          <h3 className="sub-title">Settlement</h3>
          <div className="excel-table" style={{ marginBottom: 16 }}>
            {settlements.map((s, i) => (
              <div key={i} className="excel-row">
                <span className="excel-c" style={{ flex: 1, textAlign: 'right' }}>
                  <strong>{s.from}</strong> → <strong>{s.to}</strong>
                </span>
                <span className="excel-c" style={{ width: 100, textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>
                  ৳{fmt(s.amt)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="sub-title">Achievements</h3>
      <div className="badges-row">
        <div className="badge-card">
          <div className="b-icon">🛒</div>
          <div className="b-title">Grocery Hero</div>
          <div className="b-name">{maxBazarMember.member}</div>
          <div className="b-amt">{fmt(maxBazarMember.bazar)}</div>
        </div>
        <div className="badge-card">
          <div className="b-icon">🍽️</div>
          <div className="b-title">Biggest Appetite</div>
          <div className="b-name">{maxMealMember.member}</div>
          <div className="b-amt">{maxMealMember.meals.toFixed(0)} meals</div>
        </div>
      </div>
    </div>
  );
}

import { FiGrid, FiCoffee, FiList, FiUser, FiBarChart2, FiPrinter, FiFileText } from 'react-icons/fi';

const ICON_MAP = {
  calendar: FiGrid,
  meal: FiCoffee,
  daily_activity: FiList,
  summary: FiBarChart2,
  payment_slip: FiPrinter,
  bill_collection: FiFileText,
};

export default function TabBar({ tabs, active, onSelect }) {
  const isMemberTab = (id) => tabs.find(t => t.id === id)?.isMember;

  return (
    <nav className="tab-bar">
      {tabs.map(t => {
        const Icon = t.icon || (isMemberTab(t.id) ? FiUser : ICON_MAP[t.id]);
        const isActive = active === t.id || (t.id === 'calendar' && (!active || active === 'dashboard'));
        return (
          <button
            key={t.id}
            className={'tab-btn' + (isActive ? ' active' : '')}
            onClick={() => onSelect(t.id)}
            title={t.label}
          >
            {Icon && <Icon className="tab-icon" />}
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

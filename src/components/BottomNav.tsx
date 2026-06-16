import { Link, useLocation } from 'react-router-dom';
import { CalendarCheck, BarChart2, Swords, Settings } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
        <CalendarCheck size={24} />
        <span>Today</span>
      </Link>
      <Link to="/progress" className={`nav-item ${path === '/progress' ? 'active' : ''}`}>
        <BarChart2 size={24} />
        <span>Progress</span>
      </Link>
      <Link to="/versus" className={`nav-item ${path === '/versus' ? 'active' : ''}`}>
        <Swords size={24} />
        <span>Versus</span>
      </Link>
      <Link to="/challenges" className={`nav-item ${path === '/challenges' ? 'active' : ''}`}>
        <Settings size={24} />
        <span>Manage</span>
      </Link>
    </nav>
  );
}

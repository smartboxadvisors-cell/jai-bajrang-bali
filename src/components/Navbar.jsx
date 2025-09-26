import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'डैशबोर्ड' },
  { to: '/new', label: 'नई एंट्री' }
];

const activeClass = 'text-brand-dark border-brand-dark';
const baseClass =
  'flex items-center gap-2 px-3 py-2 border-b-2 border-transparent text-sm font-medium transition-colors hover:text-brand-dark';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-brand-dark">हनुमान जी सेवा</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : 'text-slate-600'}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

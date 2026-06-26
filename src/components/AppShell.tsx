import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, LayoutDashboard, LogOut, Menu, UserRound, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { clearCurrentSession, getCurrentSession, type AuthSession } from '../services/auth';

const publicNavigation = [
  { to: '/', label: 'Entrar' },
  { to: '/sobre', label: 'Sobre' }
];

const clientNavigation = [
  { to: '/cliente', label: 'Cliente' },
  { to: '/cliente/agendar', label: 'Agendar' },
  { to: '/cliente/meus-servicos', label: 'Meus servicos' },
  { to: '/sobre', label: 'Sobre' }
];

const providerNavigation = [
  { to: '/prestador', label: 'Dashboard' },
  { to: '/prestador/agenda', label: 'Agenda' },
  { to: '/prestador/servicos', label: 'Servicos' },
  { to: '/prestador/clientes', label: 'Clientes' },
  { to: '/sobre', label: 'Sobre' }
];

export const AppShell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSession(getCurrentSession());
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncSession = () => setSession(getCurrentSession());
    window.addEventListener('storage', syncSession);
    window.addEventListener('techagenda:session', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('techagenda:session', syncSession);
    };
  }, []);

  const navigation = useMemo(() => {
    if (session?.role === 'cliente') return clientNavigation;
    if (session?.role === 'prestador') return providerNavigation;
    return publicNavigation;
  }, [session]);

  const homePath = session?.role === 'cliente' ? '/cliente' : session?.role === 'prestador' ? '/prestador' : '/';

  const handleLogout = () => {
    clearCurrentSession();
    setSession(null);
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to={homePath} className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-900 text-white shadow-sm">
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold leading-tight text-brand-900">TechFix</span>
              <span className="block text-xs font-medium text-slate-500">Assistencia Tecnica</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Navegacao principal">
            {navigation.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {session ? (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {session.role === 'cliente' ? (
                    <UserRound className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  ) : (
                    <Building2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  )}
                  <span className="max-w-32 truncate">{session.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-900"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Entrar
              </Link>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
            onClick={() => setIsOpen((current) => !current)}
            aria-label="Abrir menu"
            aria-expanded={isOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {isOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="grid gap-2">
              {navigation.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} mobile />
              ))}

              {session ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sair de {session.role === 'cliente' ? 'Cliente' : 'Assistencia'}
                </button>
              ) : (
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Login ou cadastro
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-brand-900">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            TechAgenda
          </div>
          <p>TechFix Assistencia Tecnica - atendimento simulado para demonstracao.</p>
        </div>
      </footer>
    </div>
  );
};

type NavItemProps = {
  to: string;
  label: string;
  mobile?: boolean;
};

const NavItem = ({ to, label, mobile = false }: NavItemProps) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      [
        'rounded-lg font-semibold transition',
        mobile ? 'px-4 py-3 text-sm' : 'px-4 py-2 text-sm',
        isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-brand-800'
      ].join(' ')
    }
  >
    {label}
  </NavLink>
);

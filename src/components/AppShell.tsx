import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, LayoutDashboard, LogOut, Menu, Moon, ShieldCheck, Sun, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { clearCurrentSession, getCurrentSession, type AuthSession } from '../services/auth';
import { listarServicos } from '../services/storage';
import type { ServicoDetalhado } from '../types';

const THEME_KEY = 'techagenda:theme';
const READ_NOTIFICATIONS_KEY = 'techagenda:provider:read-notifications';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const publicNavigation = [
  { to: '/', label: 'Entrar' },
  { to: '/sobre', label: 'Sobre' }
];

const clientNavigation = [
  { to: '/cliente', label: 'Cliente' },
  { to: '/cliente/agendar', label: 'Agendar' },
  { to: '/cliente/meus-servicos', label: 'Meus servicos' }
];

const providerNavigation = [
  { to: '/prestador', label: 'Dashboard' },
  { to: '/prestador/agenda', label: 'Agenda' },
  { to: '/prestador/servicos', label: 'Servicos' },
  { to: '/prestador/clientes', label: 'Clientes' }
];

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getReadNotificationIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const daysBetween = (date: string, baseDate: string) => {
  const target = new Date(`${date}T00:00:00`);
  const base = new Date(`${baseDate}T00:00:00`);
  return Math.round((target.getTime() - base.getTime()) / 86400000);
};

const getProviderNotificationIds = (services: ServicoDetalhado[]) => {
  const today = toDateValue(new Date());

  return services.flatMap((service) => {
    const ids: string[] = [];
    const scheduleDistance = daysBetween(service.agendamento.data, today);

    if (service.ordem.status === 'Aguardando aprovação') ids.push(`${service.id}:approval`);
    if (service.ordem.status === 'Pronto para retirada') ids.push(`${service.id}:pickup`);
    if (service.agendamento.urgencia === 'Urgente' && !['Cancelado', 'Finalizado'].includes(service.ordem.status)) {
      ids.push(`${service.id}:urgent`);
    }
    if (scheduleDistance >= 0 && scheduleDistance <= 1 && !['Cancelado', 'Finalizado'].includes(service.ordem.status)) {
      ids.push(`${service.id}:schedule`);
    }

    return ids;
  });
};

export const AppShell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSession(getCurrentSession());
    setIsOpen(false);
    setNotificationRefreshKey((current) => current + 1);
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === THEME_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
        setTheme(event.newValue);
      }
    };

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const navigation = useMemo(() => {
    if (session?.role === 'cliente') return clientNavigation;
    if (session?.role === 'prestador') return providerNavigation;
    return publicNavigation;
  }, [session]);

  const homePath = session?.role === 'cliente' ? '/cliente' : session?.role === 'prestador' ? '/prestador' : '/';
  const providerUnreadNotifications = useMemo(() => {
    if (session?.role !== 'prestador') return 0;

    const readIds = getReadNotificationIds();
    return getProviderNotificationIds(listarServicos()).filter((id) => !readIds.includes(id)).length;
  }, [session?.role, notificationRefreshKey]);

  const handleLogout = () => {
    clearCurrentSession();
    setSession(null);
    setIsOpen(false);
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-[68px] w-full items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
          {session ? <ModeBadge role={session.role} /> : null}

          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link to={homePath} className="flex min-w-0 shrink-0 items-center gap-3" onClick={() => setIsOpen(false)}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white shadow-sm">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-bold leading-tight text-brand-900">TechFix</span>
                <span className="hidden truncate text-xs font-medium text-slate-500 sm:block">Assistencia Tecnica</span>
              </span>
            </Link>

            <nav className="hidden min-w-0 items-center gap-1 md:flex" aria-label="Navegacao principal">
              {navigation.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} />
              ))}
            </nav>
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            {session?.role === 'prestador' ? <NotificationButton count={providerUnreadNotifications} /> : null}
            <ThemeButton theme={theme} onClick={toggleTheme} />
            {session ? (
              <>
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

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {session?.role === 'prestador' ? <NotificationButton count={providerUnreadNotifications} /> : null}
            <ThemeButton theme={theme} onClick={toggleTheme} />
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

type ModeBadgeProps = {
  role: AuthSession['role'];
};

const ModeBadge = ({ role }: ModeBadgeProps) => (
  <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-brand-900 ring-1 ring-brand-200">
    <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
    <span className="hidden sm:inline">{role === 'prestador' ? 'Administrador' : 'Cliente'}</span>
    <span className="sm:hidden">{role === 'prestador' ? 'Admin' : 'Cliente'}</span>
  </span>
);

type NotificationButtonProps = {
  count: number;
};

const NotificationButton = ({ count }: NotificationButtonProps) => (
  <Link
    to="/prestador#notificacoes-prestador"
    className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
    aria-label={count ? `${count} notificacoes novas` : 'Notificacoes'}
    title="Notificacoes"
  >
    <Bell className="h-5 w-5" aria-hidden="true" />
    {count ? (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
        {count}
      </span>
    ) : null}
  </Link>
);

const NavItem = ({ to, label, mobile = false }: NavItemProps) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      [
        'rounded-lg font-semibold transition',
        mobile ? 'px-4 py-3 text-sm' : 'px-3 py-2 text-sm lg:px-4',
        isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-brand-800'
      ].join(' ')
    }
  >
    {label}
  </NavLink>
);

type ThemeButtonProps = {
  theme: Theme;
  onClick: () => void;
};

const ThemeButton = ({ theme, onClick }: ThemeButtonProps) => {
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  CheckCheck,
  ClipboardList,
  Clock3,
  Gauge,
  LayoutDashboard,
  PackageCheck,
  RotateCcw,
  Settings,
  ShieldCheck,
  UsersRound,
  Wrench
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { statusLabels, statusSteps } from '../../data/status';
import { listarServicos, resetarDadosDemonstracao } from '../../services/storage';
import type { ServicoDetalhado, StatusServico } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

const READ_NOTIFICATIONS_KEY = 'techagenda:provider:read-notifications';

const sidebarLinks = [
  { label: 'Dashboard', to: '/prestador', icon: LayoutDashboard },
  { label: 'Agenda', to: '/prestador/agenda', icon: CalendarDays },
  { label: 'Serviços', to: '/prestador/servicos', icon: ClipboardList },
  { label: 'Clientes', to: '/prestador/clientes', icon: UsersRound },
  { label: 'Configurações', to: '#configuracoes', icon: Settings }
];

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const compareSchedule = (a: ServicoDetalhado, b: ServicoDetalhado) =>
  `${a.agendamento.data}${a.agendamento.horario}`.localeCompare(`${b.agendamento.data}${b.agendamento.horario}`);

type ProviderNotification = {
  id: string;
  service: ServicoDetalhado;
  title: string;
  description: string;
  timestamp: string;
  tone: 'critical' | 'warning' | 'success' | 'info';
  icon: typeof Bell;
};

const getReadNotificationIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const saveReadNotificationIds = (ids: string[]) => {
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids));
};

const daysBetween = (date: string, baseDate: string) => {
  const target = new Date(`${date}T00:00:00`);
  const base = new Date(`${baseDate}T00:00:00`);
  return Math.round((target.getTime() - base.getTime()) / 86400000);
};

const buildProviderNotifications = (services: ServicoDetalhado[], today: string): ProviderNotification[] => {
  const notifications = services.flatMap((service) => {
    const serviceNotifications: ProviderNotification[] = [];
    const scheduleDistance = daysBetween(service.agendamento.data, today);
    const updatedAt = service.ordem.atualizadoEm ?? service.agendamento.criadoEm;

    if (service.ordem.status === 'Aguardando aprovação') {
      serviceNotifications.push({
        id: `${service.id}:approval`,
        service,
        title: 'Orcamento aguardando aprovacao',
        description: `${service.cliente.nome} precisa aprovar ${formatCurrency(service.ordem.valorOrcamento ?? 0)}.`,
        timestamp: updatedAt,
        tone: 'warning',
        icon: ClipboardList
      });
    }

    if (service.ordem.status === 'Pronto para retirada') {
      serviceNotifications.push({
        id: `${service.id}:pickup`,
        service,
        title: 'Equipamento pronto para retirada',
        description: `${service.equipamento.tipo} ${service.equipamento.marca} ja pode ser entregue ao cliente.`,
        timestamp: updatedAt,
        tone: 'success',
        icon: PackageCheck
      });
    }

    if (service.agendamento.urgencia === 'Urgente' && !['Cancelado', 'Finalizado'].includes(service.ordem.status)) {
      serviceNotifications.push({
        id: `${service.id}:urgent`,
        service,
        title: 'Atendimento urgente',
        description: `${service.cliente.nome} marcou prioridade urgente para ${formatDate(service.agendamento.data)}.`,
        timestamp: service.agendamento.criadoEm,
        tone: 'critical',
        icon: AlertTriangle
      });
    }

    if (scheduleDistance >= 0 && scheduleDistance <= 1 && !['Cancelado', 'Finalizado'].includes(service.ordem.status)) {
      serviceNotifications.push({
        id: `${service.id}:schedule`,
        service,
        title: scheduleDistance === 0 ? 'Agendamento para hoje' : 'Agendamento para amanha',
        description: `${service.agendamento.horario} - ${service.cliente.nome}, ${service.equipamento.tipo} ${service.equipamento.marca}.`,
        timestamp: service.agendamento.criadoEm,
        tone: 'info',
        icon: Clock3
      });
    }

    return serviceNotifications;
  });

  return notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
};

export const ProviderHomePage = () => {
  const [resetMessage, setResetMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => getReadNotificationIds());
  const services = listarServicos();
  const today = toDateValue(new Date());

  const metrics = {
    todaySchedules: services.filter((service) => service.agendamento.data === today).length,
    inRepair: services.filter((service) => service.ordem.status === 'Em reparo').length,
    waitingApproval: services.filter((service) => service.ordem.status === 'Aguardando aprovação').length,
    ready: services.filter((service) => service.ordem.status === 'Pronto para retirada').length
  };

  const statusCounts = useMemo(
    () =>
      statusSteps.reduce(
        (acc, status) => ({
          ...acc,
          [status]: services.filter((service) => service.ordem.status === status).length
        }),
        {} as Record<StatusServico, number>
      ),
    [services]
  );

  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));
  const notifications = useMemo(() => buildProviderNotifications(services, today), [services, today]);
  const unreadNotifications = notifications.filter((notification) => !readNotificationIds.includes(notification.id));
  const upcomingServices = services
    .filter((service) => service.ordem.status !== 'Cancelado' && service.ordem.status !== 'Finalizado')
    .filter((service) => service.agendamento.data >= today)
    .sort(compareSchedule)
    .slice(0, 5);

  const attentionServices = services
    .filter((service) =>
      ['Aguardando aprovação', 'Pronto para retirada', 'Urgente'].includes(
        service.ordem.status === 'Aguardando aprovação' || service.ordem.status === 'Pronto para retirada'
          ? service.ordem.status
          : service.agendamento.urgencia ?? ''
      )
    )
    .sort((a, b) => {
      const priority = (service: ServicoDetalhado) => {
        if (service.ordem.status === 'Aguardando aprovação') return 0;
        if (service.ordem.status === 'Pronto para retirada') return 1;
        if (service.agendamento.urgencia === 'Urgente') return 2;
        return 3;
      };

      return priority(a) - priority(b) || compareSchedule(a, b);
    })
    .slice(0, 5);

  const handleReset = () => {
    resetarDadosDemonstracao();
    setRefreshKey((current) => current + 1);
    setResetMessage('Dados de demonstração restaurados.');
  };

  const markNotificationAsRead = (notificationId: string) => {
    setReadNotificationIds((current) => {
      if (current.includes(notificationId)) return current;

      const nextIds = [...current, notificationId];
      saveReadNotificationIds(nextIds);
      return nextIds;
    });
  };

  const markAllNotificationsAsRead = () => {
    const nextIds = Array.from(new Set([...readNotificationIds, ...notifications.map((notification) => notification.id)]));
    setReadNotificationIds(nextIds);
    saveReadNotificationIds(nextIds);
  };

  return (
    <section className="bg-slate-50" key={refreshKey}>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-900 text-white">
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-brand-900">TechFix</p>
              <p className="text-xs font-semibold text-slate-500">Painel administrativo</p>
            </div>
          </div>

          <nav className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const isDashboard = item.to === '/prestador';
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition ${
                    isDashboard
                      ? 'bg-brand-50 text-brand-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-brand-900'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-brand-600">TechFix Assistência Técnica</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-900 ring-1 ring-brand-200">
                  <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  Modo prestador
                </div>
                <h1 className="mt-3 text-3xl font-bold text-brand-900">Dashboard administrativo</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Visão geral dos atendimentos salvos no LocalStorage.
                </p>
              </div>
            </div>
          </header>

          <section id="notificacoes-prestador" className="mt-6 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Bell className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-brand-900">Notificacoes</h2>
                    {unreadNotifications.length ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">
                        {unreadNotifications.length} novas
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                        Tudo lido
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Alertas gerados automaticamente pelos servicos mockados cadastrados.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                disabled={!unreadNotifications.length}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-brand-900 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                Marcar como lidas
              </button>
            </div>

            {notifications.length ? (
              <div className="mt-5 grid gap-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isUnread={!readNotificationIds.includes(notification.id)}
                    onRead={() => markNotificationAsRead(notification.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
                Nenhuma notificacao gerada pelos dados atuais.
              </div>
            )}
          </section>

          {resetMessage ? (
            <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              {resetMessage}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Agendamentos de hoje" value={metrics.todaySchedules} icon={CalendarDays} />
            <MetricCard label="Serviços em reparo" value={metrics.inRepair} icon={Wrench} />
            <MetricCard label="Orçamentos aguardando aprovação" value={metrics.waitingApproval} icon={ClipboardList} />
            <MetricCard label="Prontos para retirada" value={metrics.ready} icon={CheckCircle2} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-brand-700" aria-hidden="true" />
                <h2 className="text-xl font-bold text-brand-900">Serviços por status</h2>
              </div>

              <div className="mt-5 grid gap-4">
                {statusSteps.map((status) => {
                  const count = statusCounts[status];
                  const width = `${Math.max(6, (count / maxStatusCount) * 100)}%`;

                  return (
                    <div key={status}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-700">{statusLabels[status]}</span>
                        <span className="font-bold text-brand-900">{count}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-700" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="configuracoes" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-brand-700" aria-hidden="true" />
                <h2 className="text-xl font-bold text-brand-900">Configurações</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Restaure os dados mockados originais quando quiser voltar ao cenário de demonstração.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Resetar dados de demonstração
              </button>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <DashboardList
              title="Próximos agendamentos"
              emptyText="Não há próximos agendamentos ativos."
              services={upcomingServices}
            />
            <DashboardList
              title="Serviços que precisam de atenção"
              emptyText="Nenhum serviço exige atenção imediata."
              services={attentionServices}
              attention
            />
          </div>
        </div>
      </div>
    </section>
  );
};

type NotificationItemProps = {
  notification: ProviderNotification;
  isUnread: boolean;
  onRead: () => void;
};

const notificationTone: Record<ProviderNotification['tone'], string> = {
  critical: 'bg-red-50 text-red-700 ring-red-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200'
};

const NotificationItem = ({ notification, isUnread, onRead }: NotificationItemProps) => {
  const Icon = notification.icon;

  return (
    <article
      className={`rounded-lg border p-4 transition ${
        isUnread ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${notificationTone[notification.tone]}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900">{notification.title}</h3>
              {isUnread ? <span className="h-2 w-2 rounded-full bg-brand-700" aria-label="Nao lida" /> : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{notification.description}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {notification.service.ordem.protocolo} - {notification.service.cliente.nome}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {isUnread ? (
            <button
              type="button"
              onClick={onRead}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Marcar lida
            </button>
          ) : null}
          <Link
            to="/prestador/servicos"
            onClick={onRead}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-800 px-3 py-2 text-sm font-bold text-white transition hover:bg-brand-900"
          >
            Abrir OS
          </Link>
        </div>
      </div>
    </article>
  );
};

type MetricCardProps = {
  label: string;
  value: number;
  icon: typeof CalendarDays;
};

const MetricCard = ({ label, value, icon: Icon }: MetricCardProps) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-brand-900">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    </div>
  </div>
);

type DashboardListProps = {
  title: string;
  emptyText: string;
  services: ServicoDetalhado[];
  attention?: boolean;
};

const DashboardList = ({ title, emptyText, services, attention = false }: DashboardListProps) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-xl font-bold text-brand-900">{title}</h2>

    {services.length ? (
      <div className="mt-4 grid gap-3">
        {services.map((service) => (
          <article key={service.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-brand-600">{service.ordem.protocolo}</p>
                <h3 className="mt-1 font-bold text-slate-900">
                  {service.equipamento.tipo} {service.equipamento.marca}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {service.cliente.nome} · {formatDate(service.agendamento.data)} às {service.agendamento.horario}
                </p>
              </div>
              <StatusBadge status={service.ordem.status} />
            </div>

            {attention && service.ordem.valorOrcamento ? (
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Orçamento: {formatCurrency(service.ordem.valorOrcamento)}
              </p>
            ) : null}

            <Link
              to={`/cliente/servico/${service.id}`}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-900"
            >
              Ver detalhes
            </Link>
          </article>
        ))}
      </div>
    ) : (
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
        {emptyText}
      </div>
    )}
  </section>
);

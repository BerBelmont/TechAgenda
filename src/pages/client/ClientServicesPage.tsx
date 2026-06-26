import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarSearch, ClipboardList, Search, Wrench } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { statusLabels } from '../../data/status';
import { getLoggedClient } from '../../services/auth';
import { listarServicos } from '../../services/storage';
import type { ServicoDetalhado, StatusServico } from '../../types';
import { formatDate } from '../../utils/format';

const statusOptions: Array<StatusServico | 'Todos'> = [
  'Todos',
  'Agendado',
  'Equipamento recebido',
  'Em avaliação',
  'Aguardando aprovação',
  'Em reparo',
  'Pronto para retirada',
  'Finalizado',
  'Cancelado'
];

const getNotifications = (services: ServicoDetalhado[]) => {
  const notifications: string[] = [];

  if (services.some((service) => service.ordem.status === 'Em avaliação')) {
    notifications.push('Seu equipamento está em avaliação.');
  }

  if (services.some((service) => service.ordem.status === 'Aguardando aprovação')) {
    notifications.push('Seu orçamento está disponível.');
  }

  if (services.some((service) => service.ordem.status === 'Pronto para retirada')) {
    notifications.push('Seu equipamento está pronto para retirada.');
  }

  return notifications;
};

export const ClientServicesPage = () => {
  const loggedClient = getLoggedClient();
  const services = listarServicos().filter((service) => !loggedClient || service.cliente.id === loggedClient.id);
  const [statusFilter, setStatusFilter] = useState<StatusServico | 'Todos'>('Todos');
  const [search, setSearch] = useState('');
  const firstClientName = loggedClient?.nome.split(' ')[0] ?? services[0]?.cliente.nome.split(' ')[0] ?? 'cliente';

  const notifications = getNotifications(services);
  const summary = {
    inProgress: services.filter(
      (service) =>
        service.ordem.status !== 'Aguardando aprovação' &&
        service.ordem.status !== 'Finalizado' &&
        service.ordem.status !== 'Cancelado'
    ).length,
    waitingApproval: services.filter((service) => service.ordem.status === 'Aguardando aprovação').length,
    finished: services.filter((service) => service.ordem.status === 'Finalizado').length
  };

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesStatus = statusFilter === 'Todos' || service.ordem.status === statusFilter;
      const searchableText = [
        service.ordem.protocolo,
        service.equipamento.tipo,
        service.equipamento.marca,
        service.equipamento.modelo
      ]
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [search, services, statusFilter]);

  return (
    <>
      <PageHeader
        eyebrow="Cliente"
        title={`Olá, ${firstClientName}`}
        description="Acompanhe seus serviços, veja orçamentos e consulte cada etapa do atendimento."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {notifications.length ? (
          <div className="mb-6 grid gap-3">
            {notifications.map((notification) => (
              <div
                key={notification}
                className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-900"
              >
                {notification}
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Serviços em andamento" value={summary.inProgress} />
          <SummaryCard label="Aguardando aprovação" value={summary.waitingApproval} />
          <SummaryCard label="Finalizados" value={summary.finished} />
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Filtrar por status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusServico | 'Todos')}
                className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 transition hover:border-brand-300"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'Todos' ? 'Todos os status' : statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Buscar serviço
              <span className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-slate-900 transition hover:border-brand-300"
                  placeholder="Busque por protocolo, equipamento ou marca"
                />
              </span>
            </label>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-700" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-brand-900">Serviços cadastrados</h2>
          </div>

          {filteredServices.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredServices.map((service) => (
                <article key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-brand-600">
                        {service.ordem.protocolo}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-brand-900">
                        {service.equipamento.tipo} {service.equipamento.marca}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{service.equipamento.modelo}</p>
                    </div>
                    <StatusBadge status={service.ordem.status} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <span>
                      <strong className="text-slate-900">Atendimento:</strong> {formatDate(service.agendamento.data)}
                    </span>
                    <span>
                      <strong className="text-slate-900">Horário:</strong> {service.agendamento.horario}
                    </span>
                  </div>

                  <Link
                    to={`/cliente/servico/${service.id}`}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900 sm:w-auto"
                  >
                    <Wrench className="h-4 w-4" aria-hidden="true" />
                    Ver detalhes
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarSearch}
              title="Nenhum serviço encontrado"
              description="Tente limpar a busca ou escolher outro status para ver seus atendimentos."
            />
          )}
        </div>
      </section>
    </>
  );
};

type SummaryCardProps = {
  label: string;
  value: number;
};

const SummaryCard = ({ label, value }: SummaryCardProps) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold text-brand-900">{value}</p>
  </div>
);

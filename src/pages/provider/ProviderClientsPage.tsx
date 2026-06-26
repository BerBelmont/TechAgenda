import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Mail, Phone, Search, UserRound, UsersRound, Wrench, X } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { statusLabels } from '../../data/status';
import { listarClientes, listarServicos } from '../../services/storage';
import type { Cliente, ServicoDetalhado } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

export const ProviderClientsPage = () => {
  const clients = listarClientes();
  const services = listarServicos();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const searchable = [client.nome, client.telefone, client.email].join(' ').toLowerCase();
      return !normalizedSearch || searchable.includes(normalizedSearch);
    });
  }, [clients, search]);

  const getClientServices = (clientId: string) =>
    services
      .filter((service) => service.cliente.id === clientId)
      .sort((a, b) => b.agendamento.criadoEm.localeCompare(a.agendamento.criadoEm));

  return (
    <>
      <PageHeader
        eyebrow="Prestador"
        title="Clientes"
        description="Consulte contatos, equipamentos atendidos e histórico completo de ordens de serviço."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Buscar cliente
            <span className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-slate-900 transition hover:border-brand-300"
                placeholder="Nome, telefone ou e-mail"
              />
            </span>
          </label>
        </div>

        {filteredClients.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => {
              const clientServices = getClientServices(client.id);
              const lastService = clientServices[0];

              return (
                <article key={client.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <UserRound className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-brand-900">{client.nome}</h2>
                      <p className="text-sm text-slate-500">{clientServices.length} serviço(s)</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
                      {client.telefone}
                    </span>
                    <span className="flex items-center gap-2 break-all">
                      <Mail className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                      {client.email}
                    </span>
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />
                      Último atendimento: {lastService ? formatDate(lastService.agendamento.data) : 'sem atendimentos'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedClient(client)}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
                  >
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                    Visualizar histórico completo
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="Nenhum cliente encontrado"
            description="Tente buscar por outro nome, telefone ou e-mail."
          />
        )}
      </section>

      {selectedClient ? (
        <ClientHistoryModal
          client={selectedClient}
          services={getClientServices(selectedClient.id)}
          onClose={() => setSelectedClient(null)}
        />
      ) : null}
    </>
  );
};

type ClientHistoryModalProps = {
  client: Cliente;
  services: ServicoDetalhado[];
  onClose: () => void;
};

const ClientHistoryModal = ({ client, services, onClose }: ClientHistoryModalProps) => {
  const equipments = services.map((service) => service.equipamento);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 p-4">
      <div className="mx-auto max-w-5xl rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Cliente</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-900">{client.nome}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            aria-label="Fechar histórico"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[320px_1fr]">
          <aside className="grid gap-5">
            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold text-brand-900">Dados de contato</h3>
              <div className="mt-3 grid gap-3 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  {client.telefone}
                </p>
                <p className="flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {client.email}
                </p>
                <p>
                  <strong className="text-slate-900">Preferência:</strong>{' '}
                  {client.preferenciaContato ?? 'Não informada'}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold text-brand-900">Equipamentos atendidos</h3>
              <div className="mt-3 grid gap-3">
                {equipments.length ? (
                  equipments.map((equipment) => (
                    <div key={equipment.id} className="rounded-lg bg-slate-50 p-3">
                      <p className="font-bold text-slate-900">
                        {equipment.tipo} {equipment.marca}
                      </p>
                      <p className="text-sm text-slate-500">{equipment.modelo}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhum equipamento registrado.</p>
                )}
              </div>
            </section>
          </aside>

          <div className="grid gap-5">
            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold text-brand-900">Histórico de ordens de serviço</h3>
              <div className="mt-4 grid gap-4">
                {services.length ? (
                  services.map((service) => (
                    <article key={service.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">
                            {service.ordem.protocolo}
                          </p>
                          <h4 className="mt-1 font-bold text-slate-900">
                            {service.equipamento.tipo} {service.equipamento.marca} - {service.equipamento.modelo}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(service.agendamento.data)} às {service.agendamento.horario}
                          </p>
                        </div>
                        <StatusBadge status={service.ordem.status} />
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          <strong className="text-slate-900">Orçamento:</strong>{' '}
                          {formatCurrency(service.ordem.valorOrcamento)}
                        </p>
                        <p>
                          <strong className="text-slate-900">Prazo:</strong>{' '}
                          {service.ordem.prazoEstimado ?? 'A definir'}
                        </p>
                      </div>
                      <Link
                        to={`/cliente/servico/${service.id}`}
                        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
                      >
                        <Wrench className="h-4 w-4" aria-hidden="true" />
                        Abrir detalhes
                      </Link>
                    </article>
                  ))
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    Nenhuma ordem de serviço cadastrada para este cliente.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold text-brand-900">Linha do tempo dos atendimentos</h3>
              <div className="mt-4 grid gap-3">
                {services.length ? (
                  services.map((service, index) => (
                    <div key={`${service.id}-timeline`} className="flex gap-3">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{service.ordem.protocolo}</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(service.agendamento.data)} - {service.equipamento.tipo}{' '}
                          {service.equipamento.marca}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Status: {statusLabels[service.ordem.status]}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Sem eventos para exibir.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

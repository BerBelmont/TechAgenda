import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  ClipboardX,
  Play,
  Search,
  Send,
  Wrench,
  X
} from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { Toast } from '../../components/Toast';
import { statusLabels, statusSteps } from '../../data/status';
import { atualizarOrdemDeServico, listarServicos } from '../../services/storage';
import type { ServicoDetalhado, StatusServico, TipoEquipamento } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

type SortMode = 'data-desc' | 'data-asc' | 'prioridade';

type OrderForm = {
  diagnostico: string;
  observacoes: string;
  prazoEstimado: string;
  valorOrcamento: string;
  status: StatusServico;
};

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

const equipmentOptions: Array<TipoEquipamento | 'Todos'> = [
  'Todos',
  'Celular',
  'Notebook',
  'Computador',
  'Televisão',
  'Impressora',
  'Tablet',
  'Outro'
];

const priorityScore = (service: ServicoDetalhado) => {
  if (service.ordem.status === 'Aguardando aprovação') return 0;
  if (service.ordem.status === 'Pronto para retirada') return 1;
  if (service.agendamento.urgencia === 'Urgente') return 2;
  if (service.agendamento.urgencia === 'Prioridade') return 3;
  if (service.ordem.status === 'Em reparo') return 4;
  return 5;
};

const getInitialForm = (service: ServicoDetalhado): OrderForm => ({
  diagnostico: service.ordem.diagnostico ?? '',
  observacoes: service.ordem.observacoes ?? '',
  prazoEstimado: service.ordem.prazoEstimado ?? '',
  valorOrcamento: service.ordem.valorOrcamento ? String(service.ordem.valorOrcamento) : '',
  status: service.ordem.status
});

const getContextAction = (status: StatusServico) => {
  if (status === 'Agendado' || status === 'Equipamento recebido') {
    return { label: 'Iniciar avaliação', status: 'Em avaliação' as StatusServico, icon: Play };
  }

  if (status === 'Em avaliação') {
    return { label: 'Enviar orçamento', status: 'Aguardando aprovação' as StatusServico, icon: Send };
  }

  if (status === 'Aguardando aprovação') {
    return { label: 'Iniciar reparo', status: 'Em reparo' as StatusServico, icon: Wrench };
  }

  if (status === 'Em reparo') {
    return { label: 'Marcar como pronto', status: 'Pronto para retirada' as StatusServico, icon: CheckCircle2 };
  }

  if (status === 'Pronto para retirada') {
    return { label: 'Finalizar serviço', status: 'Finalizado' as StatusServico, icon: ClipboardCheck };
  }

  return null;
};

export const ProviderServicesPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusServico | 'Todos'>('Todos');
  const [equipmentFilter, setEquipmentFilter] = useState<TipoEquipamento | 'Todos'>('Todos');
  const [sortMode, setSortMode] = useState<SortMode>('prioridade');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedService, setSelectedService] = useState<ServicoDetalhado | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const services = listarServicos();

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return services
      .filter((service) => {
        const matchesStatus = statusFilter === 'Todos' || service.ordem.status === statusFilter;
        const matchesEquipment =
          equipmentFilter === 'Todos' || service.equipamento.tipo === equipmentFilter;
        const searchable = [
          service.ordem.protocolo,
          service.cliente.nome,
          service.equipamento.tipo,
          service.equipamento.marca,
          service.equipamento.modelo
        ]
          .join(' ')
          .toLowerCase();

        return matchesStatus && matchesEquipment && (!normalizedSearch || searchable.includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (sortMode === 'prioridade') {
          return priorityScore(a) - priorityScore(b) || b.agendamento.criadoEm.localeCompare(a.agendamento.criadoEm);
        }

        if (sortMode === 'data-asc') {
          return a.agendamento.criadoEm.localeCompare(b.agendamento.criadoEm);
        }

        return b.agendamento.criadoEm.localeCompare(a.agendamento.criadoEm);
      });
  }, [equipmentFilter, search, services, sortMode, statusFilter]);

  const visibleServices = filteredServices.slice(0, visibleCount);

  const openService = (service: ServicoDetalhado) => {
    setSelectedService(service);
  };

  const handleUpdated = (service?: ServicoDetalhado) => {
    if (service) setSelectedService(service);
    setRefreshKey((current) => current + 1);
  };

  return (
    <>
      <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Prestador</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-900 sm:text-4xl">Ordens de serviço</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Acompanhe, atualize e avance os atendimentos da TechFix em uma única tela.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" key={refreshKey}>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_190px]">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Busca
              <span className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVisibleCount(6);
                  }}
                  className="min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-slate-900 transition hover:border-brand-300"
                  placeholder="Protocolo, cliente, equipamento ou marca"
                />
              </span>
            </label>

            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as StatusServico | 'Todos');
                setVisibleCount(6);
              }}
              options={statusOptions.map((status) => ({
                value: status,
                label: status === 'Todos' ? 'Todos' : statusLabels[status]
              }))}
            />

            <SelectFilter
              label="Tipo"
              value={equipmentFilter}
              onChange={(value) => {
                setEquipmentFilter(value as TipoEquipamento | 'Todos');
                setVisibleCount(6);
              }}
              options={equipmentOptions.map((equipment) => ({ value: equipment, label: equipment }))}
            />

            <SelectFilter
              label="Ordenar"
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
              options={[
                { value: 'prioridade', label: 'Prioridade' },
                { value: 'data-desc', label: 'Mais recentes' },
                { value: 'data-asc', label: 'Mais antigos' }
              ]}
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {visibleServices.length ? (
            <>
              <div className="hidden grid-cols-[140px_1.05fr_1.05fr_135px_170px_120px_120px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-600 lg:grid">
                <span>Protocolo</span>
                <span>Cliente</span>
                <span>Equipamento</span>
                <span>Data de entrada</span>
                <span>Status</span>
                <span>Orçamento</span>
                <span>Ações</span>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleServices.map((service) => (
                  <article
                    key={service.id}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[140px_1.05fr_1.05fr_135px_170px_120px_120px] lg:items-center"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">
                        Protocolo
                      </span>
                      <p className="font-bold text-brand-900">{service.ordem.protocolo}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">
                        Cliente
                      </span>
                      <p className="font-semibold text-slate-900">{service.cliente.nome}</p>
                      <p className="text-sm text-slate-500">{service.cliente.telefone}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">
                        Equipamento
                      </span>
                      <p className="font-semibold text-slate-900">
                        {service.equipamento.tipo} {service.equipamento.marca}
                      </p>
                      <p className="text-sm text-slate-500">{service.equipamento.modelo}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">
                        Data de entrada
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatDate(service.agendamento.criadoEm.slice(0, 10))}
                      </p>
                    </div>
                    <div>
                      <StatusBadge status={service.ordem.status} />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">
                        Orçamento
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {formatCurrency(service.ordem.valorOrcamento)}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => openService(service)}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-900"
                      >
                        Abrir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={ClipboardX}
                title="Nenhuma ordem encontrada"
                description="Ajuste os filtros ou a busca para encontrar serviços cadastrados."
              />
            </div>
          )}
        </div>

        {visibleCount < filteredServices.length ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 6)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              Carregar mais
            </button>
          </div>
        ) : null}
      </section>

      {selectedService ? (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onUpdated={handleUpdated}
        />
      ) : null}
    </>
  );
};

type SelectFilterProps = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

const SelectFilter = ({ label, value, options, onChange }: SelectFilterProps) => (
  <label className="grid gap-2 text-sm font-semibold text-slate-700">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 transition hover:border-brand-300"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

type ServiceDetailModalProps = {
  service: ServicoDetalhado;
  onClose: () => void;
  onUpdated: (service?: ServicoDetalhado) => void;
};

const ServiceDetailModal = ({ service, onClose, onUpdated }: ServiceDetailModalProps) => {
  const [form, setForm] = useState<OrderForm>(getInitialForm(service));
  const [message, setMessage] = useState('');
  const contextAction = getContextAction(form.status);
  const history = service.ordem.historicoStatus?.length
    ? service.ordem.historicoStatus
    : [
        {
          status: service.ordem.status,
          data: service.ordem.atualizadoEm ?? service.agendamento.criadoEm,
          observacao: service.ordem.observacoes
        }
      ];

  useEffect(() => {
    setForm(getInitialForm(service));
    setMessage('');
  }, [service]);

  const saveOrder = (statusOverride?: StatusServico, historyMessage?: string) => {
    const nextStatus = statusOverride ?? form.status;
    const updated = atualizarOrdemDeServico(service.id, {
      status: nextStatus,
      diagnostico: form.diagnostico.trim() || undefined,
      observacoes: form.observacoes.trim() || undefined,
      prazoEstimado: form.prazoEstimado.trim() || undefined,
      valorOrcamento: form.valorOrcamento ? Number(form.valorOrcamento) : undefined,
      historicoObservacao: historyMessage
    });

    if (updated) {
      onUpdated(updated);
      setForm(getInitialForm(updated));
      setMessage('Ordem de serviço atualizada.');
    }
  };

  const runContextAction = () => {
    if (!contextAction) return;

    const historyMessage =
      contextAction.status === 'Aguardando aprovação'
        ? 'Orçamento enviado pela assistência.'
        : contextAction.label;

    saveOrder(contextAction.status, historyMessage);
  };
  const ContextActionIcon = contextAction?.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 p-4">
      {message ? <Toast type="success" message={message} onClose={() => setMessage('')} /> : null}

      <div className="mx-auto max-w-5xl rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-600">{service.ordem.protocolo}</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-900">Detalhes da ordem de serviço</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-5">
            <section className="grid gap-4 md:grid-cols-2">
              <InfoPanel title="Cliente">
                <p className="font-bold text-slate-900">{service.cliente.nome}</p>
                <p className="text-sm text-slate-600">{service.cliente.telefone}</p>
                <p className="text-sm text-slate-600">{service.cliente.email}</p>
              </InfoPanel>
              <InfoPanel title="Equipamento">
                <p className="font-bold text-slate-900">
                  {service.equipamento.tipo} {service.equipamento.marca}
                </p>
                <p className="text-sm text-slate-600">{service.equipamento.modelo}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{service.equipamento.descricaoProblema}</p>
              </InfoPanel>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-lg font-bold text-brand-900">Dados técnicos</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextAreaField
                  label="Diagnóstico técnico"
                  value={form.diagnostico}
                  onChange={(value) => setForm((current) => ({ ...current, diagnostico: value }))}
                />
                <TextAreaField
                  label="Observações"
                  value={form.observacoes}
                  onChange={(value) => setForm((current) => ({ ...current, observacoes: value }))}
                />
                <TextField
                  label="Prazo estimado"
                  value={form.prazoEstimado}
                  placeholder="Ex.: 2 dias úteis"
                  onChange={(value) => setForm((current) => ({ ...current, prazoEstimado: value }))}
                />
                <TextField
                  label="Valor do orçamento"
                  type="number"
                  value={form.valorOrcamento}
                  placeholder="Ex.: 350"
                  onChange={(value) => setForm((current) => ({ ...current, valorOrcamento: value }))}
                />
                <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value as StatusServico }))
                    }
                    className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 transition hover:border-brand-300"
                  >
                    {[...statusSteps, 'Cancelado' as StatusServico].map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => saveOrder(undefined, 'Dados técnicos atualizados.')}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
              >
                Salvar alterações
              </button>

              {contextAction ? (
                <button
                  type="button"
                  onClick={runContextAction}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
                >
                  {ContextActionIcon ? <ContextActionIcon className="h-4 w-4" aria-hidden="true" /> : null}
                  {contextAction.label}
                </button>
              ) : null}
            </div>
          </div>

          <aside className="grid gap-5">
            <InfoPanel title="Resumo">
              <div className="grid gap-3 text-sm text-slate-600">
                <p>
                  <strong className="text-slate-900">Entrada:</strong>{' '}
                  {formatDate(service.agendamento.criadoEm.slice(0, 10))}
                </p>
                <p>
                  <strong className="text-slate-900">Atendimento:</strong>{' '}
                  {formatDate(service.agendamento.data)} às {service.agendamento.horario}
                </p>
                <p>
                  <strong className="text-slate-900">Orçamento:</strong>{' '}
                  {formatCurrency(service.ordem.valorOrcamento)}
                </p>
                <StatusBadge status={service.ordem.status} />
              </div>
            </InfoPanel>

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold text-brand-900">Histórico de status</h3>
              <div className="mt-4 grid gap-3">
                {history.map((entry, index) => (
                  <div key={`${entry.status}-${entry.data}-${index}`} className="flex gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{statusLabels[entry.status]}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(entry.data))}
                      </p>
                      {entry.observacao ? (
                        <p className="mt-1 text-sm leading-6 text-slate-600">{entry.observacao}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

type InfoPanelProps = {
  title: string;
  children: ReactNode;
};

const InfoPanel = ({ title, children }: InfoPanelProps) => (
  <section className="rounded-lg border border-slate-200 p-4">
    <h3 className="font-bold text-brand-900">{title}</h3>
    <div className="mt-3">{children}</div>
  </section>
);

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
};

const TextField = ({ label, value, placeholder, type = 'text', onChange }: TextFieldProps) => (
  <label className="grid gap-2 text-sm font-semibold text-slate-700">
    {label}
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-12 rounded-lg border border-slate-300 px-4 text-slate-900 transition hover:border-brand-300"
    />
  </label>
);

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const TextAreaField = ({ label, value, onChange }: TextAreaFieldProps) => (
  <label className="grid gap-2 text-sm font-semibold text-slate-700">
    {label}
    <textarea
      rows={5}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900 transition hover:border-brand-300"
    />
  </label>
);

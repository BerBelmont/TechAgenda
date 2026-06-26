import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock,
  MonitorCog,
  UserRound,
  XCircle
} from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { statusLabels, statusSteps } from '../../data/status';
import { getLoggedClient } from '../../services/auth';
import {
  aprovarOrcamento,
  buscarServicoPorId,
  cancelarAgendamento,
  recusarOrcamento
} from '../../services/storage';
import type { ServicoDetalhado } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

const getNotification = (service: ServicoDetalhado) => {
  if (service.ordem.status === 'Em avaliação') return 'Seu equipamento está em avaliação.';
  if (service.ordem.status === 'Aguardando aprovação') return 'Seu orçamento está disponível.';
  if (service.ordem.status === 'Pronto para retirada') return 'Seu equipamento está pronto para retirada.';
  return null;
};

export const ServiceDetailPage = () => {
  const { serviceId } = useParams();
  const loggedClient = getLoggedClient();
  const [service, setService] = useState<ServicoDetalhado | undefined>(
    serviceId
      ? (() => {
          const found = buscarServicoPorId(serviceId);
          return !loggedClient || found?.cliente.id === loggedClient.id ? found : undefined;
        })()
      : undefined
  );
  const [message, setMessage] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const currentIndex = service ? statusSteps.indexOf(service.ordem.status) : -1;
  const canReviewBudget = service?.ordem.status === 'Aguardando aprovação' && Boolean(service.ordem.valorOrcamento);
  const canCancel = service?.ordem.status === 'Agendado';
  const notification = service ? getNotification(service) : null;

  const updateService = (updated: ServicoDetalhado | undefined, successMessage: string) => {
    setService(updated);
    setMessage(successMessage);
    setShowCancelConfirm(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Protocolo"
        title={service ? service.ordem.protocolo : 'Serviço não selecionado'}
        description={service ? `${service.equipamento.tipo} ${service.equipamento.marca}` : 'Escolha um atendimento para visualizar os detalhes.'}
        action={
          <Link
            to="/cliente/meus-servicos"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            Meus serviços
          </Link>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!service ? (
          <EmptyState
            icon={CalendarPlus}
            title="Nenhum protocolo aberto"
            description="Use a lista de serviços ou crie um novo agendamento para acompanhar os detalhes."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-6">
              {notification ? (
                <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-900">
                  {notification}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  {message}
                </div>
              ) : null}

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Protocolo</p>
                    <h2 className="mt-1 text-3xl font-bold text-brand-900">{service.ordem.protocolo}</h2>
                    <p className="mt-2 text-sm text-slate-600">{service.equipamento.descricaoProblema}</p>
                  </div>
                  <div className="rounded-lg bg-brand-900 p-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-100">Status atual</p>
                    <p className="mt-1 text-lg font-bold">{statusLabels[service.ordem.status]}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <InfoTile
                    icon={MonitorCog}
                    label="Equipamento"
                    value={`${service.equipamento.tipo} ${service.equipamento.marca}`}
                    detail={service.equipamento.modelo}
                  />
                  <InfoTile
                    icon={CalendarDays}
                    label="Data"
                    value={formatDate(service.agendamento.data)}
                    detail="Data do atendimento"
                  />
                  <InfoTile icon={Clock} label="Horário" value={service.agendamento.horario} detail="Horário escolhido" />
                </div>

                <div className="mt-6 rounded-lg border border-slate-200 p-4">
                  <h3 className="text-lg font-bold text-brand-900">Informações do equipamento</h3>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p>
                      <strong className="text-slate-900">Tipo:</strong> {service.equipamento.tipo}
                    </p>
                    <p>
                      <strong className="text-slate-900">Marca:</strong> {service.equipamento.marca}
                    </p>
                    <p>
                      <strong className="text-slate-900">Modelo:</strong> {service.equipamento.modelo}
                    </p>
                    <p>
                      <strong className="text-slate-900">Urgência:</strong> {service.agendamento.urgencia ?? 'Normal'}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    <strong className="text-slate-900">Descrição do problema:</strong>{' '}
                    {service.equipamento.descricaoProblema}
                  </p>
                </div>

                {canReviewBudget ? (
                  <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-wide text-amber-700">Orçamento disponível</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {formatCurrency(service.ordem.valorOrcamento)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      Aprove para iniciar o reparo ou recuse para cancelar o atendimento.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          updateService(aprovarOrcamento(service.id), 'Orçamento aprovado. O serviço mudou para Em reparo.')
                        }
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                      >
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        Aprovar orçamento
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateService(recusarOrcamento(service.id), 'Orçamento recusado. O serviço foi cancelado.')
                        }
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800"
                      >
                        <XCircle className="h-5 w-5" aria-hidden="true" />
                        Recusar orçamento
                      </button>
                    </div>
                  </div>
                ) : null}

                {canCancel ? (
                  <div className="mt-6 rounded-lg border border-slate-200 p-5">
                    {!showCancelConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                      >
                        <Ban className="h-5 w-5" aria-hidden="true" />
                        Cancelar agendamento
                      </button>
                    ) : (
                      <div className="rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
                        <div className="flex gap-3">
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                          <div>
                            <h3 className="font-bold text-red-800">Confirmar cancelamento?</h3>
                            <p className="mt-1 text-sm leading-6 text-red-700">
                              O agendamento será marcado como Cancelado e continuará salvo no histórico.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              updateService(cancelarAgendamento(service.id), 'Agendamento cancelado com sucesso.')
                            }
                            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800"
                          >
                            Sim, cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(false)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-white"
                          >
                            Manter agendamento
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-brand-900">Linha do tempo do serviço</h3>
                  <div className="mt-5 grid gap-3">
                    {statusSteps.map((step, index) => {
                      const isDone = currentIndex >= 0 && index <= currentIndex;
                      const isCurrent = service.ordem.status === step;
                      return (
                        <div
                          key={step}
                          className={`flex items-center gap-3 rounded-lg border p-4 ${
                            isDone ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                              isDone ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="font-semibold text-slate-800">{statusLabels[step]}</span>
                          {isCurrent ? <StatusBadge status={step} /> : null}
                        </div>
                      );
                    })}
                    {service.ordem.status === 'Cancelado' ? (
                      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-sm font-bold text-white">
                          !
                        </span>
                        <span className="font-semibold text-red-800">Cancelado</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-bold text-brand-900">{service.cliente.nome}</h2>
                  <p className="text-sm text-slate-500">{service.cliente.email}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <DetailBox label="Diagnóstico técnico" value={service.ordem.diagnostico ?? 'Ainda não informado.'} />
                <DetailBox label="Valor do orçamento" value={formatCurrency(service.ordem.valorOrcamento)} />
                <DetailBox label="Prazo estimado" value={service.ordem.prazoEstimado ?? 'A definir.'} />
                <DetailBox label="Observações da assistência" value={service.ordem.observacoes ?? 'Sem observações.'} />
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  );
};

type InfoTileProps = {
  icon: typeof MonitorCog;
  label: string;
  value: string;
  detail: string;
};

const InfoTile = ({ icon: Icon, label, value, detail }: InfoTileProps) => (
  <div className="rounded-lg bg-slate-50 p-4">
    <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
    <p className="mt-2 text-sm font-semibold text-slate-500">{label}</p>
    <p className="font-bold text-slate-900">{value}</p>
    <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
  </div>
);

type DetailBoxProps = {
  label: string;
  value: string;
};

const DetailBox = ({ label, value }: DetailBoxProps) => (
  <div className="rounded-lg bg-slate-50 p-4">
    <p className="text-sm font-bold text-brand-900">{label}</p>
    <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
  </div>
);

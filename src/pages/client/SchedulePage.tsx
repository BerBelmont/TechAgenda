import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  UserRound,
  Wrench
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { getLoggedClient } from '../../services/auth';
import { criarAgendamento, gerarProtocoloAgendamento, listarAgendaPorData } from '../../services/storage';
import type { AgendamentoFormData, PreferenciaContato, TipoEquipamento, UrgenciaAgendamento } from '../../types';
import { formatDate } from '../../utils/format';

type StepId = 1 | 2 | 3 | 4;
type FormErrors = Partial<Record<keyof AgendamentoFormData | 'agenda', string>>;

const equipmentOptions: TipoEquipamento[] = [
  'Celular',
  'Notebook',
  'Computador',
  'Televisão',
  'Impressora',
  'Tablet',
  'Outro'
];

const urgencyOptions: UrgenciaAgendamento[] = ['Normal', 'Prioridade', 'Urgente'];
const contactOptions: PreferenciaContato[] = ['WhatsApp', 'Ligação', 'E-mail'];
const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

const steps: Array<{ id: StepId; label: string; icon: typeof Wrench }> = [
  { id: 1, label: 'Equipamento', icon: Wrench },
  { id: 2, label: 'Data e horário', icon: CalendarCheck },
  { id: 3, label: 'Cliente', icon: UserRound },
  { id: 4, label: 'Confirmação', icon: ClipboardCheck }
];

const initialForm: AgendamentoFormData = {
  nome: '',
  telefone: '',
  email: '',
  preferenciaContato: 'WhatsApp',
  tipo: 'Celular',
  marca: '',
  modelo: '',
  descricaoProblema: '',
  urgencia: 'Normal',
  data: '',
  horario: ''
};

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextBusinessDays = (quantity: number) => {
  const dates: string[] = [];
  const cursor = new Date();

  while (dates.length < quantity) {
    const dayOfWeek = cursor.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(toDateValue(cursor));
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const getFieldClass = (hasError?: boolean) =>
  [
    'min-h-12 rounded-lg border px-4 text-slate-900 transition hover:border-brand-300',
    hasError ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
  ].join(' ');

export const SchedulePage = () => {
  const loggedClient = getLoggedClient();
  const initialClientForm = useMemo(
    () => ({
      ...initialForm,
      nome: loggedClient?.nome ?? '',
      telefone: loggedClient?.telefone ?? '',
      email: loggedClient?.email ?? '',
      preferenciaContato: loggedClient?.preferenciaContato ?? initialForm.preferenciaContato
    }),
    [loggedClient?.email, loggedClient?.nome, loggedClient?.preferenciaContato, loggedClient?.telefone]
  );
  const [step, setStep] = useState<StepId>(1);
  const [form, setForm] = useState<AgendamentoFormData>(initialClientForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);
  const [createdProtocol, setCreatedProtocol] = useState('');
  const businessDays = useMemo(() => getNextBusinessDays(7), []);

  const occupiedTimes = useMemo(() => {
    if (!form.data) return [];

    return listarAgendaPorData(form.data)
      .filter((service) => service.ordem.status !== 'Cancelado')
      .map((service) => service.agendamento.horario);
  }, [form.data]);

  const selectedDateLabel = form.data ? formatDate(form.data) : 'Nenhuma data escolhida';
  const selectedTimeLabel = form.horario || 'Nenhum horário escolhido';

  const updateField = (field: keyof AgendamentoFormData, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'data') next.horario = '';
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined, agenda: undefined }));
  };

  const requireText = (value: string, message: string) => (value.trim() ? undefined : message);

  const validateStep = (targetStep: StepId) => {
    const nextErrors: FormErrors = {};

    if (targetStep === 1) {
      nextErrors.marca = requireText(form.marca, 'Informe a marca do equipamento.');
      nextErrors.modelo = requireText(form.modelo, 'Informe o modelo do equipamento.');
      nextErrors.descricaoProblema = requireText(
        form.descricaoProblema,
        'Descreva o problema para a assistência entender o caso.'
      );
    }

    if (targetStep === 2) {
      nextErrors.data = form.data ? undefined : 'Escolha uma data no calendário.';
      nextErrors.horario = form.horario ? undefined : 'Escolha um horário disponível.';
    }

    if (targetStep === 3) {
      nextErrors.nome = requireText(form.nome, 'Informe o nome completo.');
      nextErrors.telefone = requireText(form.telefone, 'Informe um telefone para contato.');
      nextErrors.email = requireText(form.email, 'Informe um e-mail.');

      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nextErrors.email = 'Digite um e-mail válido, como nome@email.com.';
      }
    }

    const cleanErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value))
    ) as FormErrors;
    setErrors(cleanErrors);

    return Object.keys(cleanErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;

    if (step === 3 && !form.protocolo) {
      setForm((current) => ({ ...current, protocolo: gerarProtocoloAgendamento() }));
    }

    setStep((current) => Math.min(current + 1, 4) as StepId);
  };

  const goBack = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1) as StepId);
  };

  const confirmSchedule = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    const protocolo = form.protocolo ?? gerarProtocoloAgendamento();
    setIsLoading(true);

    window.setTimeout(() => {
      const service = criarAgendamento({ ...form, protocolo });
      setCreatedProtocol(service.ordem.protocolo);
      setCreatedServiceId(service.id);
      setIsLoading(false);
      setForm(initialClientForm);
    }, 800);
  };

  if (createdServiceId) {
    return (
      <>
        <PageHeader
          eyebrow="Agendamento"
          title="Atendimento agendado"
          description="Seu pedido foi salvo e já aparece em Meus serviços."
        />

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-brand-900">Agendamento confirmado</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Guarde este protocolo: <strong className="text-brand-900">{createdProtocol}</strong>
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/cliente/meus-servicos"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-800 px-6 py-3 text-base font-bold text-white transition hover:bg-brand-900"
              >
                Ir para Meus serviços
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCreatedServiceId(null);
                  setCreatedProtocol('');
                  setStep(1);
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-base font-bold text-brand-900 transition hover:bg-brand-50"
              >
                Fazer novo agendamento
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Agendamento"
        title="Agende seu atendimento"
        description="Siga as etapas com calma. Você verá um resumo antes de confirmar."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-4">
            {steps.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === step;
              const isDone = item.id < step;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    isActive || isDone ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isActive || isDone ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Etapa {item.id}
                    </span>
                    <span className="block text-sm font-bold text-brand-900">{item.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form noValidate className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {step === 1 ? (
              <div>
                <h2 className="text-2xl font-bold text-brand-900">Dados do equipamento</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Conte o básico sobre o aparelho. Se não souber a marca ou modelo, escreva “não sei”.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Tipo de equipamento
                    <select
                      value={form.tipo}
                      onChange={(event) => updateField('tipo', event.target.value)}
                      className={getFieldClass()}
                    >
                      {equipmentOptions.map((equipment) => (
                        <option key={equipment} value={equipment}>
                          {equipment}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Urgência
                    <select
                      value={form.urgencia}
                      onChange={(event) => updateField('urgencia', event.target.value)}
                      className={getFieldClass()}
                    >
                      {urgencyOptions.map((urgency) => (
                        <option key={urgency} value={urgency}>
                          {urgency}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Marca
                    <input
                      value={form.marca}
                      onChange={(event) => updateField('marca', event.target.value)}
                      className={getFieldClass(Boolean(errors.marca))}
                      placeholder="Samsung, Dell, LG..."
                    />
                    {errors.marca ? <span className="text-sm font-semibold text-red-700">{errors.marca}</span> : null}
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Modelo
                    <input
                      value={form.modelo}
                      onChange={(event) => updateField('modelo', event.target.value)}
                      className={getFieldClass(Boolean(errors.modelo))}
                      placeholder="Modelo do aparelho"
                    />
                    {errors.modelo ? <span className="text-sm font-semibold text-red-700">{errors.modelo}</span> : null}
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                    Descrição do problema
                    <textarea
                      rows={5}
                      value={form.descricaoProblema}
                      onChange={(event) => updateField('descricaoProblema', event.target.value)}
                      className={[
                        'rounded-lg border px-4 py-3 text-slate-900 transition hover:border-brand-300',
                        errors.descricaoProblema ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                      ].join(' ')}
                      placeholder="Exemplo: a tela apagou, o aparelho não liga, está lento..."
                    />
                    {errors.descricaoProblema ? (
                      <span className="text-sm font-semibold text-red-700">{errors.descricaoProblema}</span>
                    ) : null}
                  </label>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <h2 className="text-2xl font-bold text-brand-900">Escolha data e horário</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Selecione um dos próximos 7 dias úteis e depois um horário livre.
                </p>

                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Calendário</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {businessDays.map((date) => {
                      const isSelected = form.data === date;
                      const day = new Date(`${date}T12:00:00`);

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => updateField('data', date)}
                          className={`rounded-lg border p-4 text-left transition ${
                            isSelected
                              ? 'border-brand-800 bg-brand-800 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          <span className="block text-sm font-bold">
                            {day.toLocaleDateString('pt-BR', { weekday: 'long' })}
                          </span>
                          <span className="mt-1 block text-lg font-bold">{formatDate(date)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.data ? <p className="mt-3 text-sm font-semibold text-red-700">{errors.data}</p> : null}
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Horários disponíveis</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {availableTimes.map((time) => {
                      const isBusy = occupiedTimes.includes(time);
                      const isSelected = form.horario === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={!form.data || isBusy}
                          onClick={() => updateField('horario', time)}
                          className={`min-h-12 rounded-lg border px-4 py-3 text-base font-bold transition disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-brand-800 bg-brand-800 text-white'
                              : isBusy
                                ? 'border-slate-200 bg-slate-100 text-slate-400'
                                : 'border-slate-300 bg-white text-brand-900 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {time}
                          {isBusy ? <span className="block text-xs font-semibold">ocupado</span> : null}
                        </button>
                      );
                    })}
                  </div>
                  {!form.data ? (
                    <p className="mt-3 text-sm font-semibold text-slate-600">Escolha uma data para ver os horários.</p>
                  ) : null}
                  {errors.horario ? <p className="mt-3 text-sm font-semibold text-red-700">{errors.horario}</p> : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <h2 className="text-2xl font-bold text-brand-900">Dados do cliente</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Informe como a TechFix pode falar com você sobre o atendimento.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                    Nome completo
                    <input
                      value={form.nome}
                      onChange={(event) => updateField('nome', event.target.value)}
                      className={getFieldClass(Boolean(errors.nome))}
                      placeholder="Seu nome"
                    />
                    {errors.nome ? <span className="text-sm font-semibold text-red-700">{errors.nome}</span> : null}
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Telefone
                    <input
                      value={form.telefone}
                      onChange={(event) => updateField('telefone', event.target.value)}
                      className={getFieldClass(Boolean(errors.telefone))}
                      placeholder="(00) 00000-0000"
                    />
                    {errors.telefone ? <span className="text-sm font-semibold text-red-700">{errors.telefone}</span> : null}
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    E-mail
                    <input
                      value={form.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      className={getFieldClass(Boolean(errors.email))}
                      placeholder="voce@email.com"
                    />
                    {errors.email ? <span className="text-sm font-semibold text-red-700">{errors.email}</span> : null}
                  </label>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-700">Preferência de contato</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {contactOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField('preferenciaContato', option)}
                        className={`min-h-12 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                          form.preferenciaContato === option
                            ? 'border-brand-800 bg-brand-800 text-white'
                            : 'border-slate-300 bg-white text-brand-900 hover:border-brand-300 hover:bg-brand-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <h2 className="text-2xl font-bold text-brand-900">Confirme os dados</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Confira tudo antes de enviar. O protocolo será salvo junto com o agendamento.
                </p>

                <div className="mt-6 rounded-lg bg-brand-50 p-4 ring-1 ring-brand-200">
                  <p className="text-sm font-semibold text-brand-700">Protocolo</p>
                  <p className="mt-1 text-2xl font-bold text-brand-900">{form.protocolo}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <SummaryItem label="Equipamento" value={`${form.tipo} ${form.marca} ${form.modelo}`} />
                  <SummaryItem label="Urgência" value={form.urgencia} />
                  <SummaryItem label="Problema" value={form.descricaoProblema} wide />
                  <SummaryItem label="Data" value={selectedDateLabel} />
                  <SummaryItem label="Horário" value={selectedTimeLabel} />
                  <SummaryItem label="Cliente" value={form.nome} />
                  <SummaryItem label="Contato" value={`${form.telefone} · ${form.email}`} />
                  <SummaryItem label="Preferência" value={form.preferenciaContato} />
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || isLoading}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-base font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                Voltar
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-800 px-6 py-3 text-base font-bold text-white transition hover:bg-brand-900"
                >
                  Continuar
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmSchedule}
                  disabled={isLoading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-800 px-6 py-3 text-base font-bold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                  {isLoading ? 'Confirmando...' : 'Confirmar agendamento'}
                </button>
              )}
            </div>
          </form>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-brand-900">Sua escolha</h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
              <p>
                <strong className="text-slate-900">Data:</strong> {selectedDateLabel}
              </p>
              <p>
                <strong className="text-slate-900">Horário:</strong> {selectedTimeLabel}
              </p>
              <p>
                <strong className="text-slate-900">Equipamento:</strong> {form.tipo}
              </p>
              <p>
                <strong className="text-slate-900">Urgência:</strong> {form.urgencia}
              </p>
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Horários marcados como ocupado já estão em uso e não podem ser escolhidos.
            </div>
          </aside>
        </div>
      </section>
    </>
  );
};

type SummaryItemProps = {
  label: string;
  value: string;
  wide?: boolean;
};

const SummaryItem = ({ label, value, wide = false }: SummaryItemProps) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 ${wide ? 'md:col-span-2' : ''}`}>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-1 break-words font-bold text-slate-900">{value || 'Não informado'}</p>
  </div>
);

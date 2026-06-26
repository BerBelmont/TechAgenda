import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  UserRound,
  Wrench,
  X
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { statusLabels } from '../../data/status';
import { criarAgendamento, listarServicos } from '../../services/storage';
import type { AgendamentoFormData, ServicoDetalhado, StatusServico, TipoEquipamento } from '../../types';
import { formatDate } from '../../utils/format';

type FormErrors = Partial<Record<keyof AgendamentoFormData | 'conflict', string>>;

const workHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
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

const statusBlockTone: Record<StatusServico, string> = {
  Agendado: 'border-sky-200 bg-sky-50 text-sky-800',
  'Equipamento recebido': 'border-indigo-200 bg-indigo-50 text-indigo-800',
  'Em avaliação': 'border-blue-200 bg-blue-50 text-blue-800',
  'Aguardando aprovação': 'border-amber-200 bg-amber-50 text-amber-800',
  'Em reparo': 'border-blue-200 bg-blue-50 text-blue-800',
  'Pronto para retirada': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Finalizado: 'border-slate-200 bg-slate-100 text-slate-700',
  Cancelado: 'border-red-200 bg-red-50 text-red-800'
};

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

const parseDate = (value: string) => new Date(`${value}T12:00:00`);

const startOfWeek = (date: Date) => {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + offset);
  return monday;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
};

const getWeekDays = (weekStart: string) => {
  const start = parseDate(weekStart);
  return Array.from({ length: 6 }, (_, index) => toDateValue(addDays(start, index)));
};

const getHourBucket = (time: string) => `${time.slice(0, 2)}:00`;

export const ProviderAgendaPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const services = listarServicos();
  const firstServiceDate = services
    .map((service) => service.agendamento.data)
    .sort((a, b) => a.localeCompare(b))[0];
  const initialWeek = toDateValue(startOfWeek(firstServiceDate ? parseDate(firstServiceDate) : new Date()));

  const [weekStart, setWeekStart] = useState(initialWeek);
  const [equipmentFilter, setEquipmentFilter] = useState<TipoEquipamento | 'Todos'>('Todos');
  const [statusFilter, setStatusFilter] = useState<StatusServico | 'Todos'>('Todos');
  const [selectedService, setSelectedService] = useState<ServicoDetalhado | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<AgendamentoFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const filteredServices = useMemo(
    () =>
      services.filter((service) => {
        const inWeek = weekDays.includes(service.agendamento.data);
        const matchesEquipment =
          equipmentFilter === 'Todos' || service.equipamento.tipo === equipmentFilter;
        const matchesStatus = statusFilter === 'Todos' || service.ordem.status === statusFilter;
        return inWeek && matchesEquipment && matchesStatus;
      }),
    [equipmentFilter, services, statusFilter, weekDays]
  );

  const servicesBySlot = (date: string, hour: string) =>
    filteredServices
      .filter((service) => service.agendamento.data === date && getHourBucket(service.agendamento.horario) === hour)
      .sort((a, b) => a.agendamento.horario.localeCompare(b.agendamento.horario));

  const hasConflict = (date: string, time: string) =>
    services.some(
      (service) =>
        service.agendamento.data === date &&
        service.agendamento.horario === time &&
        service.ordem.status !== 'Cancelado'
    );

  const updateField = (field: keyof AgendamentoFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, conflict: undefined }));
    setSuccessMessage('');
  };

  const validateManualForm = () => {
    const nextErrors: FormErrors = {};
    if (!form.nome.trim()) nextErrors.nome = 'Informe o nome do cliente.';
    if (!form.telefone.trim()) nextErrors.telefone = 'Informe o telefone.';
    if (!form.email.trim()) nextErrors.email = 'Informe o e-mail.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Digite um e-mail válido.';
    }
    if (!form.marca.trim()) nextErrors.marca = 'Informe a marca.';
    if (!form.modelo.trim()) nextErrors.modelo = 'Informe o modelo.';
    if (!form.descricaoProblema.trim()) nextErrors.descricaoProblema = 'Informe o problema relatado.';
    if (!form.data) nextErrors.data = 'Escolha a data.';
    if (!form.horario) nextErrors.horario = 'Escolha o horário.';
    if (form.data && form.horario && hasConflict(form.data, form.horario)) {
      nextErrors.conflict = 'Já existe um agendamento neste dia e horário.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitManualSchedule = () => {
    if (!validateManualForm()) return;

    const created = criarAgendamento(form);
    setForm(initialForm);
    setErrors({});
    setShowNewForm(false);
    setSelectedService(created);
    setSuccessMessage('Agendamento manual cadastrado com sucesso.');
    setRefreshKey((current) => current + 1);
  };

  const previousWeek = () => setWeekStart(toDateValue(addDays(parseDate(weekStart), -7)));
  const nextWeek = () => setWeekStart(toDateValue(addDays(parseDate(weekStart), 7)));

  return (
    <>
      <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Prestador</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-900 sm:text-4xl">Agenda semanal</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Visualize os horários da assistência e cadastre atendimentos manuais sem conflito de agenda.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowNewForm(true);
              setSelectedService(null);
              setSuccessMessage('');
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo agendamento
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" key={refreshKey}>
        {successMessage ? (
          <div className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-end">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={previousWeek}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Semana anterior
              </button>
              <button
                type="button"
                onClick={nextWeek}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
              >
                Próxima
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="text-sm font-bold text-slate-700 lg:text-center">
              {formatDate(weekDays[0])} até {formatDate(weekDays[5])}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Tipo
                <select
                  value={equipmentFilter}
                  onChange={(event) => setEquipmentFilter(event.target.value as TipoEquipamento | 'Todos')}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 transition hover:border-brand-300"
                >
                  {equipmentOptions.map((equipment) => (
                    <option key={equipment} value={equipment}>
                      {equipment}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusServico | 'Todos')}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 transition hover:border-brand-300"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === 'Todos' ? 'Todos' : statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="hidden min-w-[980px] grid-cols-[82px_repeat(6,minmax(130px,1fr))] border-b border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 lg:grid">
              <div className="border-r border-slate-200 px-3 py-3">Hora</div>
              {weekDays.map((day) => (
                <div key={day} className="border-r border-slate-200 px-3 py-3 last:border-r-0">
                  <span className="block capitalize">
                    {parseDate(day).toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">{formatDate(day)}</span>
                </div>
              ))}
            </div>

            <div className="hidden min-w-[980px] lg:block">
              {workHours.map((hour) => (
                <div key={hour} className="grid grid-cols-[82px_repeat(6,minmax(130px,1fr))] border-b border-slate-100 last:border-b-0">
                  <div className="border-r border-slate-200 bg-slate-50 px-3 py-4 text-sm font-bold text-slate-600">
                    {hour}
                  </div>
                  {weekDays.map((day) => {
                    const slotServices = servicesBySlot(day, hour);
                    return (
                      <div key={`${day}-${hour}`} className="min-h-24 border-r border-slate-100 p-2 last:border-r-0">
                        <div className="grid gap-2">
                          {slotServices.map((service) => (
                            <AgendaBlock
                              key={service.id}
                              service={service}
                              onClick={() => {
                                setSelectedService(service);
                                setShowNewForm(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {weekDays.map((day) => {
                const dayServices = filteredServices
                  .filter((service) => service.agendamento.data === day)
                  .sort((a, b) => a.agendamento.horario.localeCompare(b.agendamento.horario));

                return (
                  <div key={day} className="rounded-lg border border-slate-200 p-3">
                    <h2 className="font-bold capitalize text-brand-900">
                      {parseDate(day).toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </h2>
                    <p className="text-sm text-slate-500">{formatDate(day)}</p>
                    <div className="mt-3 grid gap-2">
                      {dayServices.length ? (
                        dayServices.map((service) => (
                          <AgendaBlock
                            key={service.id}
                            service={service}
                            onClick={() => {
                              setSelectedService(service);
                              setShowNewForm(false);
                            }}
                          />
                        ))
                      ) : (
                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                          Sem agendamentos.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:self-start">
            {showNewForm ? (
              <ManualScheduleForm
                form={form}
                errors={errors}
                onChange={updateField}
                onCancel={() => {
                  setShowNewForm(false);
                  setErrors({});
                }}
                onSubmit={submitManualSchedule}
              />
            ) : selectedService ? (
              <AppointmentDetails service={selectedService} onClose={() => setSelectedService(null)} />
            ) : (
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <CalendarDays className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-brand-900">Detalhes do agendamento</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Clique em um bloco da agenda para ver cliente, equipamento e ordem de serviço.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
};

type AgendaBlockProps = {
  service: ServicoDetalhado;
  onClick: () => void;
};

const AgendaBlock = ({ service, onClick }: AgendaBlockProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg border p-2 text-left text-xs transition hover:shadow-sm ${statusBlockTone[service.ordem.status]}`}
  >
    <span className="block font-bold">{service.agendamento.horario}</span>
    <span className="mt-1 block truncate font-semibold">{service.cliente.nome}</span>
    <span className="mt-1 block truncate">
      {service.equipamento.tipo} {service.equipamento.marca}
    </span>
  </button>
);

type AppointmentDetailsProps = {
  service: ServicoDetalhado;
  onClose: () => void;
};

const AppointmentDetails = ({ service, onClose }: AppointmentDetailsProps) => (
  <div>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-brand-600">{service.ordem.protocolo}</p>
        <h2 className="mt-1 text-xl font-bold text-brand-900">Detalhes do agendamento</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100"
        aria-label="Fechar detalhes"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <div className="mt-5 grid gap-4">
      <DetailLine icon={UserRound} label="Cliente" value={service.cliente.nome} detail={service.cliente.telefone} />
      <DetailLine
        icon={Wrench}
        label="Equipamento"
        value={`${service.equipamento.tipo} ${service.equipamento.marca}`}
        detail={service.equipamento.modelo}
      />
      <DetailLine
        icon={Clock}
        label="Data e horário"
        value={`${formatDate(service.agendamento.data)} às ${service.agendamento.horario}`}
        detail={`Urgência: ${service.agendamento.urgencia ?? 'Normal'}`}
      />

      <div className="rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-bold text-brand-900">Problema relatado</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{service.equipamento.descricaoProblema}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-brand-900">Status</p>
        <StatusBadge status={service.ordem.status} />
      </div>

      <Link
        to={`/cliente/servico/${service.id}`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
      >
        Abrir ordem de serviço
      </Link>
    </div>
  </div>
);

type DetailLineProps = {
  icon: typeof UserRound;
  label: string;
  value: string;
  detail?: string;
};

const DetailLine = ({ icon: Icon, label, value, detail }: DetailLineProps) => (
  <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
    <div>
      <p className="text-sm font-bold text-brand-900">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}
    </div>
  </div>
);

type ManualScheduleFormProps = {
  form: AgendamentoFormData;
  errors: FormErrors;
  onChange: (field: keyof AgendamentoFormData, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const ManualScheduleForm = ({ form, errors, onChange, onCancel, onSubmit }: ManualScheduleFormProps) => (
  <div>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Atendente</p>
        <h2 className="mt-1 text-xl font-bold text-brand-900">Novo agendamento</h2>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100"
        aria-label="Fechar formulário"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <div className="mt-5 grid gap-4">
      <Field label="Nome do cliente" value={form.nome} error={errors.nome} onChange={(value) => onChange('nome', value)} />
      <Field label="Telefone" value={form.telefone} error={errors.telefone} onChange={(value) => onChange('telefone', value)} />
      <Field label="E-mail" value={form.email} error={errors.email} onChange={(value) => onChange('email', value)} />

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Tipo de equipamento
        <select
          value={form.tipo}
          onChange={(event) => onChange('tipo', event.target.value)}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 transition hover:border-brand-300"
        >
          {equipmentOptions
            .filter((equipment) => equipment !== 'Todos')
            .map((equipment) => (
              <option key={equipment} value={equipment}>
                {equipment}
              </option>
            ))}
        </select>
      </label>

      <Field label="Marca" value={form.marca} error={errors.marca} onChange={(value) => onChange('marca', value)} />
      <Field label="Modelo" value={form.modelo} error={errors.modelo} onChange={(value) => onChange('modelo', value)} />

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Problema relatado
        <textarea
          rows={3}
          value={form.descricaoProblema}
          onChange={(event) => onChange('descricaoProblema', event.target.value)}
          className={`rounded-lg border px-3 py-2 text-slate-900 transition hover:border-brand-300 ${
            errors.descricaoProblema ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
          }`}
        />
        {errors.descricaoProblema ? <span className="text-sm font-semibold text-red-700">{errors.descricaoProblema}</span> : null}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Data
          <input
            type="date"
            value={form.data}
            onChange={(event) => onChange('data', event.target.value)}
            className={`min-h-11 rounded-lg border px-3 text-slate-900 transition hover:border-brand-300 ${
              errors.data ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.data ? <span className="text-sm font-semibold text-red-700">{errors.data}</span> : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Horário
          <input
            type="time"
            min="09:00"
            max="18:00"
            value={form.horario}
            onChange={(event) => onChange('horario', event.target.value)}
            className={`min-h-11 rounded-lg border px-3 text-slate-900 transition hover:border-brand-300 ${
              errors.horario ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.horario ? <span className="text-sm font-semibold text-red-700">{errors.horario}</span> : null}
        </label>
      </div>

      {errors.conflict ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200">
          {errors.conflict}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
      >
        Salvar agendamento
      </button>
    </div>
  </div>
);

type FieldProps = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

const Field = ({ label, value, error, onChange }: FieldProps) => (
  <label className="grid gap-2 text-sm font-semibold text-slate-700">
    {label}
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`min-h-11 rounded-lg border px-3 text-slate-900 transition hover:border-brand-300 ${
        error ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
      }`}
    />
    {error ? <span className="text-sm font-semibold text-red-700">{error}</span> : null}
  </label>
);

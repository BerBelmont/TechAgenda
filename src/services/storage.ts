import { initialData } from '../data/seed';
import type {
  Agendamento,
  AgendamentoFormData,
  Cliente,
  Equipamento,
  HistoricoStatus,
  OrdemDeServico,
  ServicoDetalhado,
  StatusServico,
  StoredData
} from '../types';

const STORAGE_KEY = 'techagenda:data';

const cloneInitialData = (): StoredData => ({
  clientes: initialData.clientes.map((cliente) => ({ ...cliente })),
  equipamentos: initialData.equipamentos.map((equipamento) => ({ ...equipamento })),
  agendamentos: initialData.agendamentos.map((agendamento) => ({ ...agendamento })),
  ordensServico: initialData.ordensServico.map((ordem) => ({ ...ordem }))
});

const hasValidShape = (data: Partial<StoredData> | null): data is StoredData =>
  Boolean(
    data &&
      Array.isArray(data.clientes) &&
      Array.isArray(data.equipamentos) &&
      Array.isArray(data.agendamentos) &&
      Array.isArray(data.ordensServico)
  );

const safeParse = (value: string | null): StoredData | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredData>;
    return hasValidShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const createId = (prefix: string) => {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  return `${prefix}-${randomId}`;
};

export const getStoredData = (): StoredData => {
  const existing = safeParse(localStorage.getItem(STORAGE_KEY));
  if (existing) return existing;

  const seeded = cloneInitialData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

export const saveStoredData = (data: StoredData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const gerarProtocoloAgendamento = () => {
  const data = getStoredData();
  const year = new Date().getFullYear();
  const sameYearCount = data.ordensServico.filter((ordem) => ordem.protocolo.includes(`${year}`)).length;
  const nextNumber = String(sameYearCount + 1).padStart(3, '0');
  return `TF-${year}-${nextNumber}`;
};

export const resetarDadosDemonstracao = (): StoredData => {
  const seeded = cloneInitialData();
  saveStoredData(seeded);
  return seeded;
};

const criarEntradaHistorico = (status: StatusServico, observacao?: string): HistoricoStatus => ({
  status,
  data: new Date().toISOString(),
  observacao
});

const normalizarHistorico = (ordem: OrdemDeServico, agendamento?: Agendamento): HistoricoStatus[] =>
  ordem.historicoStatus?.length
    ? ordem.historicoStatus
    : [
        {
          status: ordem.status,
          data: ordem.atualizadoEm ?? agendamento?.criadoEm ?? new Date().toISOString(),
          observacao: ordem.observacoes
        }
      ];

const montarServico = (ordem: OrdemDeServico, data: StoredData): ServicoDetalhado | null => {
  const agendamento = data.agendamentos.find((item) => item.id === ordem.agendamentoId);
  if (!agendamento) return null;

  const cliente = data.clientes.find((item) => item.id === agendamento.clienteId);
  const equipamento = data.equipamentos.find((item) => item.id === agendamento.equipamentoId);
  if (!cliente || !equipamento) return null;

  return {
    id: ordem.id,
    cliente,
    equipamento,
    agendamento,
    ordem
  };
};

export const listarServicos = (): ServicoDetalhado[] => {
  const data = getStoredData();
  return data.ordensServico
    .map((ordem) => montarServico(ordem, data))
    .filter((servico): servico is ServicoDetalhado => Boolean(servico))
    .sort((a, b) => b.agendamento.criadoEm.localeCompare(a.agendamento.criadoEm));
};

export const buscarServicoPorId = (id: string): ServicoDetalhado | undefined =>
  listarServicos().find((servico) => servico.id === id || servico.ordem.protocolo === id);

export const listarClientes = (): Cliente[] =>
  getStoredData().clientes.sort((a, b) => a.nome.localeCompare(b.nome));

export const buscarClientePorId = (id: string): Cliente | undefined =>
  getStoredData().clientes.find((cliente) => cliente.id === id);

export type CadastroClienteData = {
  nome: string;
  telefone: string;
  email: string;
  preferenciaContato?: Cliente['preferenciaContato'];
};

export const cadastrarCliente = (form: CadastroClienteData): Cliente => {
  const data = getStoredData();
  const existingClient = data.clientes.find(
    (cliente) => cliente.email.toLowerCase() === form.email.toLowerCase()
  );

  if (existingClient) {
    const updatedClient: Cliente = {
      ...existingClient,
      nome: form.nome || existingClient.nome,
      telefone: form.telefone || existingClient.telefone,
      preferenciaContato: form.preferenciaContato ?? existingClient.preferenciaContato
    };

    saveStoredData({
      ...data,
      clientes: data.clientes.map((cliente) => (cliente.id === existingClient.id ? updatedClient : cliente))
    });

    return updatedClient;
  }

  const cliente: Cliente = {
    id: createId('cli'),
    nome: form.nome,
    telefone: form.telefone,
    email: form.email,
    preferenciaContato: form.preferenciaContato
  };

  saveStoredData({
    ...data,
    clientes: [cliente, ...data.clientes]
  });

  return cliente;
};

export type OrdemDeServicoUpdate = {
  status?: StatusServico;
  diagnostico?: string;
  valorOrcamento?: number;
  prazoEstimado?: string;
  observacoes?: string;
  historicoObservacao?: string;
};

export const atualizarOrdemDeServico = (
  servicoId: string,
  update: OrdemDeServicoUpdate
): ServicoDetalhado | undefined => {
  const data = getStoredData();
  const ordem = data.ordensServico.find((item) => item.id === servicoId || item.protocolo === servicoId);
  if (!ordem) return undefined;

  const agendamento = data.agendamentos.find((item) => item.id === ordem.agendamentoId);
  const nextStatus = update.status ?? ordem.status;
  const statusChanged = nextStatus !== ordem.status;
  const historicoStatus = statusChanged
    ? [...normalizarHistorico(ordem, agendamento), criarEntradaHistorico(nextStatus, update.historicoObservacao)]
    : normalizarHistorico(ordem, agendamento);

  const updatedOrder: OrdemDeServico = {
    ...ordem,
    status: nextStatus,
    diagnostico: update.diagnostico ?? ordem.diagnostico,
    valorOrcamento: update.valorOrcamento ?? ordem.valorOrcamento,
    prazoEstimado: update.prazoEstimado ?? ordem.prazoEstimado,
    observacoes: update.observacoes ?? ordem.observacoes,
    atualizadoEm: new Date().toISOString(),
    historicoStatus
  };

  const nextData: StoredData = {
    ...data,
    ordensServico: data.ordensServico.map((item) => (item.id === ordem.id ? updatedOrder : item)),
    agendamentos: data.agendamentos.map((item) =>
      item.id === ordem.agendamentoId ? { ...item, status: nextStatus } : item
    )
  };

  saveStoredData(nextData);
  return buscarServicoPorId(ordem.id);
};

export const criarAgendamento = (form: AgendamentoFormData): ServicoDetalhado => {
  const data = getStoredData();
  const existingClient = data.clientes.find(
    (cliente) => cliente.email.toLowerCase() === form.email.toLowerCase()
  );

  const cliente: Cliente =
    existingClient ??
    ({
      id: createId('cli'),
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      preferenciaContato: form.preferenciaContato
    } satisfies Cliente);

  const equipamento: Equipamento = {
    id: createId('eqp'),
    tipo: form.tipo,
    marca: form.marca,
    modelo: form.modelo,
    descricaoProblema: form.descricaoProblema
  };

  const agendamento: Agendamento = {
    id: createId('agd'),
    clienteId: cliente.id,
    equipamentoId: equipamento.id,
    data: form.data,
    horario: form.horario,
    urgencia: form.urgencia,
    status: 'Agendado',
    criadoEm: new Date().toISOString()
  };

  const ordem: OrdemDeServico = {
    id: createId('os'),
    agendamentoId: agendamento.id,
    protocolo: form.protocolo ?? gerarProtocoloAgendamento(),
    status: 'Agendado',
    observacoes: `Agendamento criado pelo cliente. Preferência de contato: ${form.preferenciaContato}. Urgência: ${form.urgencia}.`,
    atualizadoEm: new Date().toISOString(),
    historicoStatus: [criarEntradaHistorico('Agendado', 'Agendamento criado.')]
  };

  const nextData: StoredData = {
    clientes: existingClient ? data.clientes : [cliente, ...data.clientes],
    equipamentos: [equipamento, ...data.equipamentos],
    agendamentos: [agendamento, ...data.agendamentos],
    ordensServico: [ordem, ...data.ordensServico]
  };

  saveStoredData(nextData);

  return {
    id: ordem.id,
    cliente,
    equipamento,
    agendamento,
    ordem
  };
};

export const atualizarStatusServico = (
  servicoId: string,
  status: StatusServico,
  observacao?: string
): ServicoDetalhado | undefined =>
  atualizarOrdemDeServico(servicoId, { status, historicoObservacao: observacao });

export const aprovarOrcamento = (servicoId: string): ServicoDetalhado | undefined => {
  const service = buscarServicoPorId(servicoId);
  if (!service) return undefined;

  const observacoes = [service.ordem.observacoes, 'Orçamento aprovado pelo cliente.'].filter(Boolean).join(' ');

  return atualizarOrdemDeServico(servicoId, {
    status: 'Em reparo',
    observacoes,
    historicoObservacao: 'Orçamento aprovado pelo cliente.'
  });
};

export const recusarOrcamento = (servicoId: string): ServicoDetalhado | undefined => {
  const service = buscarServicoPorId(servicoId);
  if (!service) return undefined;

  const observacoes = [service.ordem.observacoes, 'Orçamento recusado pelo cliente. Atendimento cancelado.']
    .filter(Boolean)
    .join(' ');

  return atualizarOrdemDeServico(servicoId, {
    status: 'Cancelado',
    observacoes,
    historicoObservacao: 'Orçamento recusado pelo cliente.'
  });
};

export const cancelarAgendamento = (id: string): ServicoDetalhado | undefined => {
  const service = buscarServicoPorId(id) ?? listarServicos().find((item) => item.agendamento.id === id);
  if (!service) return undefined;

  const observacoes = [service.ordem.observacoes, 'Agendamento cancelado.'].filter(Boolean).join(' ');

  return atualizarOrdemDeServico(service.id, {
    status: 'Cancelado',
    observacoes,
    historicoObservacao: 'Agendamento cancelado.'
  });
};

export const listarAgendaPorData = (dataAgenda: string): ServicoDetalhado[] =>
  listarServicos()
    .filter((servico) => servico.agendamento.data === dataAgenda)
    .sort((a, b) => a.agendamento.horario.localeCompare(b.agendamento.horario));

export const getServices = listarServicos;
export const getServiceById = buscarServicoPorId;
export const getClients = listarClientes;
export const getClientById = buscarClientePorId;
export const createServiceOrder = criarAgendamento;

import type { LucideIcon } from 'lucide-react';

export type StatusServico =
  | 'Agendado'
  | 'Equipamento recebido'
  | 'Em avaliação'
  | 'Aguardando aprovação'
  | 'Em reparo'
  | 'Pronto para retirada'
  | 'Finalizado'
  | 'Cancelado';

export type TipoEquipamento =
  | 'Celular'
  | 'Notebook'
  | 'Computador'
  | 'Televisão'
  | 'Impressora'
  | 'Tablet'
  | 'Outro';

export type UrgenciaAgendamento = 'Normal' | 'Prioridade' | 'Urgente';

export type PreferenciaContato = 'WhatsApp' | 'Ligação' | 'E-mail';

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  preferenciaContato?: PreferenciaContato;
};

export type Equipamento = {
  id: string;
  tipo: TipoEquipamento;
  marca: string;
  modelo: string;
  descricaoProblema: string;
};

export type Agendamento = {
  id: string;
  clienteId: string;
  equipamentoId: string;
  data: string;
  horario: string;
  urgencia?: UrgenciaAgendamento;
  status: StatusServico;
  criadoEm: string;
};

export type OrdemDeServico = {
  id: string;
  agendamentoId: string;
  protocolo: string;
  status: StatusServico;
  diagnostico?: string;
  valorOrcamento?: number;
  prazoEstimado?: string;
  observacoes?: string;
  atualizadoEm?: string;
  historicoStatus?: HistoricoStatus[];
};

export type HistoricoStatus = {
  status: StatusServico;
  data: string;
  observacao?: string;
};

export type ServicoDetalhado = {
  id: string;
  cliente: Cliente;
  equipamento: Equipamento;
  agendamento: Agendamento;
  ordem: OrdemDeServico;
};

export type AgendamentoFormData = {
  nome: string;
  telefone: string;
  email: string;
  preferenciaContato: PreferenciaContato;
  tipo: TipoEquipamento;
  marca: string;
  modelo: string;
  descricaoProblema: string;
  urgencia: UrgenciaAgendamento;
  data: string;
  horario: string;
  protocolo?: string;
};

export type Benefit = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type EquipmentCard = {
  label: TipoEquipamento;
  description: string;
  icon: LucideIcon;
};

export type StoredData = {
  clientes: Cliente[];
  equipamentos: Equipamento[];
  agendamentos: Agendamento[];
  ordensServico: OrdemDeServico[];
};

export type Client = Cliente;
export type ServiceStatus = StatusServico;
export type EquipmentType = TipoEquipamento;
export type ServiceOrder = ServicoDetalhado;
export type ServiceFormData = AgendamentoFormData;

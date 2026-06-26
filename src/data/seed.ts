import {
  CalendarClock,
  ClipboardCheck,
  Computer,
  Laptop,
  Monitor,
  Printer,
  Smartphone,
  Tablet,
  WalletCards
} from 'lucide-react';
import type { Benefit, EquipmentCard, StoredData } from '../types';

export const benefits: Benefit[] = [
  {
    title: 'Agendamento rápido',
    description: 'Escolha o melhor horário e envie os detalhes do aparelho em poucos passos.',
    icon: CalendarClock
  },
  {
    title: 'Acompanhamento em tempo real',
    description: 'Veja cada etapa do atendimento, do diagnóstico até a retirada.',
    icon: ClipboardCheck
  },
  {
    title: 'Orçamento digital',
    description: 'Receba uma estimativa organizada antes de aprovar qualquer reparo.',
    icon: WalletCards
  }
];

export const equipmentCards: EquipmentCard[] = [
  {
    label: 'Celular',
    description: 'Tela, bateria, conector, câmera e software.',
    icon: Smartphone
  },
  {
    label: 'Notebook',
    description: 'Formatação, upgrades, teclado, tela e desempenho.',
    icon: Laptop
  },
  {
    label: 'Computador',
    description: 'Montagem, manutenção, limpeza e diagnóstico.',
    icon: Computer
  },
  {
    label: 'Televisão',
    description: 'Imagem, som, placa principal e conectividade.',
    icon: Monitor
  },
  {
    label: 'Impressora',
    description: 'Atolamentos, rede, cartuchos e revisão geral.',
    icon: Printer
  },
  {
    label: 'Tablet',
    description: 'Tela, bateria, sistema e acessórios.',
    icon: Tablet
  }
];

export const initialData: StoredData = {
  clientes: [
    {
      id: 'cli-001',
      nome: 'Marina Costa',
      telefone: '(11) 98888-1122',
      email: 'marina.costa@email.com',
      preferenciaContato: 'WhatsApp'
    },
    {
      id: 'cli-002',
      nome: 'Rafael Lima',
      telefone: '(21) 97777-3344',
      email: 'rafael.lima@email.com',
      preferenciaContato: 'E-mail'
    },
    {
      id: 'cli-003',
      nome: 'Camila Rocha',
      telefone: '(31) 96666-7788',
      email: 'camila.rocha@email.com',
      preferenciaContato: 'Ligação'
    },
    {
      id: 'cli-004',
      nome: 'João Pedro Alves',
      telefone: '(41) 95555-9900',
      email: 'joao.alves@email.com',
      preferenciaContato: 'WhatsApp'
    },
    {
      id: 'cli-005',
      nome: 'Patrícia Nunes',
      telefone: '(51) 94444-2211',
      email: 'patricia.nunes@email.com',
      preferenciaContato: 'E-mail'
    }
  ],
  equipamentos: [
    {
      id: 'eqp-001',
      tipo: 'Notebook',
      marca: 'Dell',
      modelo: 'Inspiron 15 3511',
      descricaoProblema: 'Liga normalmente, mas está lento e aquecendo muito.'
    },
    {
      id: 'eqp-002',
      tipo: 'Celular',
      marca: 'Samsung',
      modelo: 'Galaxy S22',
      descricaoProblema: 'Tela trincada e toque falhando no canto superior.'
    },
    {
      id: 'eqp-003',
      tipo: 'Televisão',
      marca: 'LG',
      modelo: '55UN731C',
      descricaoProblema: 'Imagem apaga depois de alguns minutos, som continua funcionando.'
    },
    {
      id: 'eqp-004',
      tipo: 'Impressora',
      marca: 'Epson',
      modelo: 'L3150',
      descricaoProblema: 'Não puxa papel e apresenta falhas na impressão colorida.'
    },
    {
      id: 'eqp-005',
      tipo: 'Computador',
      marca: 'PC Gamer',
      modelo: 'Ryzen 5 Custom',
      descricaoProblema: 'Reinicia sozinho durante jogos e edição de vídeo.'
    },
    {
      id: 'eqp-006',
      tipo: 'Celular',
      marca: 'Apple',
      modelo: 'iPhone 12',
      descricaoProblema: 'Bateria descarrega rápido e aparelho esquenta ao carregar.'
    },
    {
      id: 'eqp-007',
      tipo: 'Notebook',
      marca: 'Lenovo',
      modelo: 'IdeaPad 3',
      descricaoProblema: 'Teclado com teclas falhando após queda de líquido.'
    }
  ],
  agendamentos: [
    {
      id: 'agd-001',
      clienteId: 'cli-001',
      equipamentoId: 'eqp-001',
      data: '2026-06-29',
      horario: '09:00',
      urgencia: 'Prioridade',
      status: 'Em avaliação',
      criadoEm: '2026-06-23T14:30:00.000Z'
    },
    {
      id: 'agd-002',
      clienteId: 'cli-002',
      equipamentoId: 'eqp-002',
      data: '2026-06-29',
      horario: '11:30',
      urgencia: 'Urgente',
      status: 'Aguardando aprovação',
      criadoEm: '2026-06-24T09:10:00.000Z'
    },
    {
      id: 'agd-003',
      clienteId: 'cli-003',
      equipamentoId: 'eqp-003',
      data: '2026-06-30',
      horario: '14:00',
      urgencia: 'Normal',
      status: 'Equipamento recebido',
      criadoEm: '2026-06-24T16:45:00.000Z'
    },
    {
      id: 'agd-004',
      clienteId: 'cli-004',
      equipamentoId: 'eqp-004',
      data: '2026-07-01',
      horario: '10:00',
      urgencia: 'Prioridade',
      status: 'Em reparo',
      criadoEm: '2026-06-25T08:20:00.000Z'
    },
    {
      id: 'agd-005',
      clienteId: 'cli-005',
      equipamentoId: 'eqp-005',
      data: '2026-07-01',
      horario: '16:30',
      urgencia: 'Normal',
      status: 'Pronto para retirada',
      criadoEm: '2026-06-25T10:05:00.000Z'
    },
    {
      id: 'agd-006',
      clienteId: 'cli-001',
      equipamentoId: 'eqp-006',
      data: '2026-07-02',
      horario: '13:30',
      urgencia: 'Normal',
      status: 'Agendado',
      criadoEm: '2026-06-25T13:15:00.000Z'
    },
    {
      id: 'agd-007',
      clienteId: 'cli-003',
      equipamentoId: 'eqp-007',
      data: '2026-07-03',
      horario: '08:30',
      urgencia: 'Normal',
      status: 'Cancelado',
      criadoEm: '2026-06-25T17:30:00.000Z'
    }
  ],
  ordensServico: [
    {
      id: 'os-001',
      agendamentoId: 'agd-001',
      protocolo: 'TFX-2026-1001',
      status: 'Em avaliação',
      diagnostico: 'Possível acúmulo de poeira no cooler e HD com sinais de lentidão.',
      observacoes: 'Aguardando conclusão dos testes de armazenamento.'
    },
    {
      id: 'os-002',
      agendamentoId: 'agd-002',
      protocolo: 'TFX-2026-1002',
      status: 'Aguardando aprovação',
      diagnostico: 'Display e vidro frontal danificados. Touch com falhas intermitentes.',
      valorOrcamento: 590,
      prazoEstimado: '2 dias úteis',
      observacoes: 'Orçamento enviado para aprovação do cliente.'
    },
    {
      id: 'os-003',
      agendamentoId: 'agd-003',
      protocolo: 'TFX-2026-1003',
      status: 'Equipamento recebido',
      observacoes: 'Televisão recebida para análise de imagem.'
    },
    {
      id: 'os-004',
      agendamentoId: 'agd-004',
      protocolo: 'TFX-2026-1004',
      status: 'Em reparo',
      diagnostico: 'Roletes ressecados e cabeça de impressão com obstrução parcial.',
      valorOrcamento: 220,
      prazoEstimado: '1 dia útil',
      observacoes: 'Cliente aprovou limpeza e troca dos roletes.'
    },
    {
      id: 'os-005',
      agendamentoId: 'agd-005',
      protocolo: 'TFX-2026-1005',
      status: 'Pronto para retirada',
      diagnostico: 'Fonte com instabilidade e pasta térmica vencida.',
      valorOrcamento: 380,
      prazoEstimado: '3 dias úteis',
      observacoes: 'Reparo concluído. Equipamento em bancada para retirada.'
    },
    {
      id: 'os-006',
      agendamentoId: 'agd-006',
      protocolo: 'TFX-2026-1006',
      status: 'Agendado',
      observacoes: 'Cliente levará carregador original para teste.'
    },
    {
      id: 'os-007',
      agendamentoId: 'agd-007',
      protocolo: 'TFX-2026-1007',
      status: 'Cancelado',
      observacoes: 'Cliente cancelou o atendimento antes da entrega do equipamento.'
    }
  ]
};

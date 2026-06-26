# TechAgenda

Sistema web responsivo para agendamento e acompanhamento de servicos de assistencia tecnica de eletronicos da **TechFix Assistencia Tecnica**.

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- LocalStorage para persistencia simulada

## Como executar

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse:

```bash
http://localhost:5173/
```

Para validar o build:

```bash
npm run build
```

## Funcionalidades principais

- Pagina inicial com login/cadastro simulado para Cliente ou Assistencia.
- Agendamento em etapas para clientes.
- Escolha de data e horario com bloqueio de horarios ocupados.
- Area "Meus servicos" com busca, filtros, notificacoes e acompanhamento.
- Detalhe da ordem com linha do tempo, orcamento, diagnostico e acoes do cliente.
- Painel administrativo para a assistencia.
- Agenda semanal do prestador.
- Gestao de ordens de servico com atualizacao de status, diagnostico, orcamento, prazo e observacoes.
- Cadastro manual de agendamentos pelo atendente.
- Historico completo por cliente.
- Pagina "Sobre" com o objetivo do sistema.

## Perfis de usuario

**Cliente**

- Entra com e-mail/telefone de um cliente existente ou cria cadastro simulado.
- Agenda atendimento.
- Consulta apenas os servicos vinculados ao cliente logado.
- Acompanha status e linha do tempo.
- Aprova ou recusa orcamento quando disponivel.
- Cancela agendamento quando ainda esta em status inicial.

**Prestador / administrador**

- Entra pela area da assistencia usando o codigo demo `123456`.
- Visualiza dashboard administrativo.
- Gerencia agenda semanal.
- Atualiza ordens de servico.
- Consulta clientes e historico de atendimentos.
- Reseta os dados de demonstracao.

## Dados simulados e LocalStorage

Este projeto nao usa backend, API externa ou login real. Os dados e a sessao simulada de acesso por perfil sao persistidos no `LocalStorage` do navegador.

Ao atualizar a pagina, os dados continuam disponiveis no mesmo navegador. O painel do prestador possui a acao "Resetar dados de demonstracao" para restaurar os dados mockados iniciais.

## Usabilidade, acessibilidade e experiencia do usuario

A interface foi pensada para pessoas com pouca familiaridade digital:

- Fluxos divididos em etapas.
- Botoes grandes e textos claros.
- Icones acompanhados de texto em acoes importantes.
- Feedback visual para sucesso, erro e confirmacao.
- Estados vazios explicativos.
- Contraste consistente com azul escuro, azul claro, branco e cinza.
- Campos com labels visiveis.
- Navegacao responsiva para celular e desktop.
- Controles nativos acessiveis por teclado em formularios, botoes, selects e links.

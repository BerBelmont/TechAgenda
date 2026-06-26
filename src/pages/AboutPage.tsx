import { CalendarCheck, MessageSquareText, ShieldCheck } from 'lucide-react';

export const AboutPage = () => (
  <>
    <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Sobre</p>
        <h1 className="mt-3 text-4xl font-bold text-brand-900">TechAgenda</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Centralizar agendamentos, melhorar a comunicação e oferecer transparência no acompanhamento de serviços de
          assistência técnica.
        </p>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <CalendarCheck className="h-8 w-8 text-brand-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-brand-900">Agendamento simples</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Clientes solicitam atendimento em etapas claras, com data, horário e protocolo.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <MessageSquareText className="h-8 w-8 text-brand-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-brand-900">Comunicação organizada</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A assistência registra diagnósticos, orçamentos, prazos e observações em um só lugar.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <ShieldCheck className="h-8 w-8 text-brand-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-brand-900">Transparência</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O cliente acompanha status, histórico e orçamento sem depender de contato manual.
          </p>
        </article>
      </div>
    </section>
  </>
);

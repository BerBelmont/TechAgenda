import { Link } from 'react-router-dom';
import { CalendarPlus, ClipboardList, MonitorCheck } from 'lucide-react';
import { ServiceCard } from '../../components/ServiceCard';
import { getLoggedClient } from '../../services/auth';
import { getServices } from '../../services/storage';

export const ClientHomePage = () => {
  const client = getLoggedClient();
  const recentServices = getServices()
    .filter((service) => !client || service.cliente.id === client.id)
    .slice(0, 2);

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Perfil cliente</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-brand-900 sm:text-4xl">
              {client ? `Ola, ${client.nome.split(' ')[0]}` : 'Resolva seu atendimento em poucos passos'}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Agende uma visita ou bancada tecnica, acompanhe o status e consulte o orcamento digital quando estiver
              disponivel.
            </p>
          </div>
          <Link
            to="/cliente/agendar"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900 sm:w-fit"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Novo agendamento
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/cliente/agendar"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
          >
            <CalendarPlus className="h-8 w-8 text-brand-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-brand-900">Agendar atendimento</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Informe o aparelho, problema e melhor horario.</p>
          </Link>
          <Link
            to="/cliente/meus-servicos"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
          >
            <ClipboardList className="h-8 w-8 text-brand-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-brand-900">Meus servicos</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Consulte protocolos e veja o andamento.</p>
          </Link>
          <div className="rounded-lg border border-slate-200 bg-brand-900 p-6 text-white shadow-sm">
            <MonitorCheck className="h-8 w-8 text-brand-100" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Atendimento claro</h2>
            <p className="mt-2 text-sm leading-6 text-brand-100">Dados simulados salvos neste navegador para testes.</p>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-brand-900">Ultimos servicos</h2>
            <Link to="/cliente/meus-servicos" className="text-sm font-bold text-brand-700 hover:text-brand-900">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {recentServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

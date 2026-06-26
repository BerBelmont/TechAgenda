import { Link } from 'react-router-dom';
import { CalendarPlus, ClipboardList, MonitorCheck } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
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
      <PageHeader
        eyebrow="Perfil cliente"
        title={client ? `Ola, ${client.nome.split(' ')[0]}` : 'Resolva seu atendimento em poucos passos'}
        description="Agende uma visita ou bancada técnica, acompanhe o status e consulte o orçamento digital quando estiver disponível."
        action={
          <Link
            to="/cliente/agendar"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Novo agendamento
          </Link>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/cliente/agendar"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
          >
            <CalendarPlus className="h-8 w-8 text-brand-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-brand-900">Agendar atendimento</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Informe o aparelho, problema e melhor horário.</p>
          </Link>
          <Link
            to="/cliente/meus-servicos"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-soft"
          >
            <ClipboardList className="h-8 w-8 text-brand-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-brand-900">Meus serviços</h2>
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
            <h2 className="text-2xl font-bold text-brand-900">Últimos serviços</h2>
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

import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { ClientHomePage } from './pages/client/ClientHomePage';
import { ClientServicesPage } from './pages/client/ClientServicesPage';
import { SchedulePage } from './pages/client/SchedulePage';
import { ServiceDetailPage } from './pages/client/ServiceDetailPage';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { ProviderAgendaPage } from './pages/provider/ProviderAgendaPage';
import { ProviderClientsPage } from './pages/provider/ProviderClientsPage';
import { ProviderHomePage } from './pages/provider/ProviderHomePage';
import { ProviderServicesPage } from './pages/provider/ProviderServicesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'sobre', element: <AboutPage /> },
      { path: 'cliente', element: <RequireAuth role="cliente"><ClientHomePage /></RequireAuth> },
      { path: 'cliente/agendar', element: <RequireAuth role="cliente"><SchedulePage /></RequireAuth> },
      { path: 'cliente/meus-servicos', element: <RequireAuth role="cliente"><ClientServicesPage /></RequireAuth> },
      { path: 'cliente/servico', element: <RequireAuth role="cliente"><ServiceDetailPage /></RequireAuth> },
      { path: 'cliente/servico/:serviceId', element: <RequireAuth role="cliente"><ServiceDetailPage /></RequireAuth> },
      { path: 'prestador', element: <RequireAuth role="prestador"><ProviderHomePage /></RequireAuth> },
      { path: 'prestador/agenda', element: <RequireAuth role="prestador"><ProviderAgendaPage /></RequireAuth> },
      { path: 'prestador/servicos', element: <RequireAuth role="prestador"><ProviderServicesPage /></RequireAuth> },
      { path: 'prestador/clientes', element: <RequireAuth role="prestador"><ProviderClientsPage /></RequireAuth> }
    ]
  }
]);

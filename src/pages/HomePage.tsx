import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  Wrench
} from 'lucide-react';
import {
  acessarPrestador,
  cadastrarEEntrarCliente,
  clearCurrentSession,
  getCurrentSession,
  loginCliente,
  type AuthRole
} from '../services/auth';
import type { PreferenciaContato } from '../types';

type AccessMode = 'login' | 'cadastro';

const contactOptions: PreferenciaContato[] = ['WhatsApp', 'Ligação', 'E-mail'];

const inputClass =
  'min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 transition hover:border-brand-300';

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('perfil') === 'prestador' ? 'prestador' : 'cliente';
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [mode, setMode] = useState<AccessMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(() => getCurrentSession());

  const [clientLogin, setClientLogin] = useState('');
  const [clientSignup, setClientSignup] = useState({
    nome: '',
    telefone: '',
    email: '',
    preferenciaContato: 'WhatsApp' as PreferenciaContato
  });

  const [providerForm, setProviderForm] = useState({
    nome: 'Administrador',
    email: 'admin@techfix.com',
    codigo: ''
  });

  const destination = useMemo(() => {
    if (role === 'cliente') return '/cliente';
    return '/prestador';
  }, [role]);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3600);
  };

  const finishAccess = (path: string) => {
    setSession(getCurrentSession());
    window.setTimeout(() => {
      setIsLoading(false);
      navigate(path);
    }, 550);
  };

  const handleClientAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    window.setTimeout(() => {
      if (mode === 'login') {
        if (!clientLogin.trim()) {
          setIsLoading(false);
          showMessage('Informe seu e-mail ou telefone para entrar.');
          return;
        }

        const logged = loginCliente(clientLogin);
        if (!logged) {
          setIsLoading(false);
          showMessage('Nao encontramos esse cliente. Confira os dados ou faca um cadastro simples.');
          return;
        }

        finishAccess('/cliente');
        return;
      }

      if (!clientSignup.nome.trim() || !clientSignup.telefone.trim() || !clientSignup.email.trim()) {
        setIsLoading(false);
        showMessage('Preencha nome, telefone e e-mail para criar seu acesso.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientSignup.email)) {
        setIsLoading(false);
        showMessage('Digite um e-mail valido, como nome@email.com.');
        return;
      }

      cadastrarEEntrarCliente(clientSignup);
      finishAccess('/cliente');
    }, 450);
  };

  const handleProviderAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    window.setTimeout(() => {
      if (!providerForm.nome.trim() || !providerForm.email.trim() || !providerForm.codigo.trim()) {
        setIsLoading(false);
        showMessage('Preencha nome, e-mail e codigo de acesso da assistencia.');
        return;
      }

      const logged = acessarPrestador(providerForm);
      if (!logged) {
        setIsLoading(false);
        showMessage('Codigo incorreto. Para a demonstracao, use 123456.');
        return;
      }

      finishAccess('/prestador');
    }, 450);
  };

  const handleLogout = () => {
    clearCurrentSession();
    setSession(null);
    showMessage('Sessao encerrada. Escolha um perfil para entrar novamente.');
  };

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-600">TechAgenda</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
              TechFix Assistencia Tecnica
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Agende seu conserto de forma simples e acompanhe cada etapa.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Feature icon={Wrench} title="Agendamento rapido" />
              <Feature icon={ClipboardList} title="Orcamento digital" />
              <Feature icon={CheckCircle2} title="Acompanhamento claro" />
            </div>

            <Link
              to="/sobre"
              className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-900"
            >
              Conhecer objetivo do sistema
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-soft sm:p-5">
            <div className="rounded-lg bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <RoleButton
                  active={role === 'cliente'}
                  icon={UserRound}
                  title="Cliente"
                  description="Agendar e acompanhar meus servicos"
                  onClick={() => {
                    setRole('cliente');
                    setMode('login');
                    setMessage('');
                  }}
                />
                <RoleButton
                  active={role === 'prestador'}
                  icon={Building2}
                  title="Assistencia"
                  description="Gerenciar agenda e ordens"
                  onClick={() => {
                    setRole('prestador');
                    setMode('login');
                    setMessage('');
                  }}
                />
              </div>

              {session ? (
                <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4">
                  <p className="text-sm font-bold text-brand-900">
                    Voce esta conectado como {session.role === 'cliente' ? 'cliente' : 'assistencia'}.
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{session.name}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={session.role === 'cliente' ? '/cliente' : '/prestador'}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-900"
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-white"
                    >
                      Trocar acesso
                    </button>
                  </div>
                </div>
              ) : null}

              {message ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  {message}
                </div>
              ) : null}

              {role === 'cliente' ? (
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                    <ModeButton active={mode === 'login'} onClick={() => setMode('login')} label="Entrar" />
                    <ModeButton active={mode === 'cadastro'} onClick={() => setMode('cadastro')} label="Cadastrar" />
                  </div>

                  <form noValidate onSubmit={handleClientAccess} className="mt-5 grid gap-4">
                    {mode === 'login' ? (
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        E-mail ou telefone
                        <span className="relative">
                          <Mail
                            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            value={clientLogin}
                            onChange={(event) => setClientLogin(event.target.value)}
                            className={`${inputClass} w-full pl-11`}
                            placeholder="voce@email.com ou telefone"
                          />
                        </span>
                      </label>
                    ) : (
                      <>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Nome completo
                          <input
                            value={clientSignup.nome}
                            onChange={(event) => setClientSignup((current) => ({ ...current, nome: event.target.value }))}
                            className={inputClass}
                            placeholder="Seu nome"
                          />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            Telefone
                            <span className="relative">
                              <Phone
                                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                              />
                              <input
                                value={clientSignup.telefone}
                                onChange={(event) =>
                                  setClientSignup((current) => ({ ...current, telefone: event.target.value }))
                                }
                                className={`${inputClass} w-full pl-11`}
                                placeholder="(00) 00000-0000"
                              />
                            </span>
                          </label>
                          <label className="grid gap-2 text-sm font-semibold text-slate-700">
                            E-mail
                            <input
                              value={clientSignup.email}
                              onChange={(event) =>
                                setClientSignup((current) => ({ ...current, email: event.target.value }))
                              }
                              className={inputClass}
                              placeholder="voce@email.com"
                            />
                          </label>
                        </div>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Preferencia de contato
                          <select
                            value={clientSignup.preferenciaContato}
                            onChange={(event) =>
                              setClientSignup((current) => ({
                                ...current,
                                preferenciaContato: event.target.value as PreferenciaContato
                              }))
                            }
                            className={inputClass}
                          >
                            {contactOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}

                    <SubmitButton isLoading={isLoading} label={mode === 'login' ? 'Entrar como cliente' : 'Criar acesso'} />
                  </form>
                </div>
              ) : (
                <form noValidate onSubmit={handleProviderAccess} className="mt-6 grid gap-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    <strong>Demo:</strong> use o codigo <strong>123456</strong> para entrar na area da assistencia.
                  </div>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Nome do responsavel
                    <input
                      value={providerForm.nome}
                      onChange={(event) => setProviderForm((current) => ({ ...current, nome: event.target.value }))}
                      className={inputClass}
                      placeholder="Administrador"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    E-mail da assistencia
                    <input
                      value={providerForm.email}
                      onChange={(event) => setProviderForm((current) => ({ ...current, email: event.target.value }))}
                      className={inputClass}
                      placeholder="admin@techfix.com"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Codigo de acesso
                    <span className="relative">
                      <LockKeyhole
                        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        value={providerForm.codigo}
                        onChange={(event) => setProviderForm((current) => ({ ...current, codigo: event.target.value }))}
                        className={`${inputClass} w-full pl-11`}
                        placeholder="123456"
                      />
                    </span>
                  </label>

                  <SubmitButton isLoading={isLoading} label="Entrar na assistencia" />
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

type RoleButtonProps = {
  active: boolean;
  icon: typeof UserRound;
  title: string;
  description: string;
  onClick: () => void;
};

const RoleButton = ({ active, icon: Icon, title, description, onClick }: RoleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-24 flex-1 items-start gap-3 rounded-lg border p-4 text-left transition ${
      active
        ? 'border-brand-700 bg-brand-50 text-brand-900'
        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50'
    }`}
  >
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
        active ? 'bg-brand-800 text-white' : 'bg-slate-100 text-brand-700'
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <span>
      <span className="block font-bold">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
    </span>
  </button>
);

type ModeButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

const ModeButton = ({ active, label, onClick }: ModeButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-h-11 rounded-lg px-4 py-2 text-sm font-bold transition ${
      active ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-brand-900'
    }`}
  >
    {label}
  </button>
);

type SubmitButtonProps = {
  isLoading: boolean;
  label: string;
};

const SubmitButton = ({ isLoading, label }: SubmitButtonProps) => (
  <button
    type="submit"
    disabled={isLoading}
    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-base font-bold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-slate-400"
  >
    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
    {isLoading ? 'Entrando...' : label}
  </button>
);

type FeatureProps = {
  icon: typeof Wrench;
  title: string;
};

const Feature = ({ icon: Icon, title }: FeatureProps) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
    <p className="mt-3 text-sm font-bold text-brand-900">{title}</p>
  </div>
);

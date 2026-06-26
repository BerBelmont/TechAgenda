import { buscarClientePorId, cadastrarCliente, listarClientes } from './storage';
import type { Cliente, PreferenciaContato } from '../types';

const SESSION_KEY = 'techagenda:session';

export type AuthRole = 'cliente' | 'prestador';

export type AuthSession = {
  role: AuthRole;
  name: string;
  email?: string;
  clienteId?: string;
  createdAt: string;
};

export type ClientSignupData = {
  nome: string;
  telefone: string;
  email: string;
  preferenciaContato: PreferenciaContato;
};

export type ProviderAccessData = {
  nome: string;
  email: string;
  codigo: string;
};

const safeParseSession = (value: string | null): AuthSession | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AuthSession>;
    if (parsed.role !== 'cliente' && parsed.role !== 'prestador') return null;
    if (!parsed.name) return null;
    return parsed as AuthSession;
  } catch {
    return null;
  }
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const saveSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('techagenda:session'));
  return session;
};

export const getCurrentSession = (): AuthSession | null => safeParseSession(localStorage.getItem(SESSION_KEY));

export const clearCurrentSession = () => {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('techagenda:session'));
};

export const getLoggedClient = (): Cliente | undefined => {
  const session = getCurrentSession();
  if (session?.role !== 'cliente' || !session.clienteId) return undefined;
  return buscarClientePorId(session.clienteId);
};

export const loginCliente = (identifier: string): AuthSession | null => {
  const normalized = identifier.trim().toLowerCase();
  const normalizedPhone = onlyDigits(identifier);
  const client = listarClientes().find(
    (cliente) =>
      cliente.email.toLowerCase() === normalized ||
      (normalizedPhone.length >= 8 && onlyDigits(cliente.telefone) === normalizedPhone)
  );

  if (!client) return null;

  return saveSession({
    role: 'cliente',
    clienteId: client.id,
    name: client.nome,
    email: client.email,
    createdAt: new Date().toISOString()
  });
};

export const cadastrarEEntrarCliente = (form: ClientSignupData): AuthSession => {
  const client = cadastrarCliente(form);

  return saveSession({
    role: 'cliente',
    clienteId: client.id,
    name: client.nome,
    email: client.email,
    createdAt: new Date().toISOString()
  });
};

export const acessarPrestador = (form: ProviderAccessData): AuthSession | null => {
  if (form.codigo.trim() !== '123456') return null;

  return saveSession({
    role: 'prestador',
    name: form.nome || 'Administrador',
    email: form.email,
    createdAt: new Date().toISOString()
  });
};

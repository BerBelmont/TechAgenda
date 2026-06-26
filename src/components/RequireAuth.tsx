import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentSession, type AuthRole } from '../services/auth';

type RequireAuthProps = {
  role: AuthRole;
  children: ReactNode;
};

export const RequireAuth = ({ role, children }: RequireAuthProps) => {
  const location = useLocation();
  const session = getCurrentSession();

  if (!session || session.role !== role) {
    return <Navigate to={`/?perfil=${role}`} replace state={{ from: location.pathname }} />;
  }

  return children;
};

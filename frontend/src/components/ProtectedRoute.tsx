import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { RoleType } from '../types/auth';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: RoleType[];
};

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

function getDefaultRouteForRole(role: RoleType): string {
  switch (role) {
    case 'doctor':
      return '/doctor';
    case 'pharmacy':
      return '/pharmacy';
    case 'patient':
      return '/patient';
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
}

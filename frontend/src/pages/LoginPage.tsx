import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const { login, isAuthenticated, user, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    await login(email, password);
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 24 }}>
      <h1>Prescribe Platform Login</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </label>

        {error ? (
          <div style={{ color: 'crimson' }}>{error}</div>
        ) : null}

        <button type="submit" disabled={isLoading} style={{ padding: 10 }}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function getDefaultRouteForRole(role: string): string {
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

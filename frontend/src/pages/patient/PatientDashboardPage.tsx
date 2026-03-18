import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function PatientDashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <div style={{ padding: 24 }}>
      <h1>Patient Dashboard</h1>
      <p>Signed in as: {user?.role}</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Link to="/patient/prescriptions">My Prescriptions</Link>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </div>
  );
}

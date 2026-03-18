import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function DoctorDashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <div style={{ padding: 24 }}>
      <h1>Doctor Dashboard</h1>
      <p>Signed in as: {user?.role}</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Link to="/doctor/prescriptions">My Prescriptions</Link>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </div>
  );
}

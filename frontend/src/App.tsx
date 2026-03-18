import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorPrescriptionsPage } from './pages/doctor/DoctorPrescriptionsPage';
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';
import { PatientPrescriptionsPage } from './pages/patient/PatientPrescriptionsPage';
import { PharmacyDashboardPage } from './pages/pharmacy/PharmacyDashboardPage';
import { PharmacyPrescriptionsPage } from './pages/pharmacy/PharmacyPrescriptionsPage';

function AppRoutes() {
  const loadMe = useAuthStore((state) => state.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/prescriptions"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPrescriptionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute allowedRoles={['pharmacy']}>
            <PharmacyDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacy/prescriptions"
        element={
          <ProtectedRoute allowedRoles={['pharmacy']}>
            <PharmacyPrescriptionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/prescriptions"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientPrescriptionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAuditPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

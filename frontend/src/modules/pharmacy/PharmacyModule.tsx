import { Routes, Route } from 'react-router-dom';
import PharmacyDashboard from './pages/PharmacyDashboard';
import MainLayout from '../../layout/MainLayout';

export default function PharmacyModule() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={<PharmacyDashboard />} />
        {/* TODO: Add more pharmacy routes */}
        <Route path="*" element={<PharmacyDashboard />} />
      </Routes>
    </MainLayout>
  );
}

import { Routes, Route } from 'react-router-dom';
import DoctorDashboard from './pages/DoctorDashboard';
import MainLayout from '../../layout/MainLayout';

export default function DoctorModule() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={<DoctorDashboard />} />
        {/* TODO: Add more doctor routes */}
        <Route path="*" element={<DoctorDashboard />} />
      </Routes>
    </MainLayout>
  );
}

import { Routes, Route } from 'react-router-dom';
import PatientDashboard from './pages/PatientDashboard';
import MainLayout from '../../layout/MainLayout';

export default function PatientModule() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={<PatientDashboard />} />
        {/* TODO: Add more patient routes */}
        <Route path="*" element={<PatientDashboard />} />
      </Routes>
    </MainLayout>
  );
}

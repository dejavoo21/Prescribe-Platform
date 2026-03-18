import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import MainLayout from '../../layout/MainLayout';

export default function AdminModule() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={<AdminDashboard />} />
        {/* TODO: Add more admin routes */}
        <Route path="*" element={<AdminDashboard />} />
      </Routes>
    </MainLayout>
  );
}

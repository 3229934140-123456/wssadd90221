import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store";
import LoginPage from "@/pages/login/LoginPage";
import ReceptionScreen from "@/pages/reception/ReceptionScreen";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import CheckInPage from "@/pages/dashboard/CheckInPage";
import QueueManagement from "@/pages/dashboard/QueueManagement";
import ConsultantAssignment from "@/pages/dashboard/ConsultantAssignment";
import RoomManagement from "@/pages/dashboard/RoomManagement";
import ServiceRecords from "@/pages/dashboard/ServiceRecords";
import SettingsPage from "@/pages/dashboard/SettingsPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAppStore();
  return isLoggedIn ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
}) => {
  const { currentUser, isLoggedIn } = useAppStore();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reception" element={<ReceptionScreen />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="checkin" element={
            <RoleRoute allowedRoles={['ADMIN', 'RECEPTION', 'RECEPTIONIST']}>
              <CheckInPage />
            </RoleRoute>
          } />
          <Route path="check-in" element={<Navigate to="/dashboard/checkin" replace />} />
          <Route path="queue" element={
            <RoleRoute allowedRoles={['ADMIN', 'RECEPTION', 'RECEPTIONIST', 'CONSULTANT']}>
              <QueueManagement />
            </RoleRoute>
          } />
          <Route path="assignment" element={
            <RoleRoute allowedRoles={['ADMIN', 'RECEPTION']}>
              <ConsultantAssignment />
            </RoleRoute>
          } />
          <Route path="rooms" element={
            <RoleRoute allowedRoles={['ADMIN', 'RECEPTION']}>
              <RoomManagement />
            </RoleRoute>
          } />
          <Route path="records" element={
            <RoleRoute allowedRoles={['ADMIN', 'CONSULTANT']}>
              <ServiceRecords />
            </RoleRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

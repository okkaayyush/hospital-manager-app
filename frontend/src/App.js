import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" />;
  if (role && user.role !== role) return <Navigate to="/auth" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" />} />
        <Route path="/register" element={<Navigate to="/auth" />} />
        <Route path="/patient" element={
          <PrivateRoute role="patient"><PatientDashboard /></PrivateRoute>
        } />
        <Route path="/doctor" element={
          <PrivateRoute role="doctor"><DoctorDashboard /></PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
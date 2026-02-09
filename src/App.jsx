import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import all pages
import HomePage from './pages/HomePage';
import EmpLoginPage from './pages/EmpLoginPage';
import EmpSignupPage from './pages/EmpSignupPage';
import AdminDashboard from './pages/AdminDashboard';
import AssignTaskPage from './pages/AssignTaskPage'; // ✅ Imported correctly
// 👇 IMPORT THE NEW DASHBOARD
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={<HomePage />} />
      
      {/* Employee Routes */}
      <Route path="/login" element={<EmpLoginPage />} />
      <Route path="/signup" element={<EmpSignupPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      
      {/* 👇 This was the error area. Now it is fixed: */}
      <Route path="/assign-task" element={<AssignTaskPage />} />
      {/* 👇 ADD THIS NEW ROUTE */}
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
    </Routes>
  );
}

export default App;
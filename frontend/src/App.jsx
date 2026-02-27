import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import TeacherLayout from './pages/TeacherLayout';
import StudentDashboard from './pages/StudentDashboard';

/**
 * App Component
 * Acts as the Role-Based Access Control (RBAC) Gatekeeper.
 */
function App() {
  const [user, setUser] = useState(null);

  // Persistence: Check if a user is already logged in on page refresh
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Login Handler
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Logout Handler
  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
    // Force redirect to top level for a clean state
    window.location.href = '/'; 
  };

  // 1. UNAUTHENTICATED STATE
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. ROLE-BASED ROUTING
  // If teacher: Show Teacher Governance Sidebar Layout
  // If student: Show the new "EDU-GRADE" Student Sidebar Layout
  return user.role === 'teacher' ? (
    <TeacherLayout 
      user={user} 
      onLogout={handleLogout} 
    />
  ) : (
    <StudentDashboard 
      user={user} 
      onLogout={handleLogout} 
    />
  );
}

export default App;
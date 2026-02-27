import React, { useState } from 'react';
import Sidebar from '../components/Sidebar'; 
import FacultyDashboard from './FacultyDashboard'; 
import CreateExam from './CreateExam';
import BatchUpload from './BatchUpload';
import Evaluations from './Evaluations';

const TeacherLayout = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* 1. Sidebar (Fixed) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
      />

      {/* 2. Main Content (Scrollable) */}
      <main className="flex-1 ml-64 p-10">
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Faculty Management</h2>
                <h1 className="text-2xl font-black text-slate-800">Welcome, Prof. {user.name}</h1>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border text-xs font-medium text-slate-500">
                System Status: <span className="text-green-500">● AI Engine Online</span>
            </div>
        </header>

        {/* Dynamic Page Rendering */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <FacultyDashboard />}
          {activeTab === 'create' && <CreateExam user={user} />}
          {activeTab === 'upload' && <BatchUpload user={user} />}
          {activeTab === 'evaluations' && <Evaluations />}
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;
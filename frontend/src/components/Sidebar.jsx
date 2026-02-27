import React from 'react';
import { LayoutDashboard, FilePlus, Upload, FileSearch, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'create', label: 'Create Exam', icon: <FilePlus size={20} /> },
    { id: 'upload', label: 'Batch Upload', icon: <Upload size={20} /> },
    { id: 'evaluations', label: 'Evaluations', icon: <FileSearch size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen text-white flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-blue-400">Faculty Portal</h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Academic Governance</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-blue-600 shadow-lg shadow-blue-900/20 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="font-bold text-sm">Logout System</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
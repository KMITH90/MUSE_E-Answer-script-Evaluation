// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, GraduationCap, LogOut, Calendar, Search, FileText } from 'lucide-react';
import Results from './Results'; 

const StudentDashboard = ({ user, onLogout }) => {
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' or 'performance'
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/exams')
      .then(res => setExams(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('studentId', user.id);
    formData.append('examId', selectedExamId);

    try {
      await axios.post('http://localhost:5000/api/upload-script', formData);
      alert("Script Uploaded Successfully!");
      setSelectedExamId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* --- SIDEBAR (EDU-GRADE STYLE) --- */}
      <aside className="w-72 bg-[#1A1C4B] text-white flex flex-col fixed h-full shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-white p-2 rounded-lg">
              <GraduationCap className="text-[#1A1C4B]" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">EDU-GRADE</h1>
              <p className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">AI Governance</p>
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl mb-8 border border-white/5">
            <p className="text-[10px] text-blue-200 font-bold uppercase mb-2">Authenticated As</p>
            <p className="font-bold text-sm truncate">{user.name}</p>
            <span className="mt-2 inline-block bg-blue-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">
              {user.role}
            </span>
          </div>

          <nav className="space-y-3">
            <button 
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'exams' ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Book size={18} /> Exams
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'performance' ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <GraduationCap size={18} /> My Performance
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <button onClick={onLogout} className="flex items-center gap-3 text-slate-400 hover:text-white transition font-bold text-sm group">
            <div className="bg-white/5 p-2 rounded-lg group-hover:bg-red-500/20 group-hover:text-red-400">
              <LogOut size={18} />
            </div>
            Log Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 ml-72 p-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-[#1A1C4B] tracking-tight">
              {activeTab === 'exams' ? 'Academic Portal' : 'Results Pipeline'}
            </h2>
            <p className="text-slate-500 font-medium">
              {activeTab === 'exams' ? 'REAL-TIME EXAMINATION LIFECYCLE MANAGEMENT' : 'AUDIT TRAIL & REPORT GENERATION'}
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border text-xs font-bold text-slate-400">
            SERVER TIME: <span className="text-[#1A1C4B]">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </header>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 min-h-[500px]">
          {activeTab === 'exams' ? (
            exams.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {exams.map(exam => (
                  <ExamCard key={exam.id} exam={exam} onUpload={() => setSelectedExamId(exam.id)} />
                ))}
              </div>
            ) : (
              <EmptyState message="NO EXAMINATIONS SCHEDULED" />
            )
          ) : (
            <Results user={user} />
          )}
        </div>
      </main>

      {/* --- UPLOAD MODAL --- */}
      {selectedExamId && (
        <div className="fixed inset-0 bg-[#1A1C4B]/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-white p-10 rounded-[32px] max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-[#1A1C4B] mb-2">Secure Submission</h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">Upload your answer script for AI evaluation.</p>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center">
                <input 
                  type="file" 
                  className="hidden" 
                  id="file-upload" 
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-blue-500 mb-2" />
                  <p className="text-sm font-bold text-slate-700">{uploadFile ? uploadFile.name : "Select PDF or Image"}</p>
                </label>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  SUBMIT SCRIPT
                </button>
                <button type="button" onClick={() => setSelectedExamId(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200">
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER UI COMPONENTS ---

const ExamCard = ({ exam, onUpload }) => {
  const isExpired = new Date() > new Date(exam.end_time);
  return (
    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-all">
      <div className="flex items-center gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm text-blue-600">
          <FileText size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-lg">{exam.title}</h4>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{exam.subject}</p>
        </div>
      </div>
      <div className="text-right flex items-center gap-8">
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">Deadline</p>
          <p className={`text-sm font-bold ${isExpired ? 'text-red-500' : 'text-slate-700'}`}>
            {new Date(exam.end_time).toLocaleDateString()}
          </p>
        </div>
        {!isExpired ? (
          <button onClick={onUpload} className="bg-[#1A1C4B] text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-blue-600 transition shadow-xl shadow-slate-200">
            UPLOAD SCRIPT
          </button>
        ) : (
          <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-4 py-2 rounded-full uppercase">Closed</span>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
    <div className="bg-slate-100 p-10 rounded-[40px] mb-6">
      <Calendar size={64} className="text-slate-300" />
    </div>
    <p className="font-black text-slate-400 tracking-[0.2em]">{message}</p>
  </div>
);

const Upload = ({ size, className }) => <FileText size={size} className={className} />;

export default StudentDashboard;
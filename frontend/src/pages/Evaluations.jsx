import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Eye, Download, UserCheck, ShieldCheck, X, FileText, ClipboardList } from 'lucide-react';

const Evaluations = () => {
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // Track the record for the modal

  const fetchEvaluations = async (roll = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/evaluations/search?roll=${roll}`);
      setResults(res.data);
    } catch (err) {
      console.error("Audit fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (examId) => {
    if (!examId) {
      alert("Exam ID not found.");
      return;
    }
    window.open(`http://localhost:5000/api/download-report/${examId}`, '_blank');
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvaluations(searchTerm);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Evaluations Audit</h1>
          <p className="text-slate-500 font-medium">Verified student results and AI feedback repository</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
          <ShieldCheck size={16} /> Data Integrity Verified
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Student Roll Number..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      {/* RESULTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Info</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Examination</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Marks</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center text-slate-400">Loading...</td></tr>
            ) : results.map((res, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{res.name}</p>
                      <p className="text-xs text-slate-400">{res.roll}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 font-medium text-slate-600 text-sm">{res.exam}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    res.status === 'evaluated' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {res.status}
                  </span>
                </td>
                <td className="p-6 text-center font-black text-slate-800">{res.marks}</td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    {/* EYE BUTTON TRIGGERS MODAL */}
                    <button 
                      onClick={() => setSelectedRecord(res)} 
                      className="p-2 text-slate-400 hover:text-blue-600 transition" 
                      title="View Full Report"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                        onClick={() => handleDownloadReport(res.id)} 
                        className="p-2 text-slate-400 hover:text-emerald-600 transition"
                        title="Download PDF Marksheet"
                    >
                        <Download size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL UI --- */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{selectedRecord.name}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selectedRecord.exam} Audit</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Marks Awarded</p>
                  <p className="text-3xl font-black text-blue-600">{selectedRecord.marks}/100</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Evaluation Status</p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{selectedRecord.status}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold">
                  <ClipboardList size={18} className="text-blue-500" />
                  <h3>AI Evaluation Feedback</h3>
                </div>
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-slate-600 text-sm leading-relaxed italic">
                  "{selectedRecord.feedback || 'No feedback generated.'}"
                </div>
              </div>

              {selectedRecord.extracted_text && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold">
                    <FileText size={18} className="text-emerald-500" />
                    <h3>OCR Extracted Script</h3>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-500 text-xs font-mono whitespace-pre-wrap">
                    {selectedRecord.extracted_text}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button 
                onClick={() => handleDownloadReport(selectedRecord.id)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition"
            >
                <Download size={14} /> DOWNLOAD OFFICIAL MARKSHEET
            </button>
            
            <button 
                onClick={() => setSelectedRecord(null)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-blue-600 transition"
            >
                CLOSE AUDIT
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evaluations;
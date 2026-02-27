import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Play, CheckCircle, Loader2, FileArchive, AlertCircle } from 'lucide-react';

const BatchUpload = ({ user }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, completed

  useEffect(() => {
    // Fetch exams to populate the dropdown
    axios.get('http://localhost:5000/api/exams')
      .then(res => setExams(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleStartEvaluation = async () => {
    if (!selectedExam) return alert("Please select an exam portal first.");
    
    setIsProcessing(true);
    setStatus('processing');

    try {
      // Trigger the AI Evaluation route in your app.py
      const res = await axios.post(`http://localhost:5000/api/evaluate/${selectedExam}`);
      setStatus('completed');
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert("Evaluation failed. Ensure scripts are uploaded by students.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Evaluation Engine</h1>
        <p className="text-slate-500 font-medium">Bulk process answer scripts using Intelligent OCR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT: SELECTION */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Select Exam Portal</label>
            <select 
              className="w-full mt-2 p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedExam(e.target.value)}
              value={selectedExam}
            >
              <option value="">Choose Exam...</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title} ({e.subject})</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-200">
            <h4 className="font-bold text-sm mb-2">Engine Info</h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              The AI engine performs semantic similarity scoring and partial marking based on the marking scheme defined in the Deployment Console.
            </p>
          </div>
        </div>

        {/* RIGHT: ACTION AREA */}
        <div className="md:col-span-2 space-y-6">
          <div className={`bg-white p-10 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
            status === 'processing' ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200'
          }`}>
            
            {status === 'idle' && (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                  <FileArchive size={32} />
                </div>
                <h3 className="font-bold text-slate-800">Ready for Evaluation</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">
                  Ensure all students have submitted their PDFs before triggering the AI pipeline.
                </p>
              </>
            )}

            {status === 'processing' && (
              <>
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <h3 className="font-bold text-slate-800">AI Engine Active</h3>
                <p className="text-sm text-blue-600 mt-2 animate-pulse">
                  Performing OCR... Calculating Semantic Similarity...
                </p>
              </>
            )}

            {status === 'completed' && (
              <>
                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                <h3 className="font-bold text-slate-800">Evaluation Synced</h3>
                <p className="text-sm text-slate-500 mt-2">
                  All pending scripts for this exam have been graded.
                </p>
              </>
            )}
          </div>

          <button 
            disabled={isProcessing || !selectedExam}
            onClick={handleStartEvaluation}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all disabled:bg-slate-200 shadow-xl shadow-slate-100"
          >
            {isProcessing ? "Processing Pipeline..." : <><Play size={20} fill="currentColor" /> Start Intelligent Evaluation</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchUpload;
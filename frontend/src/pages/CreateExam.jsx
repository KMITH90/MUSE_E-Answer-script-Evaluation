import React, { useState } from 'react';
import axios from 'axios';
import { BookOpen, Send, Upload, FileText } from 'lucide-react';

const CreateExam = ({ user }) => {
  // 1. State Management
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    startTime: '',
    endTime: '',
  });

  const [qpFile, setQpFile] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [answerKey, setAnswerKey] = useState({ fileName: '', base64: '' });

  // 2. File Handlers
  const handleAnswerKeyChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerKey({
          fileName: file.name,
          base64: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. API Submission Logic
  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!qpFile) {
      alert("Please upload a question paper before deploying.");
      return;
    }
    setIsDeploying(true);

    const formData = new FormData();
    formData.append('title', examData.title);
    formData.append('subject', examData.subject);
    formData.append('teacherId', user.id);
    formData.append('startTime', examData.startTime);
    formData.append('endTime', examData.endTime);
    formData.append('questionPaper', qpFile); 
    formData.append('markingScheme', "Uploaded Question Paper File"); 

    try {
      await axios.post('http://localhost:5000/api/create-exam-full', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Examination Portal Deployed Successfully!");
    } catch (err) {
      console.error("Deployment failed:", err);
      alert("Error deploying exam portal. Check backend console.");
    } finally {
      setIsDeploying(false);
    }
  };

  // 4. Render Layout
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deployment Console</h1>
          <p className="text-slate-500 font-medium">Configure examination portal and upload question repository</p>
        </div>
      </div>

      <form onSubmit={handleDeploy} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: EXAM CONFIGURATION */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <BookOpen size={18} className="text-blue-600" /> General Info
            </h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Exam Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Mid-Term Semester 4"
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm mt-1"
                onChange={(e) => setExamData({...examData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Subject Code</label>
              <input
                required
                type="text"
                placeholder="e.g. CS102-DS"
                className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm mt-1"
                onChange={(e) => setExamData({...examData, subject: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs mt-1"
                  onChange={(e) => setExamData({...examData, startTime: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Closing Time</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs mt-1"
                  onChange={(e) => setExamData({...examData, endTime: e.target.value})}
                />
              </div>
            </div>

            {/* OPTIONAL ANSWER KEY UPLOAD */}
            <div className="pt-4 border-t border-slate-50">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reference Answer Key (Optional)</label>
              <div className="mt-2 relative">
                <input
                  type="file"
                  id="answerKeyInput"
                  className="hidden"
                  onChange={handleAnswerKeyChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="answerKeyInput"
                  className="flex items-center justify-center gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  {answerKey.fileName ? (
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs truncate">
                      <FileText size={16} /> {answerKey.fileName}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                      <Upload size={16} /> Select File
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: QUESTION PAPER UPLOAD SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="bg-blue-50 p-6 rounded-full mb-6">
              <FileText size={48} className="text-blue-600" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Question Paper Upload</h3>
            <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
              Instead of typing questions, upload the official PDF or Image.
              Students will view this file during the exam.
            </p>

            <div className="w-full max-w-md">
              <input
                type="file"
                required
                onChange={(e) => setQpFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                accept=".pdf,image/*"
              />
              {qpFile && (
                <p className="mt-4 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                  Ready to deploy: {qpFile.name}
                </p>
              )}
            </div>

            <div className="mt-12 pt-6 w-full border-t border-slate-50 flex justify-end">
              <button
                type="submit"
                disabled={isDeploying || !qpFile}
                className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:bg-slate-300"
              >
                {isDeploying ? "Deploying Portal..." : <><Send size={18} /> Deploy Examination Portal</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;
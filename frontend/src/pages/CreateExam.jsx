import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Calendar, BookOpen, Send, Clock, Upload, FileText } from 'lucide-react';

const CreateExam = ({ user }) => {
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    startTime: '',
    endTime: '',
    strength: '',
  });

  const [questions, setQuestions] = useState([
    { id: 1, text: '', marks: 5 }
  ]);

  const [isDeploying, setIsDeploying] = useState(false);
  
  // State for the file info
  const [answerKey, setAnswerKey] = useState({ fileName: '', base64: '' });

  // Convert file to Base64 to keep JSON compatibility
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerKey({
          fileName: file.name,
          base64: reader.result // This is the string representation of the file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: '', marks: 5 }]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    setIsDeploying(true);

    // Exact same payload structure as your original, just adding the answerKey field
    const payload = {
      ...examData,
      teacherId: user.id,
      questions: questions,
      answerKey: answerKey, // Contains { fileName, base64 }
      markingScheme: questions.map((q, i) => `Q${i+1}: ${q.text} (${q.marks} marks)`).join('\n')
    };

    try {
      // Sending as standard JSON (prevents 415 error)
      await axios.post('http://localhost:5000/api/create-exam-full', payload);
      alert("Portal Deployed Successfully!");
    } catch (err) {
      console.error("Deployment failed:", err);
      alert("Error deploying exam portal.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deployment Console</h1>
          <p className="text-slate-500 font-medium">Configure examination portal and question repository</p>
        </div>
        <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-100 italic">
          Draft Mode: Auto-saving enabled
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

            {/* UPLOAD BOX */}
            <div className="pt-4 border-t border-slate-50">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Answer Key (Optional)</label>
              <div className="mt-2 relative">
                <input 
                  type="file" 
                  id="answerKeyInput"
                  className="hidden"
                  onChange={handleFileChange}
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
                      <Upload size={16} /> Select Answer Key
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: QUESTION REPOSITORY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" /> Question Repository
              </h3>
              <button 
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 text-xs font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="flex gap-4 items-start animate-in slide-in-from-right-2 duration-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <textarea 
                      placeholder="Enter question text..."
                      rows="1"
                      className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-200 text-sm resize-none"
                      value={q.text}
                      onChange={(e) => {
                        const newQs = [...questions];
                        newQs[index].text = e.target.value;
                        setQuestions(newQs);
                      }}
                    />
                  </div>
                  <div className="w-24">
                    <input 
                      type="number" 
                      placeholder="Marks"
                      className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm text-center font-bold text-blue-600"
                      value={q.marks}
                      onChange={(e) => {
                        const newQs = [...questions];
                        newQs[index].marks = e.target.value;
                        setQuestions(newQs);
                      }}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-3 text-red-300 hover:text-red-500 transition mt-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-6 border-t border-slate-50 flex justify-end">
              <button 
                disabled={isDeploying}
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
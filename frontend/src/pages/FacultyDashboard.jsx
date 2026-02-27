import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Play,
  Loader2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    evaluated: 0,
    pending: 0,
    missing: 0,
    activeExams: 0,
    meanProficiency: 0
  });

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State to track which exam is currently being evaluated by AI
  const [evaluatingId, setEvaluatingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, examsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teacher-stats'),
        axios.get('http://localhost:5000/api/exams')
      ]);
      setStats(statsRes.data);
      setExams(examsRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // AI EVALUATION TRIGGER WITH LOADING STATE
  const triggerEvaluation = async (examId) => {
    setEvaluatingId(examId); // Start loading for this specific ID
    try {
      const res = await axios.post(`http://localhost:5000/api/evaluate/${examId}`);
      alert(res.data.message);
      // Refresh stats after evaluation is complete
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Ensure the backend is online.");
    } finally {
      setEvaluatingId(null); // Stop loading
    }
  };

  const chartData = {
    labels: ['Class Average', 'Target Mean', 'Last Exam'],
    datasets: [
      {
        label: 'Marks Percentage',
        data: [stats.meanProficiency, 75, 68],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(148, 163, 184, 0.2)', 'rgba(148, 163, 184, 0.2)'],
        borderRadius: 8,
      },
    ],
  };

  if (loading) return <div className="p-10 text-slate-500 animate-pulse">Synchronizing academic data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Governance</h1>
          <p className="text-slate-500 font-medium">Real-time faculty monitoring & evaluation metrics</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
          <TrendingUp size={16} />
          Mean Proficiency: {stats.meanProficiency}%
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<CheckCircle className="text-blue-600" />} title="Evaluation Volume" value={stats.evaluated} desc="Total scripts graded" color="blue" />
        <StatCard icon={<FileText className="text-amber-600" />} title="Scripts Pending" value={stats.pending} desc="Awaiting AI processing" color="amber" />
        <StatCard icon={<AlertCircle className="text-red-600" />} title="Missing Scripts" value={stats.missing} desc="Absentees detected" color="red" />
        <StatCard icon={<Users className="text-emerald-600" />} title="Exams Active" value={stats.activeExams} desc="Open student portals" color="emerald" />
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Performance Metrics</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Proficiency Data</span>
          </div>
          <div className="h-[300px]">
            <Bar 
              data={chartData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
              }} 
            />
          </div>
        </div>

        {/* REGISTRY SIDEBAR - Now with dynamic exams and AI trigger */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <BarChart size={20} className="text-blue-400" />
            Exam Registry
          </h3>
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {exams.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No exams deployed yet.</p>
            ) : (
              exams.map((exam) => (
                <div key={exam.id} className="border-l-2 border-blue-500/30 pl-4 py-2 group">
                  <p className="font-bold text-sm">{exam.title}</p>
                  <p className="text-[10px] text-slate-400 mb-3">{exam.subject}</p>
                  
                  {/* DYNAMIC BUTTON WITH LOADING STATE */}
                  <button 
                    onClick={() => triggerEvaluation(exam.id)}
                    disabled={evaluatingId !== null}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      evaluatingId === exam.id 
                      ? 'bg-amber-500 text-white animate-pulse' 
                      : 'bg-white/10 hover:bg-blue-600 text-blue-400 hover:text-white'
                    }`}
                  >
                    {evaluatingId === exam.id ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        AI Processing...
                      </>
                    ) : (
                      <>
                        <Play size={12} />
                        Run AI Evaluation
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, desc, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
    <h2 className="text-3xl font-black text-slate-900">{value}</h2>
    <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-tighter">{desc}</p>
  </div>
);

export default FacultyDashboard;
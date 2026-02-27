import React, { useState } from 'react';
import { loginUser, signupUser } from '../services/api';

const Auth = ({ onLoginSuccess }) => {
  const [activeRole, setActiveRole] = useState(null); // 'student' or 'teacher'
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', rollNumber: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // 1. SIGNUP LOGIC
        // We send the data + the activeRole (student or teacher) to the backend
        await signupUser({ ...formData, role: activeRole });
        
        alert(`Success! Your email is now permanently linked to the ${activeRole.toUpperCase()} role.`);
        setIsSignUp(false); // Move to login screen after successful signup
        
      } else {
        // 2. LOGIN LOGIC
        const user = await loginUser(formData.email, formData.password);
        
        // ROLE INTEGRITY ENFORCEMENT:
        // Even if password is correct, check if the email belongs to this portal
        if (user.role !== activeRole) {
          alert(
            `Security Alert: This email is registered as a ${user.role.toUpperCase()}. 
            You cannot use it to access the ${activeRole.toUpperCase()} portal.`
          );
          return; // Kill the function here so they don't get logged in
        }
        
        // If role matches, proceed to dashboard
        onLoginSuccess(user);
      }
    } catch (err) {
      // 3. ERROR HANDLING
      // This will display "This email is already registered..." from the backend
      const errorMessage = err.response?.data?.message || "Invalid credentials or connection error.";
      alert("Authentication Error: " + errorMessage);
    }
  };

  // 1. Initial Selection Screen (Portal Entry)
  if (!activeRole) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
          {/* Student Portal Card */}
          <div className="bg-white p-10 rounded-2xl shadow-lg border-t-4 border-blue-500 hover:scale-105 transition-transform cursor-pointer"
               onClick={() => setActiveRole('student')}>
            <h2 className="text-3xl font-black text-blue-600 mb-4">Student Portal</h2>
            <p className="text-gray-600">Access your exams, upload answer scripts, and view AI-generated results.</p>
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Enter Student Section</button>
          </div>

          {/* Teacher Portal Card */}
          <div className="bg-white p-10 rounded-2xl shadow-lg border-t-4 border-purple-500 hover:scale-105 transition-transform cursor-pointer"
               onClick={() => setActiveRole('teacher')}>
            <h2 className="text-3xl font-black text-purple-600 mb-4">Teacher Portal</h2>
            <p className="text-gray-600">Create examinations, manage answer keys, and trigger AI evaluations.</p>
            <button className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg font-bold">Enter Teacher Section</button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Dedicated Login/Signup Form for the chosen role
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-gray-800">
        <button onClick={() => {setActiveRole(null); setIsSignUp(false);}} className="text-gray-400 hover:text-black mb-4 text-sm">← Back to Selection</button>
        
        <h2 className="text-2xl font-bold mb-2">
          {activeRole.toUpperCase()} {isSignUp ? 'Registration' : 'Sign In'}
        </h2>
        <p className="text-sm text-gray-500 mb-6 font-medium">This section is strictly for {activeRole}s.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input type="text" placeholder="Full Name" required
              className="w-full p-3 border rounded-lg"
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
          )}
          <input type="email" placeholder="Email Address" required
            className="w-full p-3 border rounded-lg"
            onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required
            className="w-full p-3 border rounded-lg"
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
          
          {isSignUp && activeRole === 'student' && (
            <input type="text" placeholder="Roll Number" required
              className="w-full p-3 border rounded-lg"
              onChange={(e) => setFormData({...formData, rollNumber: e.target.value})} />
          )}

          <button type="submit" 
            className={`w-full p-3 rounded-lg font-bold text-white ${activeRole === 'student' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
            {isSignUp ? 'Create Account' : 'Login'}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-sm text-gray-600 font-semibold hover:underline">
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
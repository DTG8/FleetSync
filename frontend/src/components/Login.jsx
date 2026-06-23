import React, { useState } from 'react';
import axios from 'axios';
import { Truck, ShieldCheck, AlertCircle } from 'lucide-react';

const API_BASE = '/api/v1'; // Adjusted to use relative path for Nginx

export default function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await axios.post(`${API_BASE}/login/access-token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const token = res.data.access_token;
      localStorage.setItem('fleetToken', token);
      
      // Update default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')", backgroundBlendMode: 'overlay', backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center text-white space-x-3 mb-6">
          <Truck size={48} className="text-indigo-400" />
          <h2 className="text-4xl font-extrabold tracking-tight">FleetSync</h2>
        </div>
        <h2 className="mt-2 text-center text-xl font-medium text-slate-300">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/10 dark:bg-slate-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/20 dark:border-slate-700/50">
          
          {error && (
            <div className="mb-6 bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 flex items-center space-x-3 text-rose-200">
              <AlertCircle size={20} className="text-rose-400 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Email address
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white/5 text-white"
                  placeholder="admin@cedarviewng.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white/5 text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center text-xs text-slate-400">
            <p>Secure Fleet Management Portal</p>
            <p>&copy; {new Date().getFullYear()} Cedarview. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

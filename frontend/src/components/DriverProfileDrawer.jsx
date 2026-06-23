import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Car, Clock, DollarSign, Calendar, Activity } from 'lucide-react';

const DriverProfileDrawer = ({ driverId, onClose, apiBase }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError(null);
        const response = await axios.get(`${apiBase}/profiles/drivers/${driverId}`);
        setProfile(response.data);
      } catch (err) {
        console.error("Failed to fetch driver profile", err);
        setError(err.response?.data?.detail || err.message || "Failed to load driver profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [driverId, apiBase]);

  if (loading || error || !profile) {
    return (
      <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/50 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900 h-full shadow-2xl flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X size={24} />
          </button>
          {loading && <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading driver profile...</p>}
          {error && (
            <div className="text-center p-6">
              <p className="text-rose-500 font-semibold text-sm mb-2">Error loading profile</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{error}</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-4">Make sure the backend migration has been run and the server restarted.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'On Leave': return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'On Assignment': return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      default: return 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0 border-l border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center space-x-4">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500">
                <User size={32} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
                <span>{profile.full_name}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusColor(profile.status)}`}>
                  {profile.status}
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-4 mt-1">
                <span>Lic: {profile.license_number}</span>
                <span>Tel: {profile.phone_number}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Allocated Vehicle Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Car size={18} className="text-indigo-500" />
              <span>Permanently Allocated Vehicle</span>
            </h3>
            {profile.allocated_vehicle ? (
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <div>
                  <p className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">{profile.allocated_vehicle.plate_number}</p>
                  <p className="text-indigo-700 dark:text-indigo-300 text-sm">{profile.allocated_vehicle.make} {profile.allocated_vehicle.model}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-md">Primary Assignment</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No vehicle permanently allocated to this driver.</p>
            )}
          </div>

          {/* Temporary Assignment History */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock size={18} className="text-amber-500" />
              <span>Temporary Dispatch History</span>
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Vehicle</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Task</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Dispatched</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Returned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {profile.assignments.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-slate-500 italic">No dispatch history found.</td></tr>
                  ) : profile.assignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-200">{a.vehicle_plate}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{a.task_description || '-'}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(a.dispatched_at).toLocaleString()}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        {a.returned_at ? new Date(a.returned_at).toLocaleString() : <span className="text-amber-500 font-semibold">Active</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost & Expense Log */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <DollarSign size={18} className="text-rose-500" />
              <span>Incurred Expense Log</span>
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Category</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Description</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {profile.cost_history.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-slate-500 italic">No expenses reported by this driver.</td></tr>
                  ) : profile.cost_history.map((cost, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-slate-500 dark:text-slate-400">{cost.date}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-300">{cost.type}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{cost.description}</td>
                      <td className="p-3 text-right font-semibold text-rose-600 dark:text-rose-400">₦{cost.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DriverProfileDrawer;

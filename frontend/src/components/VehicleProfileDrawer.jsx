import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Car, Clock, ShieldCheck, Settings, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const VehicleProfileDrawer = ({ vehicleId, onClose, apiBase }) => {
  const [profile, setProfile] = useState(null);
  const [accessories, setAccessories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  const fetchProfile = async () => {
    try {
      setError(null);
      const [profRes, accRes, docRes] = await Promise.all([
        axios.get(`${apiBase}/profiles/vehicles/${vehicleId}`),
        axios.get(`${apiBase}/accessories/vehicle/${vehicleId}`),
        axios.get(`${apiBase}/compliance/papers/vehicle/${vehicleId}`)
      ]);
      setProfile(profRes.data);
      setAccessories(accRes.data);
      setDocuments(docRes.data);
    } catch (err) {
      console.error("Failed to fetch vehicle profile", err);
      setError(err.response?.data?.detail || err.message || "Failed to load vehicle profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [vehicleId, apiBase]);

  const updateAccessoryStatus = async (id, newStatus) => {
    try {
      await axios.put(`${apiBase}/accessories/${id}`, { status: newStatus });
      fetchProfile();
    } catch (err) {
      console.error("Failed to update accessory", err);
    }
  };

  const addAccessory = async (itemName) => {
    try {
      await axios.post(`${apiBase}/accessories/`, { vehicle_id: vehicleId, item_name: itemName, status: 'Present' });
      fetchProfile();
    } catch (err) {
      console.error("Failed to add accessory", err);
    }
  };

  if (loading || error || !profile) {
    return (
      <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/50 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900 h-full shadow-2xl flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X size={24} />
          </button>
          {loading && <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading vehicle profile...</p>}
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

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0 border-l border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Car size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
                  <span>{profile.plate_number}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${profile.status === 'Active' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' : 'bg-rose-500/20 text-rose-700 border-rose-500/30'}`}>
                    {profile.status}
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {profile.year} {profile.make} {profile.model} &bull; {profile.current_odometer.toLocaleString()} km
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Cost of Ownership</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">₦{profile.total_tco.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Timeline Events</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{profile.history.length}</p>
            </div>
          </div>

          <div className="flex space-x-6 mt-6 border-b border-slate-200 dark:border-slate-800">
            <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-bold ${activeTab === 'history' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Full History Log
            </button>
            <button onClick={() => setActiveTab('accessories')} className={`pb-3 text-sm font-bold ${activeTab === 'accessories' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Accessories Checklist
            </button>
            <button onClick={() => setActiveTab('documents')} className={`pb-3 text-sm font-bold ${activeTab === 'documents' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              Documents
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
          
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic">No documents logged for this vehicle.</div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Document Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Expiry Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {documents.map((doc) => {
                        const today = new Date();
                        const expiry = new Date(doc.expiry_date);
                        const diffTime = expiry - today;
                        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let statusStr = "Valid";
                        let statusColor = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
                        if (daysRemaining < 0) {
                          statusStr = "Expired";
                          statusColor = "bg-rose-500/20 text-rose-700 dark:text-rose-300";
                        } else if (daysRemaining < 30) {
                          statusStr = "Expiring Soon";
                          statusColor = "bg-amber-500/20 text-amber-700 dark:text-amber-300";
                        }

                        return (
                          <tr key={doc.id}>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{doc.document_type}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{doc.expiry_date}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                                  {statusStr}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  ({statusStr === 'Expired' ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`})
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {profile.history.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic">No history logged for this vehicle yet.</div>
              ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8">
                  {profile.history.map((event, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-2 top-1 w-4 h-4 rounded-full border-4 border-slate-50 dark:border-slate-900 ${
                        event.category === 'Assignment' ? 'bg-indigo-500' :
                        event.category === 'Maintenance' ? 'bg-rose-500' :
                        event.category === 'Fuel' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{event.category}</span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{event.title}</h4>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(event.datetime || event.date).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{event.description}</p>
                        {event.cost > 0 && (
                          <div className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
                            Cost: ₦{event.cost.toFixed(2)}
                          </div>
                        )}
                        {event.status && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Status: {event.status}</span>
                            {event.returned_at && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-600 pl-2">
                                Returned: {new Date(event.returned_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'accessories' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                <button onClick={() => addAccessory('Fire Extinguisher')} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium">+ Fire Extinguisher</button>
                <button onClick={() => addAccessory('Spare Tyre')} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium">+ Spare Tyre</button>
                <button onClick={() => addAccessory('Jack')} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium">+ Jack</button>
                <button onClick={() => addAccessory('Wheel Spanner')} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium">+ Wheel Spanner</button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Item</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Last Checked</th>
                      <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Status Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {accessories.length === 0 ? (
                      <tr><td colSpan="3" className="p-6 text-center text-slate-500 italic">No accessories tracked for this vehicle. Click above to add standard items.</td></tr>
                    ) : accessories.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-medium text-slate-900 dark:text-slate-200 flex items-center space-x-2">
                          {item.status === 'Present' ? <CheckCircle size={16} className="text-emerald-500"/> : <AlertTriangle size={16} className="text-amber-500"/>}
                          <span>{item.item_name}</span>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(item.last_updated).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <select 
                            value={item.status}
                            onChange={(e) => updateAccessoryStatus(item.id, e.target.value)}
                            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none"
                          >
                            <option value="Present">Present</option>
                            <option value="Missing">Missing</option>
                            <option value="Damaged">Damaged</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VehicleProfileDrawer;

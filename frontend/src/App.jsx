import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  LayoutDashboard,
  Car,
  UserCheck,
  Fuel,
  Wrench,
  FileText,
  Plus,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Clock,
  LogOut,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  TrendingDown,
  Sun,
  Moon,
  Coins,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = 'http://127.0.0.1:8000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [financialPeriod, setFinancialPeriod] = useState('weekly');

  const [metrics, setMetrics] = useState({
    total_fleet: 0,
    active_fleet: 0,
    faulty_vehicles: 0,
    in_repair_vehicles: 0,
    papers_expiring_soon: 0,
    total_fuel_this_week: 0.0,
    total_fuel_last_week: 0.0
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [expiringPapers, setExpiringPapers] = useState([]);
  const [recurrentMaintenance, setRecurrentMaintenance] = useState([]);
  const [weeklyFuel, setWeeklyFuel] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [miscExpenses, setMiscExpenses] = useState([]);
  const [financialReport, setFinancialReport] = useState({ vehicles: [], drivers: [], period: 'weekly' });
  const [fillingStationStats, setFillingStationStats] = useState([]);

  // Modals & Forms State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'vehicle', 'driver', 'allocation', 'fuel', 'maintenance', 'paper', 'misc'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Field States
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', make: '', model: '', year: new Date().getFullYear(), status: 'Active', current_odometer: 0, current_fuel_level_percent: 100, purchase_date: '' });
  const [driverForm, setDriverForm] = useState({ full_name: '', license_number: '', phone_number: '', status: 'Available' });
  const [allocationForm, setAllocationForm] = useState({ vehicle_id: '', driver_id: '' });
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', driver_id: '', entry_date: new Date().toISOString().split('T')[0], odometer_reading: '', fuel_added_liters: '', cost: '', fuel_gauge_after_fill_percent: '', filling_station: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ vehicle_id: '', driver_id: '', issue_description: '', type: 'Routine Service', status: 'Pending', cost: '', logged_at: new Date().toISOString().split('T')[0], resolved_at: '' });
  const [paperForm, setPaperForm] = useState({ vehicle_id: '', document_type: 'Insurance', expiry_date: '' });
  const [miscForm, setMiscForm] = useState({ vehicle_id: '', driver_id: '', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0], category: 'Toll' });

  // Theme Sync Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load Data
  const loadAllData = async () => {
    try {
      const [
        resMetrics, resVehicles, resDrivers, resAllocations, 
        resExpiring, resRecurrent, resWeekly, resFuelLogs, 
        resMaintLogs, resMiscLogs, resFinReport, resStationStats
      ] = await Promise.all([
        axios.get(`${API_BASE}/analytics/dashboard`),
        axios.get(`${API_BASE}/vehicles`),
        axios.get(`${API_BASE}/drivers`),
        axios.get(`${API_BASE}/allocations`),
        axios.get(`${API_BASE}/compliance/expiring-papers`),
        axios.get(`${API_BASE}/analytics/maintenance-recurrent`),
        axios.get(`${API_BASE}/analytics/weekly-fuel`),
        axios.get(`${API_BASE}/fuel-logs`),
        axios.get(`${API_BASE}/maintenance-logs`),
        axios.get(`${API_BASE}/miscellaneous-expenses`),
        axios.get(`${API_BASE}/analytics/financial-report?period=${financialPeriod}`),
        axios.get(`${API_BASE}/analytics/filling-stations?period=${financialPeriod}`)
      ]);

      setMetrics(resMetrics.data);
      setVehicles(resVehicles.data);
      setDrivers(resDrivers.data);
      setAllocations(resAllocations.data);
      setExpiringPapers(resExpiring.data);
      setRecurrentMaintenance(resRecurrent.data);
      setWeeklyFuel(resWeekly.data);
      setFuelLogs(resFuelLogs.data);
      setMaintenanceLogs(resMaintLogs.data);
      setMiscExpenses(resMiscLogs.data);
      setFinancialReport(resFinReport.data);
      setFillingStationStats(resStationStats.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  // Trigger data load on mount and when financialPeriod changes
  useEffect(() => {
    loadAllData();
  }, [financialPeriod]);

  // Refresh every 30s
  useEffect(() => {
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, [financialPeriod]);

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    clearMessages();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    clearMessages();
  };

  // API Call Handlers
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_BASE}/vehicles`, vehicleForm);
      setSuccessMsg('Vehicle added successfully!');
      setVehicleForm({ plate_number: '', make: '', model: '', year: new Date().getFullYear(), status: 'Active', current_odometer: 0, current_fuel_level_percent: 100, purchase_date: '' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add vehicle.');
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_BASE}/drivers`, driverForm);
      setSuccessMsg('Driver added successfully!');
      setDriverForm({ full_name: '', license_number: '', phone_number: '', status: 'Available' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add driver.');
    }
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_BASE}/allocations`, allocationForm);
      setSuccessMsg('Driver allocated successfully!');
      setAllocationForm({ vehicle_id: '', driver_id: '' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to allocate driver.');
    }
  };

  const handleCreateFuelLog = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const payload = { ...fuelForm };
      if (!payload.driver_id) delete payload.driver_id;
      await axios.post(`${API_BASE}/fuel-logs`, payload);
      setSuccessMsg('Fuel fill-up logged successfully!');
      setFuelForm({ vehicle_id: '', driver_id: '', entry_date: new Date().toISOString().split('T')[0], odometer_reading: '', fuel_added_liters: '', cost: '', fuel_gauge_after_fill_percent: '', filling_station: '' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to log fuel.');
    }
  };

  const handleCreateMaintenanceLog = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const payload = { ...maintenanceForm };
      if (!payload.driver_id) delete payload.driver_id;
      if (!payload.resolved_at) delete payload.resolved_at;
      await axios.post(`${API_BASE}/maintenance-logs`, payload);
      setSuccessMsg('Maintenance logged successfully!');
      setMaintenanceForm({ vehicle_id: '', driver_id: '', issue_description: '', type: 'Routine Service', status: 'Pending', cost: '', logged_at: new Date().toISOString().split('T')[0], resolved_at: '' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to log maintenance.');
    }
  };

  const handleCreatePaper = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_BASE}/compliance/papers`, paperForm);
      setSuccessMsg('Vehicle paper added successfully!');
      setPaperForm({ vehicle_id: '', document_type: 'Insurance', expiry_date: '' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add paper.');
    }
  };

  const handleCreateMiscExpense = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const payload = { ...miscForm };
      if (!payload.driver_id) delete payload.driver_id;
      await axios.post(`${API_BASE}/miscellaneous-expenses`, payload);
      setSuccessMsg('Miscellaneous expense logged successfully!');
      setMiscForm({ vehicle_id: '', driver_id: '', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0], category: 'Toll' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to log miscellaneous expense.');
    }
  };

  const handleReturnVehicle = async (allocId) => {
    if (!window.confirm('Are you sure you want to mark this vehicle as returned?')) return;
    try {
      await axios.post(`${API_BASE}/allocations/${allocId}/return`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to return vehicle.');
    }
  };

  // Find Leaderboard resource consumers
  const getLeaderboard = () => {
    let moneyPit = { plate_number: 'N/A', total_tco: 0, cost_per_km: 0 };
    let highRiskDriver = { driver_name: 'N/A', total_tco: 0 };

    if (financialReport.vehicles.length > 0) {
      const sortedV = [...financialReport.vehicles].sort((a, b) => b.total_tco - a.total_tco);
      moneyPit = sortedV[0];
    }
    if (financialReport.drivers.length > 0) {
      const sortedD = [...financialReport.drivers].sort((a, b) => b.total_tco - a.total_tco);
      highRiskDriver = sortedD[0];
    }

    return { moneyPit, highRiskDriver };
  };

  const { moneyPit, highRiskDriver } = getLeaderboard();

  // Stacked Bar Chart setup
  const chartTextColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const chartGridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(71, 85, 105, 0.08)';
  const chartLegendColor = theme === 'dark' ? '#f1f5f9' : '#1e293b';

  const costSegmentationData = {
    labels: financialReport.vehicles.map((item) => item.plate_number),
    datasets: [
      {
        label: 'Fuel Costs',
        data: financialReport.vehicles.map((item) => item.fuel_cost),
        backgroundColor: 'rgba(99, 102, 241, 0.85)', // Indigo
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Repair Costs',
        data: financialReport.vehicles.map((item) => item.repair_cost),
        backgroundColor: 'rgba(168, 85, 247, 0.85)', // Purple
        borderColor: '#a855f7',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Misc Costs',
        data: financialReport.vehicles.map((item) => item.misc_cost),
        backgroundColor: 'rgba(245, 158, 11, 0.85)', // Amber/Orange
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const costSegmentationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartLegendColor,
          font: { family: 'Outfit', weight: '600' }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ₦${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: chartTextColor }
      },
      y: {
        stacked: true,
        grid: { color: chartGridColor },
        ticks: { 
          color: chartTextColor,
          callback: (value) => `₦${value}`
        }
      }
    }
  };

  // Nav Items
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', name: 'Vehicles', icon: Car },
    { id: 'drivers', name: 'Drivers', icon: UserCheck },
    { id: 'financials', name: 'Financials', icon: Coins },
    { id: 'fuel', name: 'Fuel Logs', icon: Fuel },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'compliance', name: 'Compliance', icon: FileText }
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-colors duration-200">
        <div>
          <div className="p-6 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">FleetSync</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Hub Console</p>
            </div>
          </div>

          <nav className="mt-8 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active 
                      ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-300 border-l-4 border-indigo-500 shadow-inner' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Server Online</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/40 dark:bg-slate-950/40 relative">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 px-8 flex items-center justify-between shrink-0 bg-white/70 dark:bg-slate-900/30 backdrop-blur-md transition-colors duration-200">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">{activeTab}</h1>
          
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-300 dark:border-slate-700"
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </button>

            <button
              onClick={() => handleOpenModal('vehicle')}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
            <button
              onClick={() => handleOpenModal('driver')}
              className="flex items-center space-x-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Fleet</span>
                    <div className="p-2 bg-indigo-500/10 rounded-xl"><Car className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /></div>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.total_fleet}</span>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 flex items-center space-x-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{metrics.active_fleet} active in field</span>
                    </p>
                  </div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl translate-x-8 translate-y-8"></div>
                </div>

                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Faulty Vehicles</span>
                    <div className="p-2 bg-amber-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" /></div>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.faulty_vehicles}</span>
                    <p className="text-xs text-amber-500 dark:text-amber-400 mt-1 font-semibold">Requires immediate attention</p>
                  </div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl translate-x-8 translate-y-8"></div>
                </div>

                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">In Repair (Workshop)</span>
                    <div className="p-2 bg-purple-500/10 rounded-xl"><Wrench className="w-5 h-5 text-purple-500 dark:text-purple-400" /></div>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.in_repair_vehicles}</span>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-semibold">Currently being serviced</p>
                  </div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl translate-x-8 translate-y-8"></div>
                </div>

                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Papers Expiring Soon</span>
                    <div className="p-2 bg-rose-500/10 rounded-xl"><FileText className="w-5 h-5 text-rose-500 dark:text-rose-400" /></div>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.papers_expiring_soon}</span>
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">Due within 30 days or expired</p>
                  </div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl translate-x-8 translate-y-8"></div>
                </div>

              </div>

              {/* Financial Dashboard Aggregations Section */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center space-x-2">
                      <Coins className="w-5.5 h-5.5 text-indigo-500" />
                      <span>Financial Aggregations Report</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Time-bucketed TCO diagnostics per asset and operator.</p>
                  </div>

                  {/* Period Switcher */}
                  <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 w-fit shrink-0 self-start sm:self-center">
                    {['weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFinancialPeriod(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                          financialPeriod === p
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leaderboard Resource Consumers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Money Pit Vehicle */}
                  <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border-l-4 border-l-rose-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-rose-500 tracking-wider block mb-1">The "Money Pit" Vehicle</span>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">{moneyPit.plate_number}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Highest expenditure asset in period</p>
                      </div>
                      <div className="p-2.5 bg-rose-500/10 rounded-xl"><ShieldAlert className="w-6 h-6 text-rose-500" /></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800/60 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Total TCO</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">₦{moneyPit.total_tco.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Cost per KM</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">₦{moneyPit.cost_per_km.toFixed(2)}/km</span>
                      </div>
                    </div>
                  </div>

                  {/* High-Risk Driver */}
                  <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-amber-500 tracking-wider block mb-1">The "High-Risk" Driver</span>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">{highRiskDriver.driver_name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Highest consuming operator in period</p>
                      </div>
                      <div className="p-2.5 bg-amber-500/10 rounded-xl"><UserCheck className="w-6 h-6 text-amber-500" /></div>
                    </div>
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-800/60 pt-4">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Total Attributed Cost</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">₦{highRiskDriver.total_tco.toFixed(2)}</span>
                    </div>
                  </div>

                </div>

                {/* Cost Segmentation Stacked Bar Chart */}
                <div className="glass-panel rounded-2xl p-6 h-[380px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Cost Segmentation per Vehicle</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total expenditure stack breakdown: Fuel vs. Repairs vs. Miscellaneous Expenses.</p>
                  </div>
                  <div className="relative flex-1 mt-4 h-64">
                    {financialReport.vehicles.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs">No financial records registered in this period.</div>
                    ) : (
                      <Bar key={theme} data={costSegmentationData} options={costSegmentationOptions} />
                    )}
                  </div>
                </div>

              </div>

              {/* Lower Layer Grid: Active allocations & Compliance panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Driver Assignments */}
                <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Driver Assignments</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Current active allocations. Make new allocations via forms.</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal('allocation')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign Driver</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                            <th className="py-3 px-2">Vehicle Plate</th>
                            <th className="py-3 px-2">Driver</th>
                            <th className="py-3 px-2">Allocated At</th>
                            <th className="py-3 px-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                          {allocations.filter(a => a.returned_at === null).length === 0 ? (
                            <tr>
                              <td colSpan="4" className="py-6 text-center text-slate-500 text-xs">No active allocations found.</td>
                            </tr>
                          ) : (
                            allocations.filter(a => a.returned_at === null).map((alloc) => (
                              <tr key={alloc.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                                <td className="py-3 px-2 font-semibold text-indigo-600 dark:text-indigo-400">{alloc.vehicle_plate || `ID: ${alloc.vehicle_id}`}</td>
                                <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{alloc.driver_name || `ID: ${alloc.driver_id}`}</td>
                                <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs">{new Date(alloc.allocated_at).toLocaleString()}</td>
                                <td className="py-3 px-2 text-right">
                                  <button
                                    onClick={() => handleReturnVehicle(alloc.id)}
                                    className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-emerald-500 dark:hover:text-emerald-400 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs transition-all"
                                  >
                                    De-allocate/Return
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Compliance Panel */}
                <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Compliance & Expiry</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Required documents due within 30 days or overdue.</p>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {expiringPapers.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">All papers are up to date!</div>
                      ) : (
                        expiringPapers.map((paper) => {
                          const isExpired = paper.status === 'Expired';
                          return (
                            <div
                              key={paper.id}
                              className={`p-3 rounded-xl border flex justify-between items-center ${
                                isExpired 
                                  ? 'bg-rose-500/5 border-rose-500/20 text-rose-900 dark:text-rose-200' 
                                  : 'bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-semibold text-sm">{paper.plate_number}</span>
                                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">({paper.document_type})</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Expires: {paper.expiry_date}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isExpired ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                }`}>
                                  {paper.status}
                                </span>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                                  {isExpired ? `${Math.abs(paper.days_remaining)} days ago` : `${paper.days_remaining} days left`}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenModal('paper')}
                    className="w-full mt-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Document Paper</span>
                  </button>
                </div>

              </div>
            </>
          )}

          {/* TAB 2: VEHICLES LIST */}
          {activeTab === 'vehicles' && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Vehicles</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage, inspect, and track odometer/fuel status of your fleet assets.</p>
                </div>
                <button
                  onClick={() => handleOpenModal('vehicle')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Vehicle</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                      <th className="py-3 px-4">Plate</th>
                      <th className="py-3 px-4">Make & Model</th>
                      <th className="py-3 px-4">Year</th>
                      <th className="py-3 px-4">Current Odometer</th>
                      <th className="py-3 px-4">Fuel level</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">No vehicles registered. Click "New Vehicle" to create.</td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                          <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{v.plate_number}</td>
                          <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">{v.make} {v.model}</td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{v.year}</td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">{v.current_odometer.toLocaleString()} km</td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-slate-200 dark:bg-slate-850 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    v.current_fuel_level_percent > 50 ? 'bg-emerald-500' : v.current_fuel_level_percent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${v.current_fuel_level_percent}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-mono">{v.current_fuel_level_percent}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                              v.status === 'Faulty' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                              'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{v.purchase_date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DRIVERS LIST */}
          {activeTab === 'drivers' && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Drivers</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage team profiles, licensing documentation, and allocation availability states.</p>
                </div>
                <button
                  onClick={() => handleOpenModal('driver')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Driver</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                      <th className="py-3 px-4">Driver Name</th>
                      <th className="py-3 px-4">License Number</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">No drivers registered. Click "New Driver" to create.</td>
                      </tr>
                    ) : (
                      drivers.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{d.full_name}</td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">{d.license_number}</td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{d.phone_number}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              d.status === 'Available' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-200 dark:bg-slate-700/55 text-indigo-600 dark:text-indigo-300 border border-slate-300 dark:border-slate-600/30'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS (TCO Breakdown & Misc Expenses) */}
          {activeTab === 'financials' && (
            <div className="space-y-8">
              
              {/* TCO Report Table */}
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">TCO & Cost-per-KM Report</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Cost breakdown and efficiency measurements per vehicle in the selected timeframe.</p>
                  </div>
                  <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 w-fit">
                    {['weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFinancialPeriod(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                          financialPeriod === p
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4 text-right">Fuel Costs</th>
                        <th className="py-3 px-4 text-right">Repair Costs</th>
                        <th className="py-3 px-4 text-right">Misc Costs</th>
                        <th className="py-3 px-4 text-right">Total TCO</th>
                        <th className="py-3 px-4 text-right">Distance (km)</th>
                        <th className="py-3 px-4 text-right">Cost/KM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                      {financialReport.vehicles.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">No records found.</td>
                        </tr>
                      ) : (
                        financialReport.vehicles.map((item) => (
                          <tr key={item.vehicle_id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{item.plate_number}</td>
                            <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">₦{item.fuel_cost.toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">₦{item.repair_cost.toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">₦{item.misc_cost.toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">₦{item.total_tco.toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-650 dark:text-slate-400">{item.distance_traveled} km</td>
                            <td className="py-3.5 px-4 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                              {item.cost_per_km > 0 ? `₦${item.cost_per_km.toFixed(2)}/km` : '₦0.00/km'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Misc Expenses Table */}
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Miscellaneous Expense Registry</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Government fines, highway tolls, and operation permits manual logs.</p>
                  </div>
                  <button
                    onClick={() => handleOpenModal('misc')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Misc Expense</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Driver</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Entry Date</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                      {miscExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">No miscellaneous expenses logged.</td>
                        </tr>
                      ) : (
                        miscExpenses.map((exp) => {
                          const vObj = vehicles.find(v => v.id === exp.vehicle_id);
                          const dObj = drivers.find(d => d.id === exp.driver_id);
                          return (
                            <tr key={exp.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                              <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{vObj?.plate_number || `ID: ${exp.vehicle_id}`}</td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{dObj?.full_name || `ID: ${exp.driver_id || 'None'}`}</td>
                              <td className="py-3.5 px-4">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  exp.category === 'Fine' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                  exp.category === 'Toll' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}>
                                  {exp.category}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{exp.description}</td>
                              <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{exp.entry_date}</td>
                              <td className="py-3.5 px-4 text-right text-rose-500 font-bold">₦{exp.amount}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: FUEL LOGS */}
          {activeTab === 'fuel' && (
            <div className="space-y-8">
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fuel Fill-up Logs</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manual fuel usage logging history. Updates vehicle odometer readings automatically.</p>
                  </div>
                  <button
                    onClick={() => handleOpenModal('fuel')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Fuel Fill-Up</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Driver</th>
                        <th className="py-3 px-4">Filling Station</th>
                        <th className="py-3 px-4">Entry Date</th>
                        <th className="py-3 px-4">Odometer Reading</th>
                        <th className="py-3 px-4">Fuel Added</th>
                        <th className="py-3 px-4">Cost</th>
                        <th className="py-3 px-4">Gauge Post-Fill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                      {fuelLogs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">No fuel logs registered. Click "Log Fuel Fill-Up" to record.</td>
                        </tr>
                      ) : (
                        fuelLogs.map((log) => {
                          const vObj = vehicles.find(v => v.id === log.vehicle_id);
                          const dObj = drivers.find(d => d.id === log.driver_id);
                          return (
                            <tr key={log.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                              <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{vObj?.plate_number || `ID: ${log.vehicle_id}`}</td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{dObj?.full_name || `ID: ${log.driver_id || 'N/A'}`}</td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{log.filling_station || 'Unknown'}</td>
                              <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{log.entry_date}</td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">{log.odometer_reading.toLocaleString()} km</td>
                              <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-semibold">{log.fuel_added_liters} Liters</td>
                              <td className="py-3.5 px-4 text-rose-500 font-semibold">₦{log.cost}</td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{log.fuel_gauge_after_fill_percent}%</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Filling Station Expenditures Stats */}
              <div className="glass-panel rounded-2xl p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Filling Station Expenditures</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total spending, fuel purchased, and visit counts aggregated by filling station over the selected period ({financialPeriod}).</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                        <th className="py-3 px-4">Filling Station</th>
                        <th className="py-3 px-4 text-right">Fuel Added (Liters)</th>
                        <th className="py-3 px-4 text-right">Log Count</th>
                        <th className="py-3 px-4 text-right">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                      {fillingStationStats.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">No expenditure records registered in this period.</td>
                        </tr>
                      ) : (
                        fillingStationStats.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{item.filling_station}</td>
                            <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">{item.total_liters.toFixed(2)} L</td>
                            <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300 font-mono">{item.log_count}</td>
                            <td className="py-3.5 px-4 text-right text-rose-500 font-bold">₦{item.total_spent.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance Log Book</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Unscheduled repairs and routine services. Keeps track of workshop states and expenses.</p>
                </div>
                <button
                  onClick={() => handleOpenModal('maintenance')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Maintenance</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Driver</th>
                      <th className="py-3 px-4">Issue Description</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Logged At</th>
                      <th className="py-3 px-4">Resolved At</th>
                      <th className="py-3 px-4 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {maintenanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">No maintenance records registered. Click "Log Maintenance" to add.</td>
                      </tr>
                    ) : (
                      maintenanceLogs.map((log) => {
                        const vObj = vehicles.find(v => v.id === log.vehicle_id);
                        const dObj = drivers.find(d => d.id === log.driver_id);
                        return (
                          <tr key={log.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{vObj?.plate_number || `ID: ${log.vehicle_id}`}</td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{dObj?.full_name || `ID: ${log.driver_id || 'N/A'}`}</td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">{log.issue_description}</td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs font-semibold">{log.type}</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                log.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                log.status === 'In Progress' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                                'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{log.logged_at}</td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{log.resolved_at || '-'}</td>
                            <td className="py-3.5 px-4 text-right text-rose-500 font-semibold">₦{log.cost}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: COMPLIANCE PAPERS */}
          {activeTab === 'compliance' && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compliance & Vehicle Papers</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Licensing papers, insurance contracts, and roadworthiness tracking.</p>
                </div>
                <button
                  onClick={() => handleOpenModal('paper')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Paper Document</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                      <th className="py-3 px-4">Vehicle Plate</th>
                      <th className="py-3 px-4">Document Type</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Status & Countdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {expiringPapers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">All vehicle documentation is fully compliance validated and active.</td>
                      </tr>
                    ) : (
                      expiringPapers.map((paper) => {
                        const isExpired = paper.status === 'Expired';
                        return (
                          <tr key={paper.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{paper.plate_number}</td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold text-xs">{paper.document_type}</td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{paper.expiry_date}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isExpired ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                }`}>
                                  {paper.status}
                                </span>
                                <span className="text-xs text-slate-550 dark:text-slate-400">
                                  ({isExpired ? `${Math.abs(paper.days_remaining)} days overdue` : `${paper.days_remaining} days remaining`})
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* POPUP MODAL & DRAWER SYSTEM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh] text-slate-800 dark:text-slate-100 transition-colors duration-200">
            
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all text-xl font-bold"
            >
              &times;
            </button>

            {/* ALERT BOXES */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-200 text-xs font-semibold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-200 text-xs font-semibold flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM 1: VEHICLE CREATION */}
            {modalType === 'vehicle' && (
              <form onSubmit={handleCreateVehicle} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add New Fleet Vehicle</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enter vehicle specs and initial metrics.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Plate Number *</label>
                    <input
                      type="text" required placeholder="e.g. TX-4523"
                      value={vehicleForm.plate_number}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Make *</label>
                    <input
                      type="text" required placeholder="e.g. Toyota"
                      value={vehicleForm.make}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Model *</label>
                    <input
                      type="text" required placeholder="e.g. Camry"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Year *</label>
                    <input
                      type="number" required
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Initial Odometer (km)</label>
                    <input
                      type="number"
                      value={vehicleForm.current_odometer}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, current_odometer: parseInt(e.target.value) })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Fuel Gauge level (%)</label>
                    <input
                      type="number" min="0" max="100"
                      value={vehicleForm.current_fuel_level_percent}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, current_fuel_level_percent: parseInt(e.target.value) })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Purchase Date *</label>
                  <input
                    type="date" required
                    value={vehicleForm.purchase_date}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, purchase_date: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Initial Status</label>
                  <select
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Faulty">Faulty</option>
                    <option value="In Repair">In Repair</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10"
                >
                  Create Vehicle
                </button>
              </form>
            )}

            {/* FORM 2: DRIVER CREATION */}
            {modalType === 'driver' && (
              <form onSubmit={handleCreateDriver} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add New Driver Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Complete the driver's licensing metadata.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text" required placeholder="e.g. Samuel Jackson"
                    value={driverForm.full_name}
                    onChange={(e) => setDriverForm({ ...driverForm, full_name: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">License Number (Unique) *</label>
                  <input
                    type="text" required placeholder="e.g. DL-98242"
                    value={driverForm.license_number}
                    onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text" required placeholder="e.g. +1 (555) 0182"
                    value={driverForm.phone_number}
                    onChange={(e) => setDriverForm({ ...driverForm, phone_number: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  Create Driver Profile
                </button>
              </form>
            )}

            {/* FORM 3: ALLOCATION */}
            {modalType === 'allocation' && (
              <form onSubmit={handleCreateAllocation} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Assign Driver to Vehicle</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Link an available driver to an active vehicle.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Select Active Vehicle *</label>
                  <select
                    required
                    value={allocationForm.vehicle_id}
                    onChange={(e) => setAllocationForm({ ...allocationForm, vehicle_id: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.filter(v => v.status !== 'In Repair').map(v => (
                      <option key={v.id} value={v.id}>{v.plate_number} ({v.make} {v.model} - Odo: {v.current_odometer}km)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Select Available Driver *</label>
                  <select
                    required
                    value={allocationForm.driver_id}
                    onChange={(e) => setAllocationForm({ ...allocationForm, driver_id: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.filter(d => d.status === 'Available').map(d => (
                      <option key={d.id} value={d.id}>{d.full_name} ({d.license_number})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  Confirm Allocation
                </button>
              </form>
            )}

            {/* FORM 4: LOG FUEL FILL-UP */}
            {modalType === 'fuel' && (
              <form onSubmit={handleCreateFuelLog} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Log Fuel Fill-Up</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Append manual fuel transaction details.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Vehicle *</label>
                    <select
                      required
                      value={fuelForm.vehicle_id}
                      onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate_number} (Current Odo: {v.current_odometer}km)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Driver Attribution</label>
                    <select
                      value={fuelForm.driver_id}
                      onChange={(e) => setFuelForm({ ...fuelForm, driver_id: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Auto-Resolve Driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Filling Station</label>
                  <input
                    type="text" placeholder="e.g. Total, Shell, Mobil"
                    value={fuelForm.filling_station}
                    onChange={(e) => setFuelForm({ ...fuelForm, filling_station: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Entry Date *</label>
                    <input
                      type="date" required
                      value={fuelForm.entry_date}
                      onChange={(e) => setFuelForm({ ...fuelForm, entry_date: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">New Odometer Reading (km) *</label>
                    <input
                      type="number" required placeholder="Must be >= current odometer"
                      value={fuelForm.odometer_reading}
                      onChange={(e) => setFuelForm({ ...fuelForm, odometer_reading: parseInt(e.target.value) })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Fuel Added (Liters) *</label>
                    <input
                      type="number" step="0.01" required placeholder="e.g. 45.50"
                      value={fuelForm.fuel_added_liters}
                      onChange={(e) => setFuelForm({ ...fuelForm, fuel_added_liters: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Total Cost (₦) *</label>
                    <input
                      type="number" step="0.01" required placeholder="e.g. 52.30"
                      value={fuelForm.cost}
                      onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Fuel Gauge Post-Fill (%) *</label>
                  <input
                    type="number" min="0" max="100" required placeholder="e.g. 95"
                    value={fuelForm.fuel_gauge_after_fill_percent}
                    onChange={(e) => setFuelForm({ ...fuelForm, fuel_gauge_after_fill_percent: parseInt(e.target.value) })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  Log Transaction
                </button>
              </form>
            )}

            {/* FORM 5: MAINTENANCE LOGGING */}
            {modalType === 'maintenance' && (
              <form onSubmit={handleCreateMaintenanceLog} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Log Maintenance Action</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Report a fault, log routine service, or resolve repairs.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Vehicle *</label>
                    <select
                      required
                      value={maintenanceForm.vehicle_id}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicle_id: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate_number} ({v.make} {v.model})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Driver Attribution</label>
                    <select
                      value={maintenanceForm.driver_id}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, driver_id: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Auto-Resolve Driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Issue Description *</label>
                  <textarea
                    required placeholder="Describe the fault or details of the routine service"
                    value={maintenanceForm.issue_description}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue_description: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Type *</label>
                    <select
                      value={maintenanceForm.type}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Routine Service">Routine Service</option>
                      <option value="Unscheduled Repair">Unscheduled Repair</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Initial Status</label>
                    <select
                      value={maintenanceForm.status}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Pending">Pending (Sets vehicle Faulty)</option>
                      <option value="In Progress">In Progress (Sets vehicle In Repair)</option>
                      <option value="Resolved">Resolved (Sets vehicle Active)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Log Date *</label>
                    <input
                      type="date" required
                      value={maintenanceForm.logged_at}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, logged_at: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Resolved Date</label>
                    <input
                      type="date"
                      value={maintenanceForm.resolved_at}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, resolved_at: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Service/Repair Cost (₦) *</label>
                  <input
                    type="number" step="0.01" required placeholder="e.g. 150.00"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  Log Maintenance Event
                </button>
              </form>
            )}

            {/* FORM 6: ADD PAPER */}
            {modalType === 'paper' && (
              <form onSubmit={handleCreatePaper} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Vehicle Paper Document</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Log licensing or insurance documents for compliance tracking.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Select Vehicle *</label>
                  <select
                    required
                    value={paperForm.vehicle_id}
                    onChange={(e) => setPaperForm({ ...paperForm, vehicle_id: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate_number} ({v.make} {v.model})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Document Type *</label>
                  <select
                    value={paperForm.document_type}
                    onChange={(e) => setPaperForm({ ...paperForm, document_type: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Insurance">Insurance</option>
                    <option value="Roadworthiness">Roadworthiness</option>
                    <option value="Registration">Registration</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Expiry Date *</label>
                  <input
                    type="date" required
                    value={paperForm.expiry_date}
                    onChange={(e) => setPaperForm({ ...paperForm, expiry_date: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  Create Document Log
                </button>
              </form>
            )}

            {/* FORM 7: LOG MISCELLANEOUS EXPENSE */}
            {modalType === 'misc' && (
              <form onSubmit={handleCreateMiscExpense} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Log Miscellaneous Expense</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Record non-fuel, non-repair operation expenditures (tolls, fines, permits).</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Vehicle *</label>
                    <select
                      required
                      value={miscForm.vehicle_id}
                      onChange={(e) => setMiscForm({ ...miscForm, vehicle_id: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate_number} ({v.make} {v.model})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Driver Attribution</label>
                    <select
                      value={miscForm.driver_id}
                      onChange={(e) => setMiscForm({ ...miscForm, driver_id: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Auto-Resolve Driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Category *</label>
                    <select
                      value={miscForm.category}
                      onChange={(e) => setMiscForm({ ...miscForm, category: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Toll">Toll</option>
                      <option value="Fine">Fine</option>
                      <option value="Permit">Permit</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Amount (₦) *</label>
                    <input
                      type="number" step="0.01" required placeholder="e.g. 15.00"
                      value={miscForm.amount}
                      onChange={(e) => setMiscForm({ ...miscForm, amount: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Expense Date *</label>
                  <input
                    type="date" required
                    value={miscForm.entry_date}
                    onChange={(e) => setMiscForm({ ...miscForm, entry_date: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Description *</label>
                  <input
                    type="text" required placeholder="e.g. Express highway toll fee"
                    value={miscForm.description}
                    onChange={(e) => setMiscForm({ ...miscForm, description: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  Log Miscellaneous Expense
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default App;

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowRightLeft,
  Search,
  Download,
  Bell
} from 'lucide-react';
import DriverProfileDrawer from './components/DriverProfileDrawer';
import VehicleProfileDrawer from './components/VehicleProfileDrawer';
import Login from './components/Login';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8050'
  : '/api/v1'; // Goes through nginx reverse proxy on the server

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('fleetToken') || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [financialPeriod, setFinancialPeriod] = useState('weekly');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lowerQuery = searchQuery.toLowerCase().trim();
  const searchResults = lowerQuery ? [
    ...vehicles.filter(v => (v.plate_number || '').toLowerCase().includes(lowerQuery) || (v.make || '').toLowerCase().includes(lowerQuery)).map(v => ({ type: 'Vehicle', id: v.id, title: v.plate_number, subtitle: `${v.make} ${v.model}` })),
    ...drivers.filter(d => (d.full_name || '').toLowerCase().includes(lowerQuery) || (d.license_number || '').toLowerCase().includes(lowerQuery)).map(d => ({ type: 'Driver', id: d.id, title: d.full_name, subtitle: d.license_number }))
  ].slice(0, 8) : [];

  const handleExportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          setToken(null);
          localStorage.removeItem('fleetToken');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

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
  const [assignments, setAssignments] = useState([]);

  // Modals & Forms State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editId, setEditId] = useState(null); // 'vehicle', 'driver', 'allocation', 'fuel', 'maintenance', 'paper', 'misc'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Field States
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', make: '', model: '', year: 2024, status: 'Active', current_odometer: 0, current_fuel_level_percent: 100, purchase_date: new Date().toISOString().split('T')[0] });
  const [driverForm, setDriverForm] = useState({ full_name: '', license_number: '', phone_number: '', photo_url: '', status: 'Available', allocated_vehicle_id: null });
  const [driverPhotoFile, setDriverPhotoFile] = useState(null);
  const [allocationForm, setAllocationForm] = useState({ vehicle_id: '', driver_id: '' });
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', driver_id: '', entry_date: new Date().toISOString().split('T')[0], odometer_reading: '', fuel_added_liters: '', cost: '', fuel_gauge_after_fill_percent: '', filling_station: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ vehicle_id: '', driver_id: '', issue_description: '', type: 'Routine Service', status: 'Pending', cost: '', logged_at: new Date().toISOString().split('T')[0], resolved_at: '' });
  const [paperForm, setPaperForm] = useState({ vehicle_id: '', document_type: 'Insurance', expiry_date: '' });
  const [miscForm, setMiscForm] = useState({ vehicle_id: '', driver_id: '', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0], category: 'Toll' });

  // Profile Drawer & Assignment State
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ vehicle_id: '', driver_id: '', task_description: '', dispatched_at: new Date().toISOString().slice(0, 16) });

  // Theme Sync Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE}/notifications/`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification read", error);
    }
  };

  // Load Data
  const loadAllData = async () => {
    // Helper to safely fetch and set state
    const fetchSafe = async (url, setter, defaultVal) => {
      try {
        const res = await axios.get(url);
        setter(res.data);
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
        // Don't overwrite existing data on failure, or use defaultVal if we want
      }
    };

    // Fetch all independently to prevent one failure from breaking the whole dashboard
    // and to avoid strictly enforcing Promise.all which fails fast.
    fetchSafe(`${API_BASE}/analytics/dashboard`, setMetrics);
    fetchSafe(`${API_BASE}/vehicles`, setVehicles);
    fetchSafe(`${API_BASE}/drivers`, setDrivers);
    fetchSafe(`${API_BASE}/allocations`, setAllocations);
    fetchSafe(`${API_BASE}/assignments`, setAssignments);
    fetchSafe(`${API_BASE}/compliance/expiring-papers`, setExpiringPapers);
    fetchSafe(`${API_BASE}/analytics/maintenance-recurrent`, setRecurrentMaintenance);
    fetchSafe(`${API_BASE}/analytics/weekly-fuel`, setWeeklyFuel);
    fetchSafe(`${API_BASE}/fuel-logs`, setFuelLogs);
    fetchSafe(`${API_BASE}/maintenance-logs`, setMaintenanceLogs);
    fetchSafe(`${API_BASE}/miscellaneous-expenses`, setMiscExpenses);
    fetchSafe(`${API_BASE}/analytics/financial-report?period=${financialPeriod}`, setFinancialReport);
    fetchSafe(`${API_BASE}/analytics/filling-stations?period=${financialPeriod}`, setFillingStationStats);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('fleetToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (token) {
      loadAllData();
      fetchNotifications();
    }
  }, [token, financialPeriod]);

  // Refresh every 30s
  useEffect(() => {
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, [financialPeriod]);

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenModal = (type, isEdit = false) => {
    if (!isEdit) {
      setEditId(null);
    }
    setModalType(type);
    clearMessages();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    clearMessages();
    setDriverPhotoFile(null);
  };


  // CRUD Helpers
  const handleDelete = async (resource, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${resource}?`)) return;
    try {
      await axios.delete(`${API_BASE}/${resource}s/${id}`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to delete ${resource}.`);
    }
  };

  const handleEditVehicle = (v) => {
    setVehicleForm({
      plate_number: v.plate_number,
      make: v.make,
      model: v.model,
      year: v.year,
      status: v.status,
      current_odometer: v.current_odometer,
      current_fuel_level_percent: v.current_fuel_level_percent,
      purchase_date: v.purchase_date
    });
    setEditId(v.id);
    handleOpenModal('vehicle', true);
  };

  
  const handleEditFuelLog = (log) => {
    setFuelForm({
      vehicle_id: log.vehicle_id,
      driver_id: log.driver_id || '',
      entry_date: log.entry_date,
      odometer_reading: log.odometer_reading,
      fuel_added_liters: log.fuel_added_liters,
      cost: log.cost,
      fuel_gauge_after_fill_percent: log.fuel_gauge_after_fill_percent,
      filling_station: log.filling_station || ''
    });
    setEditId(log.id);
    handleOpenModal('fuel', true);
  };

  const handleEditMaintenanceLog = (log) => {
    setMaintenanceForm({
      vehicle_id: log.vehicle_id,
      driver_id: log.driver_id || '',
      issue_description: log.issue_description,
      type: log.type,
      status: log.status,
      cost: log.cost,
      logged_at: log.logged_at,
      resolved_at: log.resolved_at || ''
    });
    setEditId(log.id);
    handleOpenModal('maintenance', true);
  };

  const handleEditPaper = (paper) => {
    setPaperForm({
      vehicle_id: paper.vehicle_id,
      document_type: paper.document_type,
      expiry_date: paper.expiry_date
    });
    setEditId(paper.id);
    handleOpenModal('paper', true);
  };

  const handleEditMiscExpense = (exp) => {
    setMiscForm({
      vehicle_id: exp.vehicle_id,
      driver_id: exp.driver_id || '',
      amount: exp.amount,
      description: exp.description,
      entry_date: exp.entry_date,
      category: exp.category
    });
    setEditId(exp.id);
    handleOpenModal('misc', true);
  };

  const handleEditDriver = (d) => {
    setDriverForm({
      full_name: d.full_name,
      license_number: d.license_number,
      phone_number: d.phone_number,
      photo_url: d.photo_url || '',
      status: d.status,
      allocated_vehicle_id: d.allocated_vehicle_id || null
    });
    setDriverPhotoFile(null);
    setEditId(d.id);
    handleOpenModal('driver', true);
  };

  // API Call Handlers
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      if (editId) {
        await axios.put(`${API_BASE}/vehicles/${editId}`, vehicleForm);
      } else {
        await axios.post(`${API_BASE}/vehicles`, vehicleForm);
      }
      setSuccessMsg(editId ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');
      setVehicleForm({ plate_number: '', make: '', model: '', year: new Date().getFullYear(), status: 'Active', current_odometer: 0, current_fuel_level_percent: 100, purchase_date: '' });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add vehicle.');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800;
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const payload = { ...driverForm };
      if (!payload.allocated_vehicle_id) delete payload.allocated_vehicle_id;

      let res;
      if (editId) {
        res = await axios.put(`${API_BASE}/drivers/${editId}`, payload);
      } else {
        res = await axios.post(`${API_BASE}/drivers`, payload);
      }

      const driverId = editId || res.data.id;
      
      if (driverPhotoFile) {
        const compressedFile = await compressImage(driverPhotoFile);
        const formData = new FormData();
        formData.append("file", compressedFile);
        await axios.post(`${API_BASE}/drivers/${driverId}/photo`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setSuccessMsg(editId ? 'Driver updated successfully!' : 'Driver added successfully!');
      setDriverForm({ full_name: '', license_number: '', phone_number: '', photo_url: '', status: 'Available', allocated_vehicle_id: null });
      setDriverPhotoFile(null);
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

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_BASE}/assignments`, assignmentForm);
      setSuccessMsg('Vehicle dispatched successfully!');
      setAssignmentForm({ vehicle_id: '', driver_id: '', task_description: '', dispatched_at: new Date().toISOString().slice(0, 16) });
      loadAllData();
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch vehicle.');
    }
  };

  const handleCreateFuelLog = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const payload = { ...fuelForm };
      if (!payload.driver_id) delete payload.driver_id;
      if (editId) {
        await axios.put(`${API_BASE}/fuel-logs/${editId}`, payload);
      } else {
        await axios.post(`${API_BASE}/fuel-logs`, payload);
      }
      setSuccessMsg(editId ? 'Fuel fill-up updated successfully!' : 'Fuel fill-up logged successfully!');
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
      if (editId) {
        await axios.put(`${API_BASE}/maintenance-logs/${editId}`, payload);
      } else {
        await axios.post(`${API_BASE}/maintenance-logs`, payload);
      }
      setSuccessMsg(editId ? 'Maintenance updated successfully!' : 'Maintenance logged successfully!');
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
      if (editId) {
        await axios.put(`${API_BASE}/compliance/papers/${editId}`, paperForm);
      } else {
        await axios.post(`${API_BASE}/compliance/papers`, paperForm);
      }
      setSuccessMsg(editId ? 'Vehicle paper updated successfully!' : 'Vehicle paper added successfully!');
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
      if (editId) {
        await axios.put(`${API_BASE}/miscellaneous-expenses/${editId}`, payload);
      } else {
        await axios.post(`${API_BASE}/miscellaneous-expenses`, payload);
      }
      setSuccessMsg(editId ? 'Miscellaneous expense updated successfully!' : 'Miscellaneous expense logged successfully!');
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

  const handleReturnAssignment = async (assignId) => {
    if (!window.confirm('Mark this dispatch assignment as returned?')) return;
    try {
      await axios.put(`${API_BASE}/assignments/${assignId}`, { returned_at: new Date().toISOString() });
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to return assignment.');
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

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', name: 'Vehicles', icon: Car },
    { id: 'drivers', name: 'Drivers', icon: UserCheck },
    { id: 'financials', name: 'Financials', icon: Coins },
    { id: 'fuel', name: 'Fuel Logs', icon: Fuel },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'compliance', name: 'Compliance', icon: FileText }
  ];

  if (!token) {
    return <Login setToken={setToken} />;
  }

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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    active 
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-transparent' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${active ? 'text-indigo-600 dark:text-indigo-400 scale-110 drop-shadow-sm' : 'text-slate-400 dark:text-slate-400'}`} />
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
        <header className="relative z-50 h-16 border-b border-slate-200 dark:border-slate-800/60 px-8 flex items-center justify-between shrink-0 bg-white/70 dark:bg-slate-900/30 backdrop-blur-md transition-colors duration-200">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize w-48">{activeTab}</h1>
          
          <div className="flex-1 max-w-md mx-4 relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10" />
            <input 
              type="text" 
              placeholder="Search vehicles or drivers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all relative z-10"
            />
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <ul className="max-h-64 overflow-y-auto">
                    {searchResults.map((res, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            if (res.type === 'Vehicle') setSelectedVehicleId(res.id);
                            if (res.type === 'Driver') setSelectedDriverId(res.id);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          <div className={`p-2 rounded-lg mr-3 ${res.type === 'Vehicle' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
                            {res.type === 'Vehicle' ? <Car className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{res.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{res.subtitle}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No results found</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 z-50 overflow-hidden backdrop-blur-xl">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Alerts</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                      {notifications.length} Unread
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">All caught up!</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex items-start space-x-3 group cursor-pointer" onClick={() => markNotificationAsRead(notif.id)}>
                          <div className={`p-2 rounded-lg shrink-0 ${
                            notif.type === 'Critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 
                            notif.type === 'Warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 
                            'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                          }`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-snug">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.created_at + 'Z').toLocaleString()}
                            </span>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 transition-opacity">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shadow-sm border border-rose-100 dark:border-rose-500/20"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Theme Toggle Button */}
            <button 
              onClick={loadAllData}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-sm hover:shadow-md mr-2"
              title="Refresh Data"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
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
                
                {/* Driver Dispatch History */}
                <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Driver Dispatch History</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Vehicle assignments for specific daily movements or logistics tasks.</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal('assignment')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dispatch Vehicle</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                            <th className="py-3 px-2">Vehicle</th>
                            <th className="py-3 px-2">Driver</th>
                            <th className="py-3 px-2">Task</th>
                            <th className="py-3 px-2">Dispatched</th>
                            <th className="py-3 px-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                          {assignments.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-6 text-center text-slate-500 text-xs">No dispatch history found.</td>
                            </tr>
                          ) : (
                            assignments.map((assignment) => (
                              <tr key={assignment.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                                <td className="py-3 px-2 font-semibold text-indigo-600 dark:text-indigo-400">{assignment.vehicle_plate}</td>
                                <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{assignment.driver_name}</td>
                                <td className="py-3 px-2 text-slate-600 dark:text-slate-400 max-w-[150px] truncate">{assignment.task_description || '-'}</td>
                                <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs">{new Date(assignment.dispatched_at).toLocaleString()}</td>
                                <td className="py-3 px-2 text-right">
                                  {assignment.returned_at ? (
                                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md">Returned {new Date(assignment.returned_at).toLocaleDateString()}</span>
                                  ) : (
                                    <button onClick={() => handleReturnAssignment(assignment.id)} className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-400 px-2 py-1 rounded-md font-semibold animate-pulse transition-colors cursor-pointer border border-amber-200 dark:border-amber-500/30 shadow-sm">Return</button>
                                  )}
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
                        const isValid = paper.status === 'Valid';
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
                                  isValid ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : isExpired ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
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
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">No vehicles registered. Click "New Vehicle" to create.</td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30 cursor-pointer" onClick={() => setSelectedVehicleId(v.id)}>
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
                          <td className="py-3.5 px-4 text-right space-x-3">
                            <button onClick={(e) => { e.stopPropagation(); handleEditVehicle(v); }} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">Edit</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete('vehicle', v.id); }} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-semibold text-xs">Delete</button>
                          </td>
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
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500 text-xs">No drivers registered. Click "New Driver" to create.</td>
                      </tr>
                    ) : (
                      drivers.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30 cursor-pointer" onClick={() => setSelectedDriverId(d.id)}>
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
                          <td className="py-3.5 px-4 text-right space-x-3">
                            <button onClick={(e) => { e.stopPropagation(); handleEditDriver(d); }} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">Edit</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete('driver', d.id); }} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-semibold text-xs">Delete</button>
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
                  <div className="flex items-center space-x-4">
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 w-fit">
                      {['weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setFinancialPeriod(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                            financialPeriod === p
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleExportCSV(financialReport.vehicles, 'financial_report.csv')}
                      className="bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 dark:hover:bg-indigo-500/30 px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
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
                          <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">No records found.</td>
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
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                      {miscExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">No miscellaneous expenses logged.</td>
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
                              <td className="py-3.5 px-4 text-right space-x-3">
                                <button onClick={() => handleEditMiscExpense(exp)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">Edit</button>
                                <button onClick={() => handleDelete('miscellaneous-expense', exp.id)} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-semibold text-xs">Delete</button>
                              </td>
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
                    <span>{editId ? 'Update Fuel Log' : 'Log Fuel Fill-Up'}</span>
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
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                      {fuelLogs.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-8 text-center text-slate-500 text-xs">No fuel logs registered. Click "{editId ? 'Update Fuel Log' : 'Log Fuel Fill-Up'}" to record.</td>
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
                              <td className="py-3.5 px-4 text-right space-x-3">
                                <button onClick={() => handleEditFuelLog(log)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">Edit</button>
                                <button onClick={() => handleDelete('fuel-log', log.id)} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-semibold text-xs">Delete</button>
                              </td>
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
                          <td colSpan="5" className="py-8 text-center text-slate-500 text-xs">No expenditure records registered in this period.</td>
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
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {maintenanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-slate-500 text-xs">No maintenance records registered. Click "Log Maintenance" to add.</td>
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
                            <td className="py-3.5 px-4 text-right space-x-3">
                              <button onClick={() => handleEditMaintenanceLog(log)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">Edit</button>
                              <button onClick={() => handleDelete('maintenance-log', log.id)} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-semibold text-xs">Delete</button>
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
                      <th className="py-3 px-4">Make & Model</th>
                      <th className="py-3 px-4">Document Type</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Status & Countdown</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                    {expiringPapers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">All vehicle documentation is fully compliance validated and active.</td>
                      </tr>
                    ) : (
                      expiringPapers.map((paper) => {
                        const isExpired = paper.status === 'Expired';
                        const isValid = paper.status === 'Valid';
                        return (
                          <tr key={paper.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{paper.plate_number}</td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium text-xs">{paper.make_model || 'N/A'}</td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold text-xs">{paper.document_type}</td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{paper.expiry_date}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isValid ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : isExpired ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                }`}>
                                  {paper.status}
                                </span>
                                <span className="text-xs text-slate-550 dark:text-slate-400">
                                  ({isExpired ? `${Math.abs(paper.days_remaining)} days overdue` : `${paper.days_remaining} days remaining`})
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-3">
                              <button onClick={() => handleEditPaper(paper)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-xs">Edit</button>
                              <button onClick={() => handleDelete('compliance/paper', paper.id)} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-semibold text-xs">Delete</button>
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{editId ? 'Edit Fleet Vehicle' : 'Add New Fleet Vehicle'}</h3>
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
                  {editId ? 'Update Vehicle' : 'Create Vehicle'}
                </button>
              </form>
            )}

            {/* FORM 2: DRIVER CREATION */}
            {modalType === 'driver' && (
              <form onSubmit={handleCreateDriver} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{editId ? 'Edit Driver' : 'Add New Driver'} Profile</h3>
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
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Driver Photo</label>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setDriverPhotoFile(e.target.files[0]);
                      }
                    }}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {driverForm.photo_url && !driverPhotoFile && (
                     <p className="text-[10px] text-slate-500 mt-1">Current photo: {driverForm.photo_url.split('/').pop()}</p>
                  )}
                  {driverPhotoFile && (
                     <p className="text-[10px] text-indigo-500 mt-1">Selected: {driverPhotoFile.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Status</label>
                  <select
                    value={driverForm.status}
                    onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Available">Available</option>
                    <option value="On Leave">On Leave</option>
                    <option value="On Assignment">On Assignment</option>
                    <option value="On Site">On Site</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Permanently Allocated Vehicle</label>
                  <select
                    value={driverForm.allocated_vehicle_id || ''}
                    onChange={(e) => setDriverForm({ ...driverForm, allocated_vehicle_id: e.target.value || null })}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- No Allocation --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  {editId ? 'Update Driver' : 'Create Driver'} Profile
                </button>
              </form>
            )}

            {/* FORM: DISPATCH VEHICLE (ASSIGNMENT) */}
            {modalType === 'assignment' && (
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Dispatch Vehicle (Assignment)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Assign a vehicle to a driver for a specific task or logistics route.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Select Vehicle *</label>
                  <select required value={assignmentForm.vehicle_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, vehicle_id: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white">
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Select Driver *</label>
                  <select required value={assignmentForm.driver_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, driver_id: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white">
                    <option value="">-- Choose Driver --</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Dispatch Date/Time *</label>
                  <input type="datetime-local" required value={assignmentForm.dispatched_at} onChange={(e) => setAssignmentForm({ ...assignmentForm, dispatched_at: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-1">Task Description</label>
                  <input type="text" placeholder="e.g. Delivery to Lagos Island" value={assignmentForm.task_description} onChange={(e) => setAssignmentForm({ ...assignmentForm, task_description: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all">Dispatch Vehicle</button>
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{editId ? 'Update Fuel Log' : 'Log Fuel Fill-Up'}</h3>
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
                  {editId ? 'Update Maintenance Event' : 'Log Maintenance Event'}
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
                    <option value="LG papers">LG papers</option>
                    <option value="Proof of Ownership">Proof of Ownership</option>
                    <option value="Vehicle License">Vehicle License</option>
                    <option value="Hackney permit">Hackney permit</option>
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{editId ? 'Update Misc Expense' : 'Log Miscellaneous Expense'}</h3>
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
                  {editId ? 'Update Misc Expense' : 'Log Miscellaneous Expense'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {selectedDriverId && (
        <DriverProfileDrawer driverId={selectedDriverId} onClose={() => setSelectedDriverId(null)} apiBase={API_BASE} />
      )}
      {selectedVehicleId && (
        <VehicleProfileDrawer vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} apiBase={API_BASE} />
      )}

    </div>
  );
}

export default App;

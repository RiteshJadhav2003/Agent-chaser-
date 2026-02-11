import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [admin, setAdmin] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Local Timer State
  const [currentTime, setCurrentTime] = useState(new Date());

  // ---------------------------------------------------------
  // 1. AUTH & FETCH
  // ---------------------------------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { navigate('/login'); return; }

    const userData = JSON.parse(storedUser);
    if (!userData.isAdmin) { navigate('/employee-dashboard'); return; }

    setAdmin(userData);
    fetchEmployees();

    if (location.state?.refresh) {
        fetchEmployees();
    }
  }, [navigate, location.state]);

  // ---------------------------------------------------------
  // 2. LIVE TIMER
  // ---------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------
  // 3. API FETCH
  // ---------------------------------------------------------
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const API_URL = "https://asia-south1.workflow.boltic.app/df29281f-454c-485f-91e8-18337e8996b2";

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        const onlyEmployees = result.data.filter(user => user.isAdmin === false);
        setEmployees(onlyEmployees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAssignTask = (employee) => {
    const safePhone = employee.phoneNo || employee.phone || "";
    const empWithPhone = { ...employee, phone: safePhone };
    navigate('/assign-task', { state: { employee: empWithPhone } });
  };

  // ---------------------------------------------------------
  // 4. "VISUAL MATCH" DATE PARSER
  // ---------------------------------------------------------
  const parseDateSmart = (dateStr) => {
    if (!dateStr) return null;

    try {
        const parts = dateStr.split(/[^0-9]/).filter(p => p !== "");
        if (parts.length < 5) return new Date(dateStr); 

        let year, month, day, hours, minutes;

        // Detect Format (ISO/Year-First vs Day-First)
        if (parts[0].length === 4) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
        } else {
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
            year = parseInt(parts[2]);
        }

        hours = parseInt(parts[3]);
        minutes = parseInt(parts[4]);

        const isPM = dateStr.toUpperCase().includes("PM");
        const isAM = dateStr.toUpperCase().includes("AM");

        if (isPM && hours !== 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        return new Date(year, month - 1, day, hours, minutes, 0);

    } catch (e) {
        console.error("Date Parse Error:", e);
        return null;
    }
  };

  // ---------------------------------------------------------
  // 5. RENDER THE TIMER OR BUTTON
  // ---------------------------------------------------------
  const renderActionOrTimer = (employee) => {
    const hasTaskText = employee.task && employee.task.trim() !== "";
    
    if (!hasTaskText) {
        return (
            <button
                onClick={() => handleAssignTask(employee)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition w-full sm:w-auto"
            >
                Assign Task
            </button>
        );
    }

    const deadlineDate = parseDateSmart(employee.deadline);
    
    // Safety Check
    if (!deadlineDate || isNaN(deadlineDate)) {
         return (
            <div className="flex flex-col items-end">
                <span className="text-xs text-red-500 font-bold">Invalid Deadline</span>
                <button onClick={() => handleAssignTask(employee)} className="mt-1 text-xs text-indigo-600 underline">
                    Re-assign
                </button>
            </div>
         );
    }

    // -----------------------------------------------------
    // 🔧 FIX: ADD 1 MINUTE BUFFER
    // This gives the database/workflow time to process before we show "Expired"
    // -----------------------------------------------------
    deadlineDate.setMinutes(deadlineDate.getMinutes() + 1);

    const diffMs = deadlineDate - currentTime;

    // EXPIRED
    if (diffMs <= 0) {
        return (
            <div className="flex flex-col items-end animate-fadeIn">
                <span className="mb-2 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                    🚫 Task Expired
                </span>
                <button
                    onClick={() => handleAssignTask(employee)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition"
                >
                    Assign New Task
                </button>
            </div>
        );
    }

    // ACTIVE COUNTDOWN
    const totalSeconds = Math.floor(diffMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    const h = Math.floor(m / 60);
    const displayM = m % 60;

    let timeString = `${m}m ${s}s`;
    if (h > 0) timeString = `${h}h ${displayM}m ${s}s`;

    return (
        <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm flex items-center gap-2">
                ⏳ {timeString} Left
            </span>
            <span className="text-xs text-gray-400 mt-1">
                Ends at: {deadlineDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>
    );
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
              Chaser Agent
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm font-medium hidden sm:block">
                Hi, {admin.name}
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition border border-red-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Employee Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Manage tasks and track live deadlines.</p>
          </div>
          <button 
            onClick={() => fetchEmployees()} 
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            Refresh Data 🔄
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center text-gray-500 animate-pulse">Loading team data...</div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No regular employees found.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {employees.map((emp, index) => {
                const displayPhone = emp.phoneNo || emp.phone;
                const hasTask = emp.task && emp.task.trim() !== "";
                
                return (
                  <li key={index} className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition duration-150 group">
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {emp.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            hasTask ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                            {hasTask ? 'Active' : 'Idle'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                        <span>ID: #{emp.userId || emp.id}</span>
                        {displayPhone && <span>📞 {displayPhone}</span>}
                        <span className="text-gray-400">|</span>
                        <span>📧 {emp.email}</span>
                      </div>

                      {hasTask && (
                          <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 inline-block max-w-full">
                             <span className="text-gray-400 text-xs font-bold uppercase mr-2">Current Task:</span>
                             <span className="text-gray-700 text-sm font-medium">{emp.task}</span>
                          </div>
                      )}
                    </div>

                    <div className="mt-4 md:mt-0 md:pl-4 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 flex justify-end min-w-[180px]">
                      {renderActionOrTimer(emp)}
                    </div>

                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
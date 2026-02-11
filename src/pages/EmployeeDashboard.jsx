import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // 1. Local Timer State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Ref to track previous task to trigger "New Task" alerts
  const previousTaskRef = useRef(null);

  useEffect(() => {
    // ----------------------------------------------------
    // STEP 1: LOAD USER & FETCH ONCE
    // ----------------------------------------------------
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      navigate('/login');
      return;
    }

    let localUserData;
    try {
      localUserData = JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    setEmployee(localUserData);
    previousTaskRef.current = localUserData.task; // Track initial task
    setLoading(false);

    // Fetch Data ONCE
    fetchMyLatestData(localUserData.email);

  }, [navigate]);

  // ---------------------------------------------------------
  // STEP 2: LIVE TIMER
  // ---------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------
  // STEP 3: API FETCH
  // ---------------------------------------------------------
  const fetchMyLatestData = async (myEmail) => {
    try {
      const API_URL = `https://asia-south1.workflow.boltic.app/df29281f-454c-485f-91e8-18337e8996b2`;
      
      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        const freshUser = result.data.find(u => u.email.toLowerCase() === myEmail.toLowerCase());
        
        if (freshUser) {
          setLastUpdated(new Date().toLocaleTimeString());

          const oldTask = previousTaskRef.current;
          const newTask = freshUser.task;

          if (newTask && newTask !== oldTask) {
             alert(`🔔 NEW TASK ASSIGNED!\n\nTask: ${newTask}\nCheck the deadline immediately.`);
          }

          previousTaskRef.current = newTask; 
          setEmployee(freshUser); 
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      }
    } catch (error) {
      console.error("❌ Error updating user data:", error);
    }
  };

  // ---------------------------------------------------------
  // STEP 4: BULLETPROOF DATE PARSER
  // ---------------------------------------------------------
  const parseDateSmart = (dateStr) => {
    if (!dateStr) return null;

    try {
        const parts = dateStr.split(/[^0-9]/).filter(p => p !== "");
        if (parts.length < 5) return new Date(dateStr);

        let year, month, day, hours, minutes;

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
  // HELPER: Check if Task is Expired
  // ---------------------------------------------------------
  const isTaskExpired = () => {
      if (!employee || !employee.deadline) return false;
      const deadlineDate = parseDateSmart(employee.deadline);
      if (!deadlineDate || isNaN(deadlineDate)) return false;
      return (deadlineDate - currentTime) <= 0;
  };

  // ---------------------------------------------------------
  // STEP 5: RENDER COUNTDOWN
  // ---------------------------------------------------------
  const renderCountdown = () => {
     if (!employee.task || !employee.deadline) return null;

     // IF EXPIRED: Return NULL (Hidden) so we don't show a timer
     if (isTaskExpired()) {
         return null; 
     }

     const deadlineDate = parseDateSmart(employee.deadline);
     const diffMs = deadlineDate - currentTime;

     // ACTIVE
     const totalSeconds = Math.floor(diffMs / 1000);
     const m = Math.floor(totalSeconds / 60);
     const s = totalSeconds % 60;
     const h = Math.floor(m / 60);
     const displayM = m % 60;

     let timeString = `${m}m ${s}s`;
     if (h > 0) timeString = `${h}h ${displayM}m ${s}s`;

     return (
        <div className="mt-4">
            <dt className="text-sm font-medium text-gray-500">Time Remaining</dt>
            <dd className="mt-1 flex items-center">
                <span className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xl font-bold shadow-md">
                    ⏳ {timeString}
                </span>
            </dd>
            <dd className="mt-1 text-xs text-gray-400">
                Due by: {deadlineDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </dd>
        </div>
     );
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Dashboard...</div>
        </div>
    );
  }

  if (!employee) return null;

  // ---------------------------------------------------------
  // DYNAMIC UI LOGIC
  // ---------------------------------------------------------
  const expired = isTaskExpired();
  const hasActiveTask = employee.task && !expired;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
           <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                Chaser Agent
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right mr-4">
                 <p className="text-sm font-medium text-gray-900">Welcome, {employee.name} 👋</p>
              </div>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          
          <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <div>
                <h3 className="text-lg leading-6 font-bold text-gray-900">Your Assignment</h3>
                <p className="mt-1 max-w-2xl text-xs text-gray-500">
                  Last sync: {lastUpdated || "Just now"}
                </p>
            </div>
            <button 
                onClick={() => fetchMyLatestData(employee.email)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition"
            >
                Refresh Task 🔄
            </button>
          </div>
          
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              
              {/* TASK DESCRIPTION */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Task Description</dt>
                <dd className="mt-2 text-base text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-inner">
                  {/* LOGIC: If task exists AND NOT expired -> Show Task. Else -> Show 'Free' */}
                  {hasActiveTask ? (
                      employee.task
                  ) : expired ? (
                      <span className="text-red-500 italic font-medium">⚠️ Deadline Expired. Task Closed.</span>
                  ) : (
                      <span className="text-gray-400 italic">🎉 No active tasks. You are free!</span>
                  )}
                </dd>
              </div>

              {/* COUNTDOWN TIMER (Hidden if Expired) */}
              <div className="sm:col-span-1">
                 {renderCountdown()}
              </div>

              {/* STATUS BADGE */}
              <div className="sm:col-span-1 flex flex-col items-start sm:items-end justify-center">
                <dt className="text-sm font-medium text-gray-500 mb-1">Current Status</dt>
                <dd>
                  {hasActiveTask ? (
                    <span className="px-3 py-1 inline-flex text-sm font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        🚀 In Progress
                    </span>
                  ) : expired ? (
                    <span className="px-3 py-1 inline-flex text-sm font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                        🚫 Expired
                    </span>
                  ) : (
                    <span className="px-3 py-1 inline-flex text-sm font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                        💤 Idle
                    </span>
                  )}
                </dd>
              </div>

            </dl>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
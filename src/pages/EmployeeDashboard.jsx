// src/pages/EmployeeDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Ref to track previous deadline for alerts
  const employeeRef = useRef(null);

  useEffect(() => {
    // ----------------------------------------------------
    // STEP 1: LOAD USER FROM LOCAL STORAGE
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

    // Set initial data immediately so user sees something
    setEmployee(localUserData);
    employeeRef.current = localUserData;
    setLoading(false);

    // ----------------------------------------------------
    // STEP 2: START LIVE UPDATES (Using the "Get All" URL)
    // ----------------------------------------------------
    
    // Call immediately
    fetchMyLatestData(localUserData.email);

    // Poll every 5 seconds
    const interval = setInterval(() => {
        fetchMyLatestData(localUserData.email);
    }, 5000);

    return () => clearInterval(interval);

  }, [navigate]);

  // Sync Ref whenever state updates
  useEffect(() => {
    if (employee) {
        employeeRef.current = employee;
    }
  }, [employee]);

  const fetchMyLatestData = async (myEmail) => {
    try {
      // 👇 TRICK: Use the working "Get All Employees" URL from Admin Dashboard
      // We add a random time (?_t=...) to force the browser to get fresh data
      const API_URL = `https://asia-south1.workflow.boltic.app/a5ee752b-0198-4d31-a3ef-c2831426c2c8?_t=${new Date().getTime()}`;
      
      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        // 👇 LOGIC: We fetched EVERYONE, now we find ONLY ME
        const freshUser = result.data.find(u => u.email === myEmail);
        
        if (freshUser) {
          // Update timestamp
          setLastUpdated(new Date().toLocaleTimeString());

          // 🔔 Check for Deadline Change (Alert Logic)
          const oldDeadline = employeeRef.current?.deadline;
          const newDeadline = freshUser.deadline;

          // Alert if deadline dropped (and is valid)
          if (oldDeadline !== undefined && newDeadline !== undefined && newDeadline < oldDeadline) {
             setTimeout(() => {
                 alert(`⏳ Time Update! Deadline dropped to ${newDeadline} days!`);
             }, 500);
          }

          // Update State & LocalStorage
          setEmployee(freshUser); 
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-xl font-semibold text-gray-600 animate-pulse">
                Loading Dashboard...
            </div>
        </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- MODIFIED NAVBAR --- */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left: Chaser Agent Logo (Matches Home Page) */}
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
                Chaser Agent
              </h1>
            </div>

            {/* Right: Logout Button Only */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right mr-4">
                 <p className="text-sm font-medium text-gray-900">Welcome, {employee.name} 👋</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Your Assigned Task</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Last checked: {lastUpdated || "Just now"}
                </p>
            </div>
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Task Description</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {employee.task || <span className="text-gray-400 italic">No task assigned.</span>}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                <dd className={`mt-1 text-3xl font-bold ${employee.deadline <= 1 ? 'text-red-600' : 'text-blue-600'}`}>
                  {employee.deadline !== null && employee.deadline !== undefined ? `${employee.deadline} Days` : "N/A"}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  {employee.task ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">In Progress</span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Idle</span>
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
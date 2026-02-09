import React, { useState, useEffect } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';



const AdminDashboard = () => {

  const navigate = useNavigate();

  const location = useLocation(); // Used to detect if we just came from Assign Task page

 

  const [admin, setAdmin] = useState(null);

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);



  // 1. Authentication & Auto-Refresh Logic

  useEffect(() => {

    const storedUser = localStorage.getItem('user');

   

    // Auth Check

    if (!storedUser) { navigate('/login'); return; }

    const userData = JSON.parse(storedUser);

    if (!userData.isAdmin) { navigate('/employee-dashboard'); return; }



    setAdmin(userData);



    // Initial Fetch

    fetchEmployees();



    // 🔄 START POLLING: Fetch data every 5 seconds

    const interval = setInterval(() => {

        fetchEmployees(true); // true = silent refresh (don't show spinner)

    }, 5000);



    // Cleanup: Stop the timer when we leave the page

    return () => clearInterval(interval);



  }, [navigate]);



  // 2. Fetch Function (Updated for Silent Refresh)

  const fetchEmployees = async (isBackground = false) => {

    try {

      // Only show big loading spinner on the very first load

      if (!isBackground) setLoading(true);



      const API_URL = "https://asia-south1.workflow.boltic.app/a5ee752b-0198-4d31-a3ef-c2831426c2c8";

      // console.log("Fetching employees..."); // Uncomment for debugging



      const response = await fetch(API_URL, {

        method: 'GET',

        headers: { 'Content-Type': 'application/json' }

      });



      const result = await response.json();

     

      if (result.data && Array.isArray(result.data)) {

        // Filter out admins

        const onlyEmployees = result.data.filter(user => user.isAdmin === false);

        setEmployees(onlyEmployees);

      }



    } catch (error) {

      console.error("Error fetching employees:", error);

    } finally {

      // Always turn off loading after request finishes

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



  if (!admin) return null;



  return (

    <div className="min-h-screen bg-gray-100">

     

      {/* Navbar */}

      <nav className="bg-white shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between h-16 items-center">

            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>

            <div className="flex items-center space-x-4">

              <span className="text-gray-700 font-medium">Welcome, {admin.name} 👋</span>

              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition">

                Logout

              </button>

            </div>

          </div>

        </div>

      </nav>



      {/* Main Content */}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        <div className="px-4 py-4 sm:px-0 flex justify-between items-center">

          <h2 className="text-2xl font-semibold text-gray-800">Employee Overview</h2>

          <span className="text-sm text-gray-400">Auto-refreshing every 5s... ⏳</span>

        </div>



        <div className="bg-white shadow overflow-hidden sm:rounded-md">

          {loading ? (

            <div className="p-10 text-center text-gray-500">Loading employees...</div>

          ) : employees.length === 0 ? (

            <div className="p-10 text-center text-gray-500">No regular employees found.</div>

          ) : (

            <ul className="divide-y divide-gray-200">

              {employees.map((emp, index) => {

               

                const displayPhone = emp.phoneNo || emp.phone;

                // Check if task exists and is not empty

                const hasTask = emp.task && emp.task.trim() !== "";

                // Handle Deadline (avoid showing null/undefined)

                const deadline = emp.deadline ? emp.deadline : 0;



                return (

                  <li key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">

                   

                    {/* Left: Info */}

                    <div>

                      <p className="text-lg font-medium text-gray-900">{emp.name}</p>

                      <div className="mt-1 flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-500">

                        <p><span className="font-semibold text-gray-600">Emp ID:</span> {emp.userId || emp.id}</p>

                        {displayPhone && (

                          <p><span className="font-semibold text-gray-600">Phone:</span> {displayPhone}</p>

                        )}

                      </div>

                     

                      {/* Live Task Preview */}

                      {hasTask && (

                         <div className="mt-2 text-sm">

                            <span className="text-gray-800 font-semibold">Current Task: </span>

                            <span className="text-gray-600 italic">{emp.task}</span>

                            <span className="ml-3 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">

                                Deadline: {deadline} days left

                            </span>

                         </div>

                      )}

                    </div>

                   

                    {/* Right: Button Logic */}

                    <div>

                      {!hasTask ? (

                        <button

                          onClick={() => handleAssignTask(emp)}

                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition"

                        >

                          Assign Task

                        </button>

                      ) : (

                        <div className="flex flex-col items-end space-y-1">

                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">

                            ✅ Assigned

                            </span>

                            {deadline <= 0 && (

                                <span className="text-xs text-red-500 font-bold animate-pulse">

                                    Time Expiring Soon!

                                </span>

                            )}

                        </div>

                      )}

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

};export default AdminDashboard;
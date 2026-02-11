import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AssignTaskPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { employee } = location.state || {}; 
  const [admin, setAdmin] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [deadlineMinutes, setDeadlineMinutes] = useState('5'); // Default 5 mins
  const [submitting, setSubmitting] = useState(false);

  // 1. UPDATED: Use Proxy URL to avoid CORS errors
  const DEADLINE_WORKFLOW_URL = "/boltic-api/service/webhook/temporal/v1.0/b7cc53d1-89ba-4b48-b965-971024cff90a/workflows/execute/1f1c2788-1aaa-45bb-ac03-df607787b62b";

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { navigate('/login'); return; }
    
    const userData = JSON.parse(storedUser);
    if (!userData.isAdmin) { navigate('/employee-dashboard'); return; }
    
    setAdmin(userData);
    if (!employee) {
        alert("No employee selected. Redirecting to Dashboard.");
        navigate('/admin-dashboard');
    }
  }, [navigate, employee]);

  // --- HELPER 1: Format for Database (ISO FORMAT: YYYY-MM-DD) ---
  const formatDateForDB = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strHours = String(hours).padStart(2, '0'); 

    return `${year}-${month}-${day} ${strHours}:${minutes} ${ampm}`;
  };

  // --- HELPER 2: Format for Workflow (WITH Seconds) ---
  const formatDateForWorkflow = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = "00";
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strHours = String(hours).padStart(2, '0'); 

    return `${day}-${month}-${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
  };

  // --- NEW: Handle Deadline Change (Strict 1-5 Integer) ---
  const handleDeadlineChange = (e) => {
    let val = e.target.value;

    // 1. Allow empty string so user can delete and retype
    if (val === '') {
        setDeadlineMinutes('');
        return;
    }

    // 2. Parse as integer (removes decimals effectively if typed)
    let num = parseInt(val, 10);

    // 3. Enforce Max 5
    if (num > 5) num = 5;
    
    // 4. Enforce Min 1 (Zero not allowed)
    if (num < 1) num = 1;

    setDeadlineMinutes(String(num));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // 1. Clean Phone Number
    let rawPhone = employee.phoneNo || employee.phone || "";
    let cleanPhone = rawPhone.replace(/\s+/g, '').replace(/-/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }

    // 2. CALCULATE DATES
    const now = new Date();
    // Double check valid integer before submitting
    const duration = parseInt(deadlineMinutes) || 5; 
    const deadlineDate = new Date(now.getTime() + duration * 60000);

    // ------------------------------------------------------------------
    // 🔧 VISUAL FIX: Calculate "Alert Time" (+1 Min Buffer)
    // This matches the buffer we added to the Admin Dashboard display.
    // ------------------------------------------------------------------
    const alertDate = new Date(deadlineDate.getTime() + 60000); // Add 1 Min
    const alertDeadlineStr = formatDateForDB(alertDate); // Format for Alert

    // 3. GENERATE STRINGS (For Actual DB/API - Unchanged)
    const dbCurrentStr = formatDateForDB(now);       
    const dbDeadlineStr = formatDateForDB(deadlineDate); // Sends EXACT time

    const wfCurrentStr = formatDateForWorkflow(now);
    const wfDeadlineStr = formatDateForWorkflow(deadlineDate); // Sends EXACT time

    console.log("🚀 DB Dates (ISO):", { current: dbCurrentStr, deadline: dbDeadlineStr });
    console.log("🚀 Workflow Dates:", { current: wfCurrentStr, deadline: wfDeadlineStr });

    // 4. Construct Payload
    const dbPayload = {
      email: employee.email, 
      phoneNo: cleanPhone,
      userId: employee.userId || employee.id,
      task: taskDescription,
      deadline: dbDeadlineStr, 
      currenttime: dbCurrentStr, 
      status: "Assigned" 
    };

    try {
      const UPDATE_API_URL = "https://asia-south1.workflow.boltic.app/e88cac90-d499-43f7-ab76-c74984fb6afd"; 
      
      const response = await fetch(UPDATE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbPayload),
      });

      if (response.ok) {
        try {
            console.log("⏳ Triggering Deadline Workflow...");
            await fetch(DEADLINE_WORKFLOW_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: employee.email,
                    phoneNo: cleanPhone,
                    deadline: wfDeadlineStr,   
                    currenttime: wfCurrentStr 
                })
            });
            console.log("✅ Deadline Workflow Started!");
        } catch (wfError) {
            console.warn("⚠️ Workflow trigger failed (but task saved):", wfError);
        }

        // ------------------------------------------------------------------
        // 🔔 MODIFIED ALERT: Shows the buffered time (+1 min)
        // ------------------------------------------------------------------
        alert(`✅ Task assigned! Ends at: ${alertDeadlineStr}`);
        
        navigate('/admin-dashboard', { state: { refresh: true } });

      } else {
        const errorData = await response.json();
        alert(`⚠️ Task update failed: ${errorData?.error?.message || "Check format"}`);
      }

    } catch (error) {
      console.error("Assign Error:", error);
      alert("⚠️ Network Error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!admin || !employee) return null;

  const displayPhone = employee.phoneNo || employee.phone || "N/A";

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            <button onClick={() => { localStorage.removeItem('user'); navigate('/login'); }} className="text-red-500 font-medium">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign Task</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
          
            <div>
                <label className="block text-sm font-medium text-gray-700">Employee Email</label>
                <input type="email" value={employee.email} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Employee Phone</label>
                <input type="text" value={displayPhone} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500" />
            </div>
         
            <div>
                <label className="block text-sm font-medium text-gray-700">Task</label>
                <textarea rows="4" required value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>

            {/* UPDATED DEADLINE INPUT */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Deadline (Minutes)</label>
                <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    step="1" // Hints UI to use integers
                    required 
                    value={deadlineMinutes} 
                    onChange={handleDeadlineChange}
                    onKeyDown={(e) => {
                        // Prevent decimals and negative signs
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault();
                        }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" 
                    placeholder="Enter minutes (1-5)"
                />
                <p className="text-xs text-gray-500 mt-1">Allowed: 1 to 5 minutes.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => navigate('/admin-dashboard')} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{submitting ? 'Assigning...' : 'Assign Task'}</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AssignTaskPage;
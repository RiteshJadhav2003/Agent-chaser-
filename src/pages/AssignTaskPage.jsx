import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AssignTaskPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { employee } = location.state || {}; 
  const [admin, setAdmin] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 👇 YOUR DEADLINE WORKFLOW URL
  const DEADLINE_WORKFLOW_URL = "https://asia-south1.api.boltic.io/service/webhook/temporal/v1.0/dbada971-3256-44e8-8531-d6d99c670580/workflows/execute/d034d31e-7b91-4721-8c1c-a1ddd9e96939";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // 1. Phone Formatting Logic
    let rawPhone = employee.phoneNo || employee.phone || "";
    let cleanPhone = rawPhone.replace(/\s+/g, '').replace(/-/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }

    // 2. Main Payload for Database Update
    const payload = {
      email: employee.email, 
      phoneNo: cleanPhone,
      userId: employee.userId || employee.id,
      task: taskDescription,
      deadline: parseInt(deadline) || 0, 
      status: "Assigned" 
    };

    try {
      // ---------------------------------------------------------
      // STEP 1: Update the Database (Assign Task)
      // ---------------------------------------------------------
      const UPDATE_API_URL = "https://asia-south1.workflow.boltic.app/59b8370f-fbb9-4da5-ac13-c946c56d6907"; 
      
      const response = await fetch(UPDATE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // ---------------------------------------------------------
        // STEP 2: Trigger the Deadline Countdown Workflow 🚀
        // ---------------------------------------------------------
        try {
            console.log("⏳ Triggering Deadline Workflow...");
            await fetch(DEADLINE_WORKFLOW_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: employee.email })
            });
            console.log("✅ Deadline Workflow Started!");
        } catch (wfError) {
            console.warn("⚠️ Database updated, but Deadline Workflow failed to start:", wfError);
        }

        alert(`✅ Task assigned to ${employee.name} & Timer Started!`);
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
            {/* Email Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Employee Email</label>
                <input type="email" value={employee.email} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500" />
            </div>

            {/* 👇 RESTORED: Phone Number Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Employee Phone</label>
                <input type="text" value={displayPhone} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500" />
            </div>

            {/* Task Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Task</label>
                <textarea rows="4" required value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>

            {/* Deadline Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Deadline (Days)</label>
                <input type="number" min="1" max="5" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>

            {/* Buttons */}
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
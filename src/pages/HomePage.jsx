// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
                Chaser Agent
              </h1>
            </div>

            {/* Top Right: Default Sign In (Employee) */}
            <div className="hidden md:flex space-x-4 items-center">
              <span className="text-sm text-gray-500 mr-2">Already a member?</span>
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-blue-600 font-medium transition"
              >
                user Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Never miss a deadline</span>{' '}
                  <span className="block text-blue-600 xl:inline">with automated nudges.</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Your automated program manager. We send intelligent reminders and follow-ups so you can focus on the work, not the chase.
                </p>

                {/* --- DUAL ACTION BUTTONS --- */}
                <div className="mt-8 space-y-4">
                  
                  {/* OPTION 1: EMPLOYEE */}
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
                    <p className="text-sm text-blue-600 mb-3">View your tasks and receive updates.</p>
                    <div className="flex space-x-3">
                      <Link
                        to="/signup"
                        className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Get started
                      </Link>
                     
                    </div>
                  </div>

            

                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
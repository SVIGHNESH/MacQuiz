import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashBoard';
import StudentDashboard from './studentDashboard';

/**
 * Global Dashboard Component
 * Automatically renders the appropriate dashboard based on user role
 * - Admin/Teacher: Admin Dashboard with full management capabilities
 * - Student: Student Dashboard with quiz taking and progress tracking
 */
const GlobalDashboard = () => {
    const { user } = useAuth();

    // Role-based rendering
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Loading user information...</p>
                </div>
            </div>
        );
    }

    // Check user role and render appropriate dashboard
    const userRole = user.role?.toLowerCase();

    switch (userRole) {
        case 'admin':
        case 'teacher':
            return <AdminDashboard />;
        
        case 'student':
            return <StudentDashboard />;
        
        default:
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                        <p className="text-gray-600">Your account role is not recognized.</p>
                        <p className="text-sm text-gray-500 mt-2">Role: {user.role}</p>
                    </div>
                </div>
            );
    }
};

export default GlobalDashboard;

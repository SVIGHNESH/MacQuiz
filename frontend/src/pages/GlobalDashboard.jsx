import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashBoard';

/**
 * Global Dashboard Component
 * Automatically renders the appropriate dashboard based on user role
 * - All roles: Shared unified dashboard shell with role-based tabs and permissions
 */
const GlobalDashboard = () => {
    const { user, isLoading } = useAuth();
    const [renderError, setRenderError] = useState(null);

    useEffect(() => {
        // Reset error when user changes
        setRenderError(null);
    }, [user]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-xl text-gray-600">Loading user information...</p>
                </div>
            </div>
        );
    }

    // Role-based rendering
    if (!user) {
        console.error('GlobalDashboard: No user data available');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-xl text-gray-600 mb-4">Unable to load user information</p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    // Show error if dashboard fails to render
    if (renderError) {
        console.error('GlobalDashboard: Render error:', renderError);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
                    <p className="text-gray-600 mb-4">An error occurred while loading the dashboard.</p>
                    <p className="text-sm text-gray-500 mb-4 p-3 bg-gray-100 rounded">{renderError.toString()}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                    >
                        Reload Page
                    </button>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    console.log('GlobalDashboard: User role:', user.role);

    // Check user role and render appropriate dashboard
    const userRole = user.role?.toLowerCase();

    try {
        switch (userRole) {
            case 'admin':
            case 'teacher':
            case 'student':
                return <AdminDashboard />;
            
            default:
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                            <p className="text-gray-600">Your account role is not recognized.</p>
                            <p className="text-sm text-gray-500 mt-2">Role: {user.role}</p>
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Return to Login
                            </button>
                        </div>
                    </div>
                );
        }
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        setRenderError(error);
        return null;
    }
};

export default GlobalDashboard;

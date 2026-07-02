import React from "react";
import { X } from 'lucide-react';
import { getDisplayUserId } from "../../utils/dashboardHelpers";

// Component for viewing user profile (read-only)
const ViewProfileModal = ({ user, profileImage, onClose }) => {
    const identityValue = user ? getDisplayUserId(user) : 'Not assigned';
    const identityLabel = user?.role === 'student'
        ? 'Student ID'
        : user?.role === 'teacher'
            ? 'Teacher ID'
            : 'Admin Account';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X size={24} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-blue-100 mb-4">
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U'
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{user?.first_name} {user?.last_name}</h3>
                        <p className="text-gray-500">{user?.email}</p>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mt-2 ${
                            user?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user?.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            {user?.role}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Full Name</p>
                            <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Email</p>
                            <p className="font-semibold text-gray-900 break-all">{user?.email || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">{identityLabel}</p>
                            <p className="font-semibold text-gray-900">{identityValue}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Department</p>
                            <p className="font-semibold text-gray-900">{user?.department || 'N/A'}</p>
                        </div>
                        {user?.role === 'student' && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Class / Year</p>
                                <p className="font-semibold text-gray-900">{user?.class_year || 'N/A'}</p>
                            </div>
                        )}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Phone</p>
                            <p className="font-semibold text-gray-900">{user?.phone_number || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Account Status</p>
                            <p className={`font-semibold ${user?.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                {user?.is_active ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfileModal;

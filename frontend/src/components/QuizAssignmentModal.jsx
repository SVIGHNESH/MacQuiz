import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, UserCheck, Search, Filter, Check, Calendar, Clock } from 'lucide-react';
import { userAPI, API_BASE_URL } from '../services/api';

const QuizAssignmentModal = ({ isOpen, quiz, onClose, onSuccess }) => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [isLiveSession, setIsLiveSession] = useState(false);
    const [liveStartTime, setLiveStartTime] = useState('');

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const allUsers = await userAPI.getAllUsers();
            const studentsList = allUsers.filter(user => user.role === 'student');
            setStudents(studentsList);
        } catch (err) {
            console.error('Failed to load students:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadAssignedStudents = useCallback(async () => {
        if (!quiz?.id) {
            setSelectedStudents([]);
            return;
        }

        // Load currently assigned students from backend
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/quizzes/${quiz.id}/assignments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const assignedIds = data.assigned_students.map(s => s.id);
                setSelectedStudents(assignedIds);
                console.log(`Loaded ${assignedIds.length} assigned students from backend`);
            } else {
                // No assignments yet, start fresh
                setSelectedStudents([]);
            }
        } catch (err) {
            console.error('Failed to load assigned students:', err);
            setSelectedStudents([]);
        }
    }, [quiz?.id]);

    const loadLiveSessionSettings = useCallback(() => {
        try {
            // Check if quiz already has live session data from backend
            if (quiz.is_live_session && quiz.live_start_time) {
                setIsLiveSession(true);
                // Convert backend datetime to local datetime-local format
                const date = new Date(quiz.live_start_time);
                const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                setLiveStartTime(localDateTime);
            } else {
                // No live session in backend, start fresh
                setIsLiveSession(false);
                setLiveStartTime('');
            }
        } catch (err) {
            console.error('Failed to load live session settings:', err);
            setIsLiveSession(false);
            setLiveStartTime('');
        }
    }, [quiz]);

    const filterStudentsList = useCallback(() => {
        let filtered = [...students];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(student => {
                const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
                return fullName.includes(query) ||
                    student.email?.toLowerCase().includes(query) ||
                    student.student_id?.toLowerCase().includes(query);
            });
        }

        if (filterDepartment !== 'all') {
            filtered = filtered.filter(student => student.department === filterDepartment);
        }

        if (filterYear !== 'all') {
            filtered = filtered.filter(student => student.class_year === filterYear);
        }

        setFilteredStudents(filtered);
    }, [students, searchQuery, filterDepartment, filterYear]);

    useEffect(() => {
        if (isOpen && quiz) {
            // Reset states when opening modal
            setSearchQuery('');
            setFilterDepartment('all');
            setFilterYear('all');
            
            fetchStudents();
            loadAssignedStudents();
            loadLiveSessionSettings();
        } else {
            // Clear all states when closing modal
            setSelectedStudents([]);
            setIsLiveSession(false);
            setLiveStartTime('');
        }
    }, [isOpen, quiz, fetchStudents, loadAssignedStudents, loadLiveSessionSettings]);

    useEffect(() => {
        filterStudentsList();
    }, [filterStudentsList]);

    const handleToggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        const filteredIds = filteredStudents.map(s => s.id);
        const allFilteredSelected = filteredIds.every(id => selectedStudents.includes(id));
        
        if (allFilteredSelected) {
            // Deselect all filtered
            setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            // Select all filtered
            setSelectedStudents(prev => [...new Set([...prev, ...filteredIds])]);
        }
    };

    const handleSaveAssignment = async () => {
        if (isLiveSession && !liveStartTime) {
            alert('Please set a start time for the live session');
            return;
        }

        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        setIsLoading(true);
        try {
            // Update quiz in backend - activate quiz with live session settings and student assignments
            const updatePayload = {
                is_active: true,
                is_live_session: isLiveSession,
                assigned_student_ids: selectedStudents  // Send array of selected student IDs
            };

            if (isLiveSession && liveStartTime) {
                // Send datetime in local timezone format (YYYY-MM-DDTHH:MM:SS)
                // Don't use toISOString() as it converts to UTC
                const date = new Date(liveStartTime);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                updatePayload.live_start_time = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                console.log('🕐 Sending local time:', updatePayload.live_start_time);
            }

            console.log('Saving assignment with payload:', updatePayload);

            const response = await fetch(`${API_BASE_URL}/api/v1/quizzes/${quiz.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                throw new Error('Failed to activate quiz');
            }

            console.log(`✅ Quiz assigned to ${selectedStudents.length} students`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to save quiz assignment:', err);
            alert('Failed to activate quiz: ' + (err.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !quiz) return null;

    const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
    const years = [...new Set(students.map(s => s.class_year).filter(Boolean))];
    const unassignedCount = students.length - selectedStudents.length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Users size={28} />
                        <div>
                            <h2 className="text-2xl font-bold">Assign Students to Quiz</h2>
                            <p className="text-purple-100 text-sm">{quiz.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Live Session Settings */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar size={24} className="text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Live Quiz Session</h3>
                                    <p className="text-sm text-gray-600">Set specific start time for synchronized quiz</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isLiveSession}
                                    onChange={(e) => setIsLiveSession(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {isLiveSession && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Clock size={16} className="text-blue-600" />
                                        Start Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={liveStartTime}
                                        onChange={(e) => setLiveStartTime(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                                        placeholder="Select date and time"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <div className="bg-blue-100 rounded-lg p-3 w-full">
                                        <p className="text-sm text-blue-900 font-medium">
                                            📌 Students will join at the scheduled time
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Duration: {quiz.duration_minutes} minutes from start
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                            <Users size={24} className="mx-auto text-blue-600 mb-2" />
                            <p className="text-3xl font-bold text-blue-900">{students.length}</p>
                            <p className="text-sm text-blue-700 font-medium">Total Students</p>
                        </div>
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                            <UserCheck size={24} className="mx-auto text-green-600 mb-2" />
                            <p className="text-3xl font-bold text-green-900">{selectedStudents.length}</p>
                            <p className="text-sm text-green-700 font-medium">Assigned</p>
                        </div>
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
                            <Users size={24} className="mx-auto text-orange-600 mb-2" />
                            <p className="text-3xl font-bold text-orange-900">{unassignedCount}</p>
                            <p className="text-sm text-orange-700 font-medium">Unassigned</p>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                                />
                            </div>
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                            >
                                <option value="all">All Years</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Select All Button */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition font-medium text-sm"
                        >
                            <Check size={18} />
                            {filteredStudents.every(s => selectedStudents.includes(s.id)) && filteredStudents.length > 0
                                ? 'Deselect All Shown'
                                : 'Select All Shown'}
                        </button>
                        <span className="text-sm text-gray-600">
                            Showing {filteredStudents.length} of {students.length} students
                        </span>
                    </div>

                    {/* Student List with Checkboxes */}
                    <div>
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Loading students...</p>
                            </div>
                        ) : filteredStudents.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {filteredStudents.map(student => (
                                    <label
                                        key={student.id}
                                        className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                                            selectedStudents.includes(student.id)
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={() => handleToggleStudent(student.id)}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-4 gap-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">{student.student_id || 'No ID'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-700">{student.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{student.department || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{student.class_year || '-'}</p>
                                            </div>
                                        </div>
                                        {selectedStudents.includes(student.id) && (
                                            <Check size={20} className="text-purple-600 ml-2" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">
                                    {searchQuery || filterDepartment !== 'all' || filterYear !== 'all'
                                        ? 'No students match your filters'
                                        : 'No students available'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                            {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                        </p>
                        <p className="text-gray-600 mt-1">
                            {isLiveSession 
                                ? '🟢 Live session will start at scheduled time'
                                : 'Quiz will be immediately available to selected students'}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAssignment}
                            disabled={isLoading || selectedStudents.length === 0}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                            {isLoading ? 'Saving...' : isLiveSession ? '🟢 Go Live & Assign' : `Assign to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizAssignmentModal;

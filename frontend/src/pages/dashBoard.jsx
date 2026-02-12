import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { userAPI, quizAPI, attemptAPI, analyticsAPI } from "../services/api";
import { getDepartments } from "../utils/settingsHelper";
import BulkUploadModal from "../components/BulkUploadModal";
import BulkQuizUploadModal from "../components/BulkQuizUploadModal";
import QuizAssignmentModal from "../components/QuizAssignmentModal";
import QuizCreator from "./QuizCreator";
import {
    LayoutDashboard, Users, Zap, FileText, Settings, LogOut, CheckCircle, Clock,
    TrendingUp, TrendingDown, ClipboardList, BarChart3, Search, Plus, X, List, Save, UserCheck, Calendar, Upload,
    Eye, EyeOff, RefreshCw, Key, ShieldCheck, AlertTriangle, AlertCircle, GraduationCap, XCircle, Trophy, Download, FileSpreadsheet, Code2
} from 'lucide-react';

// No mock data needed - all data fetched from API

/**
 * --- UTILITY FUNCTIONS ---
 */

// Password strength validator
const validatePasswordStrength = (password) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        // eslint-disable-next-line no-useless-escape
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    let strength = 'weak';
    let color = 'bg-red-500';
    
    if (score >= 5) {
        strength = 'strong';
        color = 'bg-green-500';
    } else if (score >= 3) {
        strength = 'medium';
        color = 'bg-yellow-500';
    }

    return { checks, score, strength, color };
};

// Strong password generator
const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*_-+=';
    
    const allChars = uppercase + lowercase + numbers + special;
    
    // Ensure at least one of each type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill remaining characters (total length 12)
    for (let i = password.length; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Email domain validator
const validateEmailDomain = (email) => {
    const allowedDomains = ['gmail.com', 'rbmi.in', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.includes(domain);
};


/**
 * --- UTILITY COMPONENTS ---
 */

// Stat Card component for key metrics
const StatCard = ({ title, value, icon: StatIcon, color, trend, subtitle }) => { // Icon renamed to StatIcon to fix ESLint error
    // If trend is N/A, we prevent showing red/green colours
    const trendColor = trend === 'N/A' ? 'text-gray-500' : (trend.includes('-') ? 'text-red-600' : 'text-green-600');
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-full ${color}`}>
                    <StatIcon size={24} />
                </div>
                <div className="text-sm font-medium text-gray-500">{title}</div>
            </div>
            <div className="mt-4 flex items-end justify-between">
                <div className="text-4xl font-bold text-gray-900">{value}</div>
                <div className={`flex items-center text-sm font-semibold ${trendColor}`}>
                    {trend}
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        </div>
    );
};

// Activity Feed Item
const ActivityItem = ({ user, action, time, status }) => {
    const statusColor = status === 'success' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-blue-500'; // Reverted to blue accent
    const StatusIcon = status === 'success' ? CheckCircle : ClipboardList;

    return (
        <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 rounded-lg transition">
            <div className="flex items-center space-x-3">
                <StatusIcon size={20} className={statusColor} />
                <div>
                    <p className="font-semibold text-gray-800">{user}</p>
                    <p className="text-sm text-gray-600">{action}</p>
                </div>
            </div>
            <div className="text-xs text-gray-500 flex items-center">
                <Clock size={14} className="mr-1" />
                {time}
            </div>
        </div>
    );
};

// Card: Quick link for Admin to add new user (Teacher or Student)
const AddNewUserCard = ({ onAddClick }) => (
    // REMOVED: hover:shadow-2xl transition duration-300 transform hover:scale-[1.01]
    <div className="bg-blue-600/90 text-white p-6 rounded-2xl shadow-xl border border-blue-700 cursor-pointer" onClick={onAddClick}>
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-xl font-bold">New User Provisioning</h3>
                <p className="text-blue-200 text-sm mt-1">Quickly onboard new teachers or students.</p>
            </div>
        </div>
        {/* Reverted Button text color to blue */}
        <div className="mt-5 w-full bg-white text-blue-800 py-3 rounded-xl text-center font-semibold transition shadow-lg text-lg">
            Add Teacher / Student
        </div>
    </div>
);

const SdcTeamSection = () => {
    const backendTeam = [
        'Ritik Kumar',
        'Devang Pathak',
        'Vivek Sharma',
        'Vighnesh Shukla'
    ];

    const frontendTeam = [
        'Dakshita Tiwari',
        'Anjali Tiwari',
        'Rohit',
        'Satyam Diwaker'
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Software Development Cell (SDC)</h2>
                <p className="text-gray-600">MacQuiz Development Team (Student Contributors)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Code2 size={20} className="mr-2 text-blue-600" />
                        Backend Team
                    </h3>
                    <ul className="space-y-2">
                        {backendTeam.map((name) => (
                            <li key={name} className="px-3 py-2 rounded-lg bg-blue-50 text-gray-800 font-medium">
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Code2 size={20} className="mr-2 text-indigo-600" />
                        Frontend Team
                    </h3>
                    <ul className="space-y-2">
                        {frontendTeam.map((name) => (
                            <li key={name} className="px-3 py-2 rounded-lg bg-indigo-50 text-gray-800 font-medium">
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tech Stack Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-sm text-gray-600 mb-1">Backend</p>
                        <p className="text-lg font-semibold text-gray-900">FastAPI</p>
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                        <p className="text-sm text-gray-600 mb-1">Frontend</p>
                        <p className="text-lg font-semibold text-gray-900">React</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                        <p className="text-sm text-gray-600 mb-1">Database</p>
                        <p className="text-lg font-semibold text-gray-900">MySQL</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// New Component: Form for creating new users
const UserCreationForm = ({ onCancel, onUserCreated, currentUserRole }) => {
    const { success, error} = useToast();
    const [formData, setFormData] = useState({
        role: 'student', // Default role (lowercase for API)
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone_number: '', // New phone number field
        student_id: '', // Specific to student
        department: '',
        class_year: '1st Year'
    });
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [emailError, setEmailError] = useState('');
    const [showDomainDropdown, setShowDomainDropdown] = useState(false);
    const [emailUsername, setEmailUsername] = useState('');
    const allowedDomains = ['gmail.com', 'rbmi.in', 'yahoo.com', 'outlook.com', 'hotmail.com'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Validate password strength on change
        if (name === 'password') {
            if (value.length > 0) {
                setPasswordStrength(validatePasswordStrength(value));
            } else {
                setPasswordStrength(null);
            }
        }

        // Handle email input with domain dropdown
        if (name === 'email') {
            if (value.includes('@')) {
                const parts = value.split('@');
                setEmailUsername(parts[0]);
                setShowDomainDropdown(false);
                
                if (!validateEmailDomain(value)) {
                    setEmailError('Please use a valid email domain (gmail.com, rbmi.in, yahoo.com, outlook.com, hotmail.com)');
                } else {
                    setEmailError('');
                }
            } else {
                setEmailUsername(value);
                setShowDomainDropdown(value.length > 0);
                setEmailError('');
            }
        }
    };

    const handleDomainSelect = (domain) => {
        setFormData({ ...formData, email: `${emailUsername}@${domain}` });
        setShowDomainDropdown(false);
        setEmailError('');
    };

    const handleGeneratePassword = () => {
        const newPassword = generateStrongPassword();
        setFormData({ ...formData, password: newPassword });
        setPasswordStrength(validatePasswordStrength(newPassword));
        success('Strong password generated! Make sure to copy it.');
    };

    const handleBulkUploadSuccess = (result) => {
        success(`Successfully created ${result.created_count} users!`);
        
        if (result.error_count > 0) {
            console.error("Upload errors:", result.errors);
            error(`${result.error_count} rows had errors. Check console for details.`);
        }

        if (onUserCreated) {
            onUserCreated(result);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate email domain before submission
        if (!validateEmailDomain(formData.email)) {
            error('Please use a valid email domain (gmail.com, rbmi.in, yahoo.com, outlook.com, hotmail.com)');
            return;
        }

        // Validate password strength
        if (passwordStrength && passwordStrength.score < 3) {
            error('Password is too weak. Please use a stronger password or generate one.');
            return;
        }

        setIsSubmitting(true);

        try {
            const userData = {
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role.toLowerCase(),
                department: formData.department,
                class_year: formData.class_year,
                phone_number: formData.phone_number || null, // Add phone number
            };

            // Add student_id only for students
            if (formData.role.toLowerCase() === 'student') {
                userData.student_id = formData.student_id;
            }

            const response = await userAPI.createUser(userData);
            
            success(`User ${response.first_name} ${response.last_name} created successfully!`);
            
            // Reset form
            setFormData({
                role: 'student',
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                phone_number: '',
                student_id: '',
                department: '',
                class_year: '1st Year'
            });

            if (onUserCreated) {
                onUserCreated(response);
            }

            // Close form after 1 second
            setTimeout(() => {
                onCancel();
            }, 1000);
            
        } catch (err) {
            if (err.status === 400) {
                error(err.data?.detail || "Email or Student ID already exists!");
            } else if (err.status === 401 || err.status === 403) {
                error("You don't have permission to create users. Please login as admin.");
            } else {
                error(err.message || "Failed to create user. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Provision New User Account</h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-red-600 transition">
                    <X size={24} />
                </button>
            </div>

            {/* Bulk Upload Modal */}
            <BulkUploadModal 
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={handleBulkUploadSuccess}
            />

            {/* Bulk Upload Button - Admin Only */}
            {currentUserRole === 'admin' && (
                <>
                    <div className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <Upload size={24} className="text-blue-600 mt-1" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                                        Bulk User Upload
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Upload a CSV file to add multiple users at once. Preview data, detect duplicates, and validate before importing.
                                    </p>
                                    <ul className="text-xs text-gray-500 space-y-1">
                                        <li>• Real-time validation and duplicate detection</li>
                                        <li>• Preview imported data before uploading</li>
                                        <li>• Automatic error reporting with line numbers</li>
                                    </ul>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBulkUpload(true)}
                                disabled={isSubmitting}
                                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg whitespace-nowrap disabled:opacity-50"
                            >
                                <Upload size={20} className="mr-2" />
                                Bulk Upload
                            </button>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Or, Add Single User Manually</h3>
                </>
            )}
            
            {currentUserRole === 'teacher' && (
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Add New Student</h3>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                {/* User Role Selector - Admin Only */}
                {currentUserRole === 'admin' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                        <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleInputChange} 
                            required 
                            disabled={isSubmitting}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-blue-50 ring-2 ring-blue-500 font-semibold disabled:bg-gray-100"
                        >
                            <option value="teacher">Teacher / Professor</option>
                            <option value="admin">Admin</option>
                            <option value="student">Student</option>
                        </select>
                    </div>
                )}

                {/* Student ID field (shown first for students) */}
                {formData.role === 'student' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Roll No. / Student ID (Required)</label>
                        <input 
                            type="text" 
                            name="student_id" 
                            value={formData.student_id} 
                            onChange={handleInputChange} 
                            required={formData.role === 'student'} 
                            disabled={isSubmitting}
                            autoComplete="off"
                            placeholder="e.g., CS2024001"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                        />
                    </div>
                )}

                {/* Grid for main details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input 
                            type="text" 
                            name="first_name" 
                            value={formData.first_name} 
                            onChange={handleInputChange} 
                            required 
                            disabled={isSubmitting}
                            autoComplete="off"
                            placeholder="Enter first name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input 
                            type="text" 
                            name="last_name" 
                            value={formData.last_name} 
                            onChange={handleInputChange} 
                            required 
                            disabled={isSubmitting}
                            autoComplete="off"
                            placeholder="Enter last name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email (Login ID) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isSubmitting}
                                autoComplete="off"
                                placeholder="Type username (e.g., john.doe)"
                                className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                                onFocus={() => {
                                    if (!formData.email.includes('@') && formData.email.length > 0) {
                                        setShowDomainDropdown(true);
                                    }
                                }}
                            />
                            
                            {/* Domain Dropdown */}
                            {showDomainDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b text-xs font-medium text-gray-700 flex items-center justify-between">
                                        <span>📧 Select your email domain:</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowDomainDropdown(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    {allowedDomains.map((domain) => (
                                        <button
                                            key={domain}
                                            type="button"
                                            onClick={() => handleDomainSelect(domain)}
                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center justify-between group border-b last:border-b-0"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">
                                                    {emailUsername}@{domain}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-0.5">
                                                    {domain === 'rbmi.in' && '🏫 Institute Domain'}
                                                    {domain === 'gmail.com' && '📬 Most Popular'}
                                                    {domain === 'yahoo.com' && '🌐 Yahoo Mail'}
                                                    {domain === 'outlook.com' && '📧 Microsoft Outlook'}
                                                    {domain === 'hotmail.com' && '📮 Hotmail'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">
                                                Click →
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {emailError && (
                            <div className="flex items-center mt-2 text-xs text-red-600">
                                <AlertTriangle size={14} className="mr-1" />
                                {emailError}
                            </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">💡 Tip:</span> Type your username, then select a domain from the dropdown
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                        <input 
                            type="tel" 
                            name="phone_number" 
                            value={formData.phone_number} 
                            onChange={handleInputChange} 
                            disabled={isSubmitting}
                            autoComplete="off"
                            placeholder="+1234567890 or 1234567890"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temporary Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password" 
                                value={formData.password} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isSubmitting}
                                autoComplete="new-password"
                                placeholder="Set temporary password"
                                className="w-full p-3 pr-24 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-2 text-gray-500 hover:text-gray-700 transition"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    disabled={isSubmitting}
                                    className="p-2 text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                                    title="Generate strong password"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Password Strength Indicator */}
                        {passwordStrength && (
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700">Password Strength:</span>
                                    <span className={`text-xs font-bold uppercase ${
                                        passwordStrength.strength === 'strong' ? 'text-green-600' :
                                        passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                        {passwordStrength.strength === 'strong' && <span className="flex items-center"><ShieldCheck size={14} className="mr-1" />Strong</span>}
                                        {passwordStrength.strength === 'medium' && <span className="flex items-center"><Key size={14} className="mr-1" />Medium</span>}
                                        {passwordStrength.strength === 'weak' && <span className="flex items-center"><AlertTriangle size={14} className="mr-1" />Weak</span>}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                                    </div>
                                    <div className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordStrength.checks.uppercase ? '✓' : '○'} Uppercase letter
                                    </div>
                                    <div className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordStrength.checks.lowercase ? '✓' : '○'} Lowercase letter
                                    </div>
                                    <div className={passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordStrength.checks.number ? '✓' : '○'} Number
                                    </div>
                                    <div className={passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'}>
                                        {passwordStrength.checks.special ? '✓' : '○'} Special character
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Student-specific fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select 
                            name="department" 
                            value={formData.department} 
                            onChange={handleInputChange} 
                            required 
                            disabled={isSubmitting} 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Select Department</option>
                            {['Computer Science Engg.', 'Artificial Intelligence', 'Mechanical Engineering', 'Electrical Engineering'].map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    {formData.role === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class/Year</label>
                            <select 
                                name="class_year" 
                                value={formData.class_year} 
                                onChange={handleInputChange} 
                                required={formData.role === 'student'} 
                                disabled={isSubmitting}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            >
                                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        disabled={isSubmitting}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        <X size={20} className="mr-2" /> Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save size={20} className="mr-2" /> Create User
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Component for editing existing users
const EditUserModal = ({ user, onClose, onSuccess }) => {
    const { success, error } = useToast();
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        department: user.department || '',
        class_year: user.class_year || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        password: '', // New password field (optional)
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const finalValue = e.target.type === 'checkbox' ? e.target.checked : value;
        setFormData({ ...formData, [name]: finalValue });

        // Validate password strength on change
        if (name === 'password') {
            if (value.length > 0) {
                setPasswordStrength(validatePasswordStrength(value));
            } else {
                setPasswordStrength(null);
            }
        }
    };

    const handleGeneratePassword = () => {
        const newPassword = generateStrongPassword();
        setFormData({ ...formData, password: newPassword });
        setPasswordStrength(validatePasswordStrength(newPassword));
        success('Strong password generated! Make sure to copy it.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password strength if password is being changed
        if (formData.password && passwordStrength && passwordStrength.score < 3) {
            error('Password is too weak. Please use a stronger password or generate one.');
            return;
        }

        setIsSubmitting(true);

        try {
            const updateData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number || null,
                department: formData.department || null,
                class_year: formData.class_year || null,
                is_active: formData.is_active,
            };

            // Only include password if it's being changed
            if (formData.password) {
                updateData.password = formData.password;
            }

            await userAPI.updateUser(user.id, updateData);
            success(`User ${formData.first_name} ${formData.last_name} updated successfully!`);
            if (onSuccess) onSuccess();
        } catch (err) {
            if (err.status === 400) {
                error(err.data?.detail || "Failed to update user");
            } else if (err.status === 401 || err.status === 403) {
                error("You don't have permission to update users.");
            } else {
                error(err.message || "Failed to update user. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Edit User</h2>
                        <p className="text-blue-100 text-sm mt-1">Update user information</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 p-2 rounded-full transition"
                        disabled={isSubmitting}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login ID)</label>
                        <input 
                            type="email" 
                            value={formData.email}
                            disabled
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <input 
                            type="text" 
                            value={user.role}
                            disabled
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed capitalize" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input 
                                type="text" 
                                name="first_name" 
                                value={formData.first_name} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isSubmitting}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input 
                                type="text" 
                                name="last_name" 
                                value={formData.last_name} 
                                onChange={handleInputChange} 
                                required 
                                disabled={isSubmitting}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input 
                            type="tel" 
                            name="phone_number" 
                            value={formData.phone_number} 
                            onChange={handleInputChange} 
                            disabled={isSubmitting}
                            placeholder="+1234567890"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                        />
                    </div>

                    {/* Department and Class/Year */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select 
                                name="department" 
                                value={formData.department} 
                                onChange={handleInputChange} 
                                disabled={isSubmitting} 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Select Department</option>
                                {['Computer Science Engg.', 'Artificial Intelligence', 'Mechanical Engineering', 'Electrical Engineering', 'Mathematics', 'Physics'].map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        {user.role === 'student' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class/Year</label>
                                <select 
                                    name="class_year" 
                                    value={formData.class_year} 
                                    onChange={handleInputChange} 
                                    disabled={isSubmitting}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Select Year</option>
                                    {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            disabled={isSubmitting}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                            Active User (Uncheck to deactivate account)
                        </label>
                    </div>

                    {/* Password Reset Section */}
                    <div className="border-t pt-4">
                        <button
                            type="button"
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                            className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm mb-3"
                        >
                            <Key size={16} className="mr-2" />
                            {showPasswordSection ? 'Cancel Password Reset' : 'Reset User Password'}
                        </button>

                        {showPasswordSection && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    New Password (Optional)
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleInputChange} 
                                        disabled={isSubmitting}
                                        autoComplete="new-password"
                                        placeholder="Enter new password"
                                        className="w-full p-3 pr-24 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" 
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-2 text-gray-500 hover:text-gray-700 transition"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleGeneratePassword}
                                            disabled={isSubmitting}
                                            className="p-2 text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                                            title="Generate strong password"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                {passwordStrength && formData.password && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-700">Password Strength:</span>
                                            <span className={`text-xs font-bold uppercase ${
                                                passwordStrength.strength === 'strong' ? 'text-green-600' :
                                                passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                                {passwordStrength.strength === 'strong' && <span className="flex items-center"><ShieldCheck size={14} className="mr-1" />Strong</span>}
                                                {passwordStrength.strength === 'medium' && <span className="flex items-center"><Key size={14} className="mr-1" />Medium</span>}
                                                {passwordStrength.strength === 'weak' && <span className="flex items-center"><AlertTriangle size={14} className="mr-1" />Weak</span>}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className={passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}>
                                                {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                                            </div>
                                            <div className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
                                                {passwordStrength.checks.uppercase ? '✓' : '○'} Uppercase letter
                                            </div>
                                            <div className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
                                                {passwordStrength.checks.lowercase ? '✓' : '○'} Lowercase letter
                                            </div>
                                            <div className={passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}>
                                                {passwordStrength.checks.number ? '✓' : '○'} Number
                                            </div>
                                            <div className={passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'}>
                                                {passwordStrength.checks.special ? '✓' : '○'} Special character
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4 border-t">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                        >
                            <X size={20} className="mr-2" /> Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save size={20} className="mr-2" /> Update User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Component for listing existing users
const UserList = ({ onAddClick, refreshTrigger }) => {
    const { success, error } = useToast();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, teacher, student
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await userAPI.getAllUsers();
            setUsers(response);
        } catch (_err) {
            error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }, [error]);

    useEffect(() => {
        fetchUsers();
    }, [filter, refreshTrigger, fetchUsers]);

    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
            return;
        }

        try {
            await userAPI.deleteUser(userId);
            success(`User ${userName} deleted successfully`);
            fetchUsers(); // Refresh list
        } catch (err) {
            error(err.data?.detail || "Failed to delete user");
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
    };

    const handleUpdateSuccess = () => {
        setEditingUser(null);
        fetchUsers();
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        return user.role === filter;
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Existing Users ({filteredUsers.length})</h2>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded-lg text-sm transition ${
                                filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All Users
                        </button>
                        <button
                            onClick={() => setFilter('teacher')}
                            className={`px-3 py-1 rounded-lg text-sm transition ${
                                filter === 'teacher'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Teachers
                        </button>
                        <button
                            onClick={() => setFilter('student')}
                            className={`px-3 py-1 rounded-lg text-sm transition ${
                                filter === 'student'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Students
                        </button>
                    </div>
                </div>
                <button onClick={onAddClick} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md">
                    <Plus size={20} className="mr-2" /> Add New User
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-12">
                    No users found. Click "Add New User" to create one.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {user.first_name} {user.last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone_number || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.student_id || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {user.role !== 'admin' && (
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-blue-600 hover:text-blue-900 transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                                                    className="text-red-600 hover:text-red-900 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={handleUpdateSuccess}
                />
            )}
        </div>
    );
};

// New Component: Unified Table for Teacher/Student Activity Lookup
const UserActivityTable = ({ userType }) => {
    const { error } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [userData, setUserData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch users when component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const response = await userAPI.getAllUsers();
                // Filter by role based on userType
                const role = userType === 'Teachers' ? 'teacher' : 'student';
                const filteredUsers = response.filter(user => user.role === role);
                setUserData(filteredUsers);
            } catch (err) {
                error(`Failed to load ${userType.toLowerCase()}`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [userType, error]);

    // Filter data based on search term (Name or ID/RollNo)
    const filteredData = userData.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const nameMatch = fullName.includes(searchLower);
        const emailMatch = user.email.toLowerCase().includes(searchLower);
        const idMatch = user.student_id ? user.student_id.toLowerCase().includes(searchLower) : false;

        return nameMatch || emailMatch || idMatch;
    });

    // Format last active date
    const formatLastActive = (lastActive) => {
        if (!lastActive) return 'Never';
        try {
            const date = new Date(lastActive);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    // Export to CSV functionality
    const exportToCSV = () => {
        // Prepare CSV headers with all details
        const headers = userType === 'Students' 
            ? ['Sr. No.', 'Student ID', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Department', 'Class/Year', 'Role', 'Created At', 'Last Active', 'Status']
            : ['Sr. No.', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Department', 'Role', 'Created At', 'Last Active', 'Status'];

        // Prepare CSV rows with complete information
        const rows = filteredData.map((user, index) => {
            const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
            }) : 'N/A';

            if (userType === 'Students') {
                return [
                    index + 1,
                    user.student_id || 'N/A',
                    user.first_name,
                    user.last_name,
                    user.email,
                    user.phone_number || 'N/A',
                    user.department || 'N/A',
                    user.class_year || 'N/A',
                    user.role || 'student',
                    createdDate,
                    formatLastActive(user.last_active),
                    user.is_active ? 'Active' : 'Inactive'
                ];
            }

            // For teachers
            return [
                index + 1,
                user.first_name,
                user.last_name,
                user.email,
                user.phone_number || 'N/A',
                user.department || 'N/A',
                user.role || 'teacher',
                createdDate,
                formatLastActive(user.last_active),
                user.is_active ? 'Active' : 'Inactive'
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${userType.toLowerCase()}_complete_details_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{userType} Activity Lookup</h2>
                <div className="text-sm text-gray-600">
                    Total: <span className="font-bold text-blue-600">{userData.length}</span> {userType}
                </div>
            </div>

            {/* Search Bar (Prominently placed at the top) */}
            <div className="flex items-center space-x-2 w-full max-w-lg">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder={`Search ${userType} by Name${userType === 'Students' ? ', Roll No.' : ''} or Email...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading {userType.toLowerCase()}...</p>
                </div>
            ) : (
                <>
                    {/* Results Count */}
                    {searchTerm && (
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-bold text-blue-600">{filteredData.length}</span> of {userData.length} {userType.toLowerCase()}
                        </div>
                    )}

                    {/* User List Table */}
                    <div className="overflow-x-auto border rounded-xl shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                                    {userType === 'Students' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.length > 0 ? filteredData.map((user, index) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        {userType === 'Students' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono bg-blue-50">
                                                {user.student_id || 'N/A'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.first_name} {user.last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.department || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.class_year || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatLastActive(user.last_active)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={userType === 'Students' ? 8 : 7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <UserCheck size={48} className="text-gray-300" />
                                                <p className="text-gray-500 font-medium">
                                                    {searchTerm 
                                                        ? `No ${userType.toLowerCase()} found matching "${searchTerm}"`
                                                        : `No ${userType.toLowerCase()} found. Add some users to get started.`
                                                    }
                                                </p>
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => setSearchTerm('')}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Export/Actions */}
                    {filteredData.length > 0 && (
                        <div className="flex justify-between items-center pt-4 border-t">
                            <p className="text-sm text-gray-600">
                                Displaying {filteredData.length} {userType.toLowerCase()}
                            </p>
                            <button 
                                onClick={exportToCSV}
                                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                            >
                                <Calendar size={16} className="mr-2" />
                                Export to CSV
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Component for Detailed Reports Tab
const DetailedReportsTool = () => {
    const { error } = useToast();
    
    // Get departments from settings with error handling
    let departmentOptions = ['All'];
    try {
        departmentOptions = ['All', ...getDepartments()];
    } catch (err) {
        console.error('Failed to load departments:', err);
        departmentOptions = ['All', 'Computer Science Engg.', 'Mechanical Engineering', 'Electrical Engineering'];
    }
    const years = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

    const [classYear, setClassYear] = useState('All');
    const [department, setDepartment] = useState('All');
    const [semester, setSemester] = useState('All');
    const [reportOutput, setReportOutput] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [allQuizzes, setAllQuizzes] = useState([]);

    // Fetch real data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [users, quizzes] = await Promise.all([
                    userAPI.getAllUsers(),
                    quizAPI.getAllQuizzes()
                ]);
                setAllUsers(users || []);
                setAllQuizzes(quizzes || []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                error('Failed to load report data');
            }
        };
        fetchData();
    }, []);

    // Calculate semester options based on year
    const availableSemesters = useMemo(() => {
        const baseOptions = ['All'];
        if (classYear === 'All') {
            return [...baseOptions, 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
        }

        const yearMap = {
            '1st Year': [1, 2],
            '2nd Year': [3, 4],
            '3rd Year': [5, 6],
            '4th Year': [7, 8],
        };

        const yearSemesters = yearMap[classYear] || [];
        return [...baseOptions, ...yearSemesters.map(sem => `Sem ${sem}`)];
    }, [classYear]);

    // Reset semester when class year changes
    useEffect(() => {
        if (!availableSemesters.includes(semester)) {
            setSemester('All');
        }
    }, [classYear, availableSemesters, semester]);

    // Function to generate real report data based on filters
    const generateReportData = () => {
        // Filter students based on selections
        let filteredStudents = allUsers.filter(u => u.role === 'student');
        
        if (department !== 'All') {
            filteredStudents = filteredStudents.filter(s => s.department === department);
        }
        
        if (classYear !== 'All') {
            filteredStudents = filteredStudents.filter(s => s.class_year === classYear);
        }

        // Get quiz statistics
        const activeQuizzes = allQuizzes.filter(q => q.is_active);
        const totalQuizzes = allQuizzes.length;
        const totalAttempts = allQuizzes.reduce((sum, q) => sum + (q.attempts || 0), 0);
        
        // Calculate average completion rate
        const potentialAttempts = filteredStudents.length * activeQuizzes.length;
        const completionRate = potentialAttempts > 0 ? ((totalAttempts / potentialAttempts) * 100).toFixed(1) : 0;

        // Get teacher statistics
        const teachers = allUsers.filter(u => u.role === 'teacher');
        const teachersWithQuizzes = teachers.filter(t => 
            allQuizzes.some(q => q.creator_id === t.id)
        );
        const inactiveTeachers = teachers.length - teachersWithQuizzes.length;

        return {
            totalStudents: filteredStudents.length,
            totalQuizzes,
            activeQuizzes: activeQuizzes.length,
            totalAttempts,
            completionRate,
            totalTeachers: teachers.length,
            activeTeachers: teachersWithQuizzes.length,
            inactiveTeachers,
            filters: { classYear, department, semester }
        };
    };

    // Function to analyze report and generate insights
    const analyzeReport = async () => {
        setIsGenerating(true);
        setReportOutput(null);

        // Generate report data from actual system data
        const data = generateReportData();
        setReportData(data);

        // Simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate AI-style insights based on real data
        const insights = [];
        
        // Insight 1: Student Engagement
        if (data.completionRate < 50) {
            insights.push(`**🎯 Low Engagement Alert:** Only ${data.completionRate}% quiz completion rate detected for **${classYear === 'All' ? 'all students' : classYear}** ${department !== 'All' ? `in ${department}` : ''}. Consider implementing mandatory quiz policies or increasing grade weightage to improve participation.`);
        } else if (data.completionRate > 80) {
            insights.push(`**✨ Excellent Engagement:** ${data.completionRate}% completion rate shows strong student participation. Maintain current assessment strategies and consider expanding quiz offerings.`);
        } else {
            insights.push(`**📊 Moderate Engagement:** ${data.completionRate}% completion rate is acceptable but has room for improvement. Consider adding incentives or reducing quiz difficulty to boost participation.`);
        }

        // Insight 2: Teacher Activity
        if (data.inactiveTeachers > 0) {
            insights.push(`**⚠️ Faculty Engagement Gap:** ${data.inactiveTeachers} out of ${data.totalTeachers} teachers have not created any quizzes. Schedule training sessions or provide quiz templates to encourage quiz creation.`);
        } else {
            insights.push(`**👏 Full Faculty Participation:** All ${data.totalTeachers} teachers are actively creating assessments. Excellent team engagement!`);
        }

        // Insight 3: Quiz Availability
        if (data.activeQuizzes === 0) {
            insights.push(`**🚨 No Active Quizzes:** There are currently no active quizzes available to students. Activate existing quizzes or create new assessments to maintain continuous learning.`);
        } else if (data.activeQuizzes < 3) {
            insights.push(`**📚 Limited Assessment Options:** Only ${data.activeQuizzes} active quiz(es) available. Consider creating more diverse assessments to cover different topics and difficulty levels.`);
        } else {
            insights.push(`**✅ Healthy Assessment Pipeline:** ${data.activeQuizzes} active quizzes provide good variety. Ensure they cover all key topics and difficulty levels.`);
        }

        // Insight 4: Student Base
        if (data.totalStudents === 0) {
            insights.push(`**👥 No Students Found:** No students match the selected filters. Adjust your filter criteria or ensure students are properly registered in the system.`);
        } else if (data.totalStudents < 10) {
            insights.push(`**📈 Small Cohort:** ${data.totalStudents} students in this segment. Consider personalized attention and targeted interventions for maximum impact.`);
        } else {
            insights.push(`**👨‍🎓 Student Base:** ${data.totalStudents} students in selected cohort. This sample size allows for meaningful statistical analysis and trend identification.`);
        }

        const analysis = `### 📊 Analytical Insights for ${classYear} / ${department} / ${semester}\n\n${insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n\n')}\n\n---\n**📌 Summary Statistics:**\n- Total Students: ${data.totalStudents}\n- Total Quizzes: ${data.totalQuizzes} (${data.activeQuizzes} active)\n- Total Attempts: ${data.totalAttempts}\n- Completion Rate: ${data.completionRate}%\n- Active Teachers: ${data.activeTeachers}/${data.totalTeachers}`;

        setReportOutput(analysis);
        setIsGenerating(false);

        /* Uncomment this section when you have a Gemini API key:
        
        const apiKey = "YOUR_GEMINI_API_KEY_HERE";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const maxRetries = 3;
        
        const payload = {
            contents: [{
                parts: [{
                    text: `You are a world-class Educational Data Analyst. Analyze the provided report findings and generate exactly four concise, actionable recommendations for the administrative team to improve student performance and system engagement. Use simple bullet points.\n\nData: ${mockData}`
                }]
            }]
        };

        let result = null;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                result = await response.json();
                break; // Exit loop on success
            } catch (error) {
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                } else {
                    setReportOutput("Error: Could not fetch analysis from Gemini API.");
                    setIsGenerating(false);
                    return;
                }
            }
        }

        if (result && result.candidates?.[0]?.content?.parts?.[0]?.text) {
            setReportOutput(result.candidates[0].content.parts[0].text);
        } else {
            setReportOutput("Analysis failed or returned empty content.");
        }
        setIsGenerating(false);
        */
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Segmented Assessment Reports</h2>
            <p className="text-gray-600">
                Generate analytical reports by filtering the student results based on class structure, department, and semester.
            </p>

            {/* Input Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class/Year</label>
                    <select value={classYear} onChange={(e) => setClassYear(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600">
                        {years.map(year => (<option key={year}>{year}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600">
                        {departmentOptions.map(dept => (<option key={dept}>{dept}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600">
                        {/* UPDATED: Dynamic semester options based on classYear */}
                        {availableSemesters.map(sem => (<option key={sem}>{sem}</option>))}
                    </select>
                </div>
                <div className="flex items-end">
                    {/* Reverted primary button color to blue */}
                    <button onClick={analyzeReport} disabled={isGenerating} className="w-full flex items-center justify-center p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400">
                        {isGenerating ? (
                            <div className="flex items-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </div>
                        ) : (
                            <>
                                <BarChart3 size={20} className="mr-2" /> Generate Insights
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {reportData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-6">
                    {/* Total Students Card */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Users size={28} className="opacity-80" />
                            <span className="text-3xl font-bold">{reportData.totalStudents}</span>
                        </div>
                        <p className="text-sm opacity-90 font-medium">Total Students</p>
                        <p className="text-xs opacity-75 mt-1">In selected cohort</p>
                    </div>

                    {/* Total Quizzes Card */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <FileText size={28} className="opacity-80" />
                            <span className="text-3xl font-bold">{reportData.totalQuizzes}</span>
                        </div>
                        <p className="text-sm opacity-90 font-medium">Total Quizzes</p>
                        <p className="text-xs opacity-75 mt-1">{reportData.activeQuizzes} currently active</p>
                    </div>

                    {/* Completion Rate Card */}
                    <div className={`bg-gradient-to-br ${
                        reportData.completionRate >= 80 ? 'from-green-500 to-green-600' :
                        reportData.completionRate >= 50 ? 'from-yellow-500 to-yellow-600' :
                        'from-red-500 to-red-600'
                    } p-5 rounded-xl shadow-lg text-white`}>
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp size={28} className="opacity-80" />
                            <span className="text-3xl font-bold">{reportData.completionRate}%</span>
                        </div>
                        <p className="text-sm opacity-90 font-medium">Completion Rate</p>
                        <p className="text-xs opacity-75 mt-1">{reportData.totalAttempts} total attempts</p>
                    </div>

                    {/* Teacher Activity Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-xl shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <GraduationCap size={28} className="opacity-80" />
                            <span className="text-3xl font-bold">{reportData.activeTeachers}/{reportData.totalTeachers}</span>
                        </div>
                        <p className="text-sm opacity-90 font-medium">Active Teachers</p>
                        <p className="text-xs opacity-75 mt-1">
                            {reportData.inactiveTeachers === 0 ? 'Full participation!' : `${reportData.inactiveTeachers} inactive`}
                        </p>
                    </div>
                </div>
            )}

            {/* Gemini Analysis Output */}
            <div className="border-t pt-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Actionable Insights (Powered by AI)</h3>

                {/* Reverted BG and border to light blue */}
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-200 min-h-[150px] flex items-center justify-center">
                    {reportOutput ? (
                        <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: reportOutput.replace(/\n/g, '<br>') }} />
                    ) : (
                        <p className="text-gray-500 text-center">
                            Use the filters and click 'Generate Insights' to get immediate analysis and recommendations.
                        </p>
                    )}
                </div>
            </div>

        </div>
    );
};

// Quiz Management Component
// Teacher Quiz Management - Create and manage own quizzes
const TeacherStudentsView = () => {
    const { error } = useToast();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        if (!showAddForm) {
            fetchTeacherStudents();
        }
    }, [showAddForm]);

    const fetchTeacherStudents = async () => {
        setIsLoading(true);
        try {
            // Get all users
            const allUsers = await userAPI.getAllUsers();
            
            // Filter to show only students
            const studentsList = allUsers.filter(u => u.role === 'student');
            setStudents(studentsList);
        } catch (err) {
            error('Failed to load students');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserCreated = () => {
        setShowAddForm(false);
        fetchTeacherStudents();
    };

    if (showAddForm) {
        return (
            <UserCreationForm 
                onCancel={() => setShowAddForm(false)}
                onUserCreated={handleUserCreated}
                currentUserRole="teacher"
            />
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Students</h2>
                    <p className="text-gray-600 mt-1">View and manage your students</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
                >
                    <Plus size={20} className="mr-2" />
                    Add Student
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading students...</p>
                </div>
            ) : students.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Year</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-gray-900">{student.first_name} {student.last_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {student.student_id || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {student.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {student.department || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {student.class_year || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No students found</p>
                </div>
            )}
        </div>
    );
};

const TeacherQuizManagement = () => {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [assignQuizModal, setAssignQuizModal] = useState({ open: false, quiz: null });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showCreateQuizInline, setShowCreateQuizInline] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, [refreshTrigger]);

    const fetchQuizzes = async () => {
        setIsLoading(true);
        try {
            console.log('Fetching quizzes...');
            const data = await quizAPI.getAllQuizzes();
            console.log('Quizzes loaded:', data);
            setQuizzes(data || []);
        } catch (err) {
            console.error('Failed to load quizzes:', err);
            error(`Failed to load quizzes: ${err.data?.detail || err.message || 'Unknown error'}`);
            setQuizzes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        
        try {
            console.log(`Attempting to delete quiz ${quizId}...`);
            await quizAPI.deleteQuiz(quizId);
            console.log('Delete successful');
            success('Quiz deleted successfully');
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Failed to delete quiz:', err);
            error(`Failed to delete quiz: ${err.data?.detail || err.message || 'Unknown error'}`);
        }
    };

    const handleToggleQuizStatus = async (quizId, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this quiz?${!currentStatus ? ' Students will be able to see and take it.' : ' Students will no longer be able to take it.'}`)) return;
        
        try {
            console.log(`Attempting to ${action} quiz ${quizId}...`);
            const result = await quizAPI.updateQuiz(quizId, { is_active: !currentStatus });
            console.log('Update result:', result);
            success(`Quiz ${action}d successfully! ${!currentStatus ? 'Students can now take this quiz.' : 'Quiz is now hidden from students.'}`);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error(`Failed to ${action} quiz:`, err);
            error(`Failed to ${action} quiz: ${err.data?.detail || err.message || 'Unknown error'}`);
        }
    };

    const handleBulkUploadSuccess = (result) => {
        if (result.success > 0) {
            success(`Successfully uploaded ${result.success} quiz${result.success !== 1 ? 'zes' : ''}!`);
        }
        if (result.failed > 0 && result.failedQuizzes && result.failedQuizzes.length > 0) {
            // Show each failed quiz with its error
            result.failedQuizzes.forEach((failedQuiz, idx) => {
                setTimeout(() => {
                    error(`Failed: ${failedQuiz.title}\nReason: ${failedQuiz.error}`);
                }, idx * 100); // Stagger the error notifications
            });
            console.error('Failed quizzes details:', result.failedQuizzes);
        } else if (result.failed > 0) {
            error(`${result.failed} quiz${result.failed !== 1 ? 'zes' : ''} failed to upload`);
        }
        setRefreshTrigger(prev => prev + 1);
    };

    if (showCreateQuizInline) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => setShowCreateQuizInline(false)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                    ← Back to Quiz Management
                </button>
                <QuizCreator
                    embedded
                    onDone={() => {
                        setShowCreateQuizInline(false);
                        setRefreshTrigger(prev => prev + 1);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
                        <p className="text-gray-600 mt-1">Create and manage quizzes for students</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition shadow-md"
                            title="Refresh quiz list"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={() => setShowBulkUpload(true)}
                            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-lg"
                        >
                            <Upload size={20} className="mr-2" />
                            Bulk Upload
                        </button>
                        <button
                            onClick={() => setShowCreateQuizInline(true)}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
                        >
                            <Plus size={20} className="mr-2" />
                            Create New Quiz
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading quizzes...</p>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quizzes Yet</h3>
                        <p className="text-gray-500 mb-6">Start by creating your first quiz for students</p>
                        <button
                            onClick={() => setShowCreateQuizInline(true)}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
                        >
                            <Plus size={20} className="mr-2" />
                            Create First Quiz
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className={`border-2 rounded-xl p-6 transition ${
                                quiz.is_active 
                                    ? 'border-green-200 bg-green-50/30 hover:border-green-300' 
                                    : 'border-gray-200 bg-gray-50/30 hover:border-gray-300'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                quiz.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {quiz.is_active ? '🟢 LIVE' : '⚪ Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mt-1">{quiz.description}</p>
                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                            <span className="flex items-center">
                                                <FileText size={16} className="mr-1" />
                                                {quiz.questions?.length || quiz.total_questions || 0} Questions
                                            </span>
                                            <span className="flex items-center">
                                                <Clock size={16} className="mr-1" />
                                                {quiz.duration_minutes || 30} mins
                                            </span>
                                            <span className="flex items-center">
                                                <Users size={16} className="mr-1" />
                                                {quiz.attempts || 0} Attempts
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {quiz.is_active ? (
                                            <button 
                                                onClick={() => handleToggleQuizStatus(quiz.id, quiz.is_active)}
                                                className="px-3 py-2 rounded-lg font-semibold transition text-sm text-orange-600 hover:bg-orange-50 border border-orange-200"
                                            >
                                                🔴 Stop
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setAssignQuizModal({ open: true, quiz })}
                                                className="px-3 py-2 rounded-lg font-semibold transition text-sm text-green-600 hover:bg-green-50 border border-green-200"
                                            >
                                                🟢 Go Live
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => navigate(`/quiz/${quiz.id}/take`)}
                                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition text-sm"
                                        >
                                            Preview
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/quiz/edit/${quiz.id}`)}
                                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteQuiz(quiz.id)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bulk Quiz Upload Modal */}
            <BulkQuizUploadModal
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={handleBulkUploadSuccess}
            />

            {/* Quiz Assignment Modal */}
            <QuizAssignmentModal
                isOpen={assignQuizModal.open}
                quiz={assignQuizModal.quiz}
                onClose={() => setAssignQuizModal({ open: false, quiz: null })}
                onSuccess={() => {
                    success('Quiz assignment updated successfully!');
                    fetchQuizzes();
                }}
            />
        </div>
    );
};

// Admin Quiz Monitoring - View all teachers' work
const AdminQuizMonitoring = () => {
    const { error } = useToast();
    const [quizzes, setQuizzes] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterTeacher, setFilterTeacher] = useState('all');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [quizzesData, usersData] = await Promise.all([
                quizAPI.getAllQuizzes(),
                userAPI.getAllUsers()
            ]);
            setQuizzes(quizzesData || []);
            setUsers(usersData || []);
        } catch (err) {
            console.error('Dashboard data error:', err);
            console.error('Error details:', err.data);
            console.error('Error status:', err.status);
            error(err.data?.detail || err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const teachers = users.filter(u => u.role === 'teacher');
    const filteredQuizzes = filterTeacher === 'all' 
        ? quizzes 
        : quizzes.filter(q => q.creator_id === parseInt(filterTeacher));

    // Group quizzes by teacher
    const quizzesByTeacher = teachers.map(teacher => ({
        teacher,
        quizzes: quizzes.filter(q => q.creator_id === teacher.id),
        totalQuizzes: quizzes.filter(q => q.creator_id === teacher.id).length,
        totalAttempts: quizzes.filter(q => q.creator_id === teacher.id)
            .reduce((sum, q) => sum + (q.attempts || 0), 0)
    }));

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Quiz Monitoring Dashboard</h2>
                        <p className="text-gray-600 mt-1">Monitor all teachers' quiz activities</p>
                    </div>
                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition shadow-md"
                        title="Refresh data"
                    >
                        <RefreshCw size={20} className="mr-2" />
                        Refresh
                    </button>
                </div>

                {/* Teacher Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                        <div className="text-sm text-blue-600 font-semibold">Total Teachers</div>
                        <div className="text-3xl font-bold text-blue-900 mt-1">{teachers.length}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                        <div className="text-sm text-green-600 font-semibold">Total Quizzes</div>
                        <div className="text-3xl font-bold text-green-900 mt-1">{quizzes.length}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                        <div className="text-sm text-purple-600 font-semibold">Total Attempts</div>
                        <div className="text-3xl font-bold text-purple-900 mt-1">
                            {quizzes.reduce((sum, q) => sum + (q.attempts || 0), 0)}
                        </div>
                    </div>
                </div>

                {/* Filter by Teacher */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Filter by Teacher
                    </label>
                    <select
                        value={filterTeacher}
                        onChange={(e) => setFilterTeacher(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    >
                        <option value="all">All Teachers</option>
                        {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name} ({teacher.email})
                            </option>
                        ))}
                    </select>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading data...</p>
                    </div>
                ) : (
                    <div>
                        {/* Teacher Activity Table */}
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Teacher Activity Summary</h3>
                        <div className="overflow-x-auto mb-8">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Teacher</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Quizzes Created</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Attempts</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {quizzesByTeacher.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                No teachers found
                                            </td>
                                        </tr>
                                    ) : (
                                        quizzesByTeacher.map(({ teacher, totalQuizzes, totalAttempts }) => (
                                            <tr key={teacher.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">{teacher.first_name} {teacher.last_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                    {teacher.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                                        {totalQuizzes}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                                        {totalAttempts}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                        totalQuizzes > 0 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {totalQuizzes > 0 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Detailed Quiz List */}
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Quiz Details {filterTeacher !== 'all' && `(${teachers.find(t => t.id === parseInt(filterTeacher))?.name})`}
                        </h3>
                        {filteredQuizzes.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No quizzes found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredQuizzes.map((quiz) => {
                                    const creator = users.find(u => u.id === quiz.creator_id);
                                    return (
                                        <div key={quiz.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                            {quiz.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 mb-2">{quiz.description}</p>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-sm text-gray-500">Created by:</span>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {creator ? `${creator.first_name} ${creator.last_name}` : 'Unknown'} ({creator?.email || 'N/A'})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center">
                                                            <FileText size={16} className="mr-1" />
                                                            {quiz.questions?.length || quiz.total_questions || 0} Questions
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Clock size={16} className="mr-1" />
                                                            {quiz.duration_minutes || 30} mins
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Users size={16} className="mr-1" />
                                                            {quiz.attempts || 0} Attempts
                                                        </span>
                                                        {quiz.department && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                                                {quiz.department}
                                                            </span>
                                                        )}
                                                        {quiz.year && (
                                                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                                                                Year {quiz.year}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Settings Component
const SettingsComponent = () => {
    const { success, error } = useToast();
    const [activeSection, setActiveSection] = useState('departments');
    
    // Load from localStorage or use defaults
    const [departments, setDepartments] = useState(() => {
        const saved = localStorage.getItem('quiz_departments');
        return saved ? JSON.parse(saved) : [
            'Computer Science Engg.',
            'Mechanical Engineering',
            'Electrical Engineering',
            'Civil Engineering',
            'Electronics & Communication'
        ];
    });
    
    const [newDepartment, setNewDepartment] = useState('');
    
    const [gradingScale, setGradingScale] = useState(() => {
        const saved = localStorage.getItem('quiz_grading_scale');
        return saved ? JSON.parse(saved) : [
            { grade: 'A+', minPercentage: 90, maxPercentage: 100 },
            { grade: 'A', minPercentage: 80, maxPercentage: 89 },
            { grade: 'B+', minPercentage: 70, maxPercentage: 79 },
            { grade: 'B', minPercentage: 60, maxPercentage: 69 },
            { grade: 'C', minPercentage: 50, maxPercentage: 59 },
            { grade: 'D', minPercentage: 40, maxPercentage: 49 },
            { grade: 'F', minPercentage: 0, maxPercentage: 39 }
        ];
    });
    
    const [platformSettings, setPlatformSettings] = useState(() => {
        const saved = localStorage.getItem('quiz_platform_settings');
        return saved ? JSON.parse(saved) : {
            defaultQuizDuration: 30,
            defaultGracePeriod: 5,
            defaultMarksPerQuestion: 1,
            defaultNegativeMarking: 0,
            maxQuestionsPerQuiz: 100,
            minQuestionsPerQuiz: 1,
            allowStudentRetake: false,
            showResultsImmediately: true
        };
    });

    const handleAddDepartment = () => {
        if (!newDepartment.trim()) {
            error('Please enter a department name');
            return;
        }
        if (departments.includes(newDepartment.trim())) {
            error('Department already exists');
            return;
        }
        const updated = [...departments, newDepartment.trim()];
        setDepartments(updated);
        localStorage.setItem('quiz_departments', JSON.stringify(updated));
        setNewDepartment('');
        success('Department added successfully');
    };

    const handleRemoveDepartment = (dept) => {
        const updated = departments.filter(d => d !== dept);
        setDepartments(updated);
        localStorage.setItem('quiz_departments', JSON.stringify(updated));
        success('Department removed successfully');
    };

    const handleSaveGradingScale = () => {
        // Validate grading scale
        const sorted = [...gradingScale].sort((a, b) => b.minPercentage - a.minPercentage);
        let valid = true;
        
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].minPercentage > sorted[i].maxPercentage) {
                valid = false;
                break;
            }
        }

        if (!valid) {
            error('Invalid grading scale: Min percentage cannot be greater than max percentage');
            return;
        }

        localStorage.setItem('quiz_grading_scale', JSON.stringify(gradingScale));
        success('Grading scale saved successfully');
    };

    const handleSavePlatformSettings = () => {
        if (platformSettings.defaultQuizDuration < 1) {
            error('Quiz duration must be at least 1 minute');
            return;
        }
        if (platformSettings.maxQuestionsPerQuiz < platformSettings.minQuestionsPerQuiz) {
            error('Max questions cannot be less than min questions');
            return;
        }
        localStorage.setItem('quiz_platform_settings', JSON.stringify(platformSettings));
        success('Platform settings saved successfully');
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-4">
                    <Settings size={32} className="flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-xl font-bold mb-2">Settings are Active!</h3>
                        <p className="text-blue-100 mb-2">
                            Your configurations are saved locally and will be applied across the platform:
                        </p>
                        <ul className="space-y-1 text-sm text-blue-50">
                            <li>✓ <strong>Departments:</strong> Available in user creation and quiz assignment filters</li>
                            <li>✓ <strong>Grading Scale:</strong> Used to calculate letter grades from quiz scores</li>
                            <li>✓ <strong>Platform Settings:</strong> Default values for new quizzes and system behavior</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h2>
                <p className="text-gray-600 mb-6">Configure platform settings and preferences</p>

                {/* Section Tabs */}
                <div className="flex space-x-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveSection('departments')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeSection === 'departments'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-blue-600'
                        }`}
                    >
                        Departments
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {departments.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveSection('grading')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeSection === 'grading'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-blue-600'
                        }`}
                    >
                        Grading Scale
                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            {gradingScale.length} grades
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveSection('platform')}
                        className={`px-6 py-3 font-semibold transition ${
                            activeSection === 'platform'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-blue-600'
                        }`}
                    >
                        Platform Settings
                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                            8 options
                        </span>
                    </button>
                </div>

                {/* Department Management */}
                {activeSection === 'departments' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg flex-1">
                                <p className="text-sm text-blue-900">
                                    <strong>Department Management:</strong> Add or remove departments for student classification.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const defaults = [
                                        'Computer Science Engg.',
                                        'Mechanical Engineering',
                                        'Electrical Engineering',
                                        'Civil Engineering',
                                        'Electronics & Communication'
                                    ];
                                    setDepartments(defaults);
                                    localStorage.setItem('quiz_departments', JSON.stringify(defaults));
                                    success('Reset to default departments');
                                }}
                                className="ml-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                            >
                                Reset to Defaults
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newDepartment}
                                onChange={(e) => setNewDepartment(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
                                placeholder="Enter department name"
                                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            />
                            <button
                                onClick={handleAddDepartment}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center"
                            >
                                <Plus size={20} className="mr-2" />
                                Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-700">Current Departments:</h3>
                            {departments.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No departments added yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {departments.map((dept, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                                        >
                                            <span className="font-medium text-gray-800">{dept}</span>
                                            <button
                                                onClick={() => handleRemoveDepartment(dept)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Grading Scale */}
                {activeSection === 'grading' && (
                    <div className="space-y-4">
                        <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-lg">
                            <p className="text-sm text-green-900">
                                <strong>Grading Scale:</strong> Define grade boundaries based on percentage scores.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Grade</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Min %</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Max %</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {gradingScale.map((scale, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={scale.grade}
                                                    onChange={(e) => {
                                                        const newScale = [...gradingScale];
                                                        newScale[index].grade = e.target.value;
                                                        setGradingScale(newScale);
                                                    }}
                                                    className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={scale.minPercentage}
                                                    onChange={(e) => {
                                                        const newScale = [...gradingScale];
                                                        newScale[index].minPercentage = parseInt(e.target.value) || 0;
                                                        setGradingScale(newScale);
                                                    }}
                                                    className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                                    min="0"
                                                    max="100"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={scale.maxPercentage}
                                                    onChange={(e) => {
                                                        const newScale = [...gradingScale];
                                                        newScale[index].maxPercentage = parseInt(e.target.value) || 0;
                                                        setGradingScale(newScale);
                                                    }}
                                                    className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                                    min="0"
                                                    max="100"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={handleSaveGradingScale}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition flex items-center"
                        >
                            <Save size={20} className="mr-2" />
                            Save Grading Scale
                        </button>
                    </div>
                )}

                {/* Platform Settings */}
                {activeSection === 'platform' && (
                    <div className="space-y-6">
                        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-lg">
                            <p className="text-sm text-purple-900">
                                <strong>Platform Settings:</strong> Configure default quiz parameters and behavior.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Quiz Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Default Quiz Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={platformSettings.defaultQuizDuration}
                                    onChange={(e) => setPlatformSettings({
                                        ...platformSettings,
                                        defaultQuizDuration: parseInt(e.target.value) || 30
                                    })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    min="1"
                                />
                            </div>

                            {/* Grace Period */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Default Grace Period (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={platformSettings.defaultGracePeriod}
                                    onChange={(e) => setPlatformSettings({
                                        ...platformSettings,
                                        defaultGracePeriod: parseInt(e.target.value) || 5
                                    })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    min="0"
                                />
                            </div>

                            {/* Marks Per Question */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Default Marks Per Question
                                </label>
                                <input
                                    type="number"
                                    value={platformSettings.defaultMarksPerQuestion}
                                    onChange={(e) => setPlatformSettings({
                                        ...platformSettings,
                                        defaultMarksPerQuestion: parseFloat(e.target.value) || 1
                                    })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    min="0"
                                    step="0.25"
                                />
                            </div>

                            {/* Negative Marking */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Default Negative Marking
                                </label>
                                <input
                                    type="number"
                                    value={platformSettings.defaultNegativeMarking}
                                    onChange={(e) => setPlatformSettings({
                                        ...platformSettings,
                                        defaultNegativeMarking: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    min="0"
                                    step="0.25"
                                />
                            </div>

                            {/* Max Questions */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Max Questions Per Quiz
                                </label>
                                <input
                                    type="number"
                                    value={platformSettings.maxQuestionsPerQuiz}
                                    onChange={(e) => setPlatformSettings({
                                        ...platformSettings,
                                        maxQuestionsPerQuiz: parseInt(e.target.value) || 100
                                    })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    min="1"
                                />
                            </div>

                            {/* Min Questions */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Min Questions Per Quiz
                                </label>
                                <input
                                    type="number"
                                    value={platformSettings.minQuestionsPerQuiz}
                                    onChange={(e) => setPlatformSettings({
                                        ...platformSettings,
                                        minQuestionsPerQuiz: parseInt(e.target.value) || 1
                                    })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Allow Student Retake</h4>
                                    <p className="text-sm text-gray-600">Students can retake quizzes multiple times</p>
                                </div>
                                <button
                                    onClick={() => setPlatformSettings({
                                        ...platformSettings,
                                        allowStudentRetake: !platformSettings.allowStudentRetake
                                    })}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                                        platformSettings.allowStudentRetake ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                                            platformSettings.allowStudentRetake ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Show Results Immediately</h4>
                                    <p className="text-sm text-gray-600">Display results right after quiz submission</p>
                                </div>
                                <button
                                    onClick={() => setPlatformSettings({
                                        ...platformSettings,
                                        showResultsImmediately: !platformSettings.showResultsImmediately
                                    })}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                                        platformSettings.showResultsImmediately ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                                            platformSettings.showResultsImmediately ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSavePlatformSettings}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center"
                        >
                            <Save size={20} className="mr-2" />
                            Save Platform Settings
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Summary Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Current Configuration Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Departments</div>
                        <div className="text-2xl font-bold text-blue-600">{departments.length}</div>
                        <div className="text-xs text-gray-500 mt-1">Available for classification</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Grade Levels</div>
                        <div className="text-2xl font-bold text-green-600">{gradingScale.length}</div>
                        <div className="text-xs text-gray-500 mt-1">From {gradingScale[gradingScale.length-1]?.grade} to {gradingScale[0]?.grade}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Default Duration</div>
                        <div className="text-2xl font-bold text-purple-600">{platformSettings.defaultQuizDuration} min</div>
                        <div className="text-xs text-gray-500 mt-1">For new quizzes</div>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-900">
                        <CheckCircle size={16} className="inline mr-2" />
                        <strong>All settings saved locally.</strong> Use the helper functions in <code className="bg-green-100 px-1 rounded">utils/settingsHelper.js</code> to access these configurations throughout the app.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Student Results View - Shows all quiz attempts with student performance
const StudentResultsView = () => {
    const { error, success } = useToast();
    const [attempts, setAttempts] = useState([]);
    const [students, setStudents] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterQuiz, setFilterQuiz] = useState('all');
    const [filterStudent, setFilterStudent] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchAllData();
    }, [refreshKey]);

    useEffect(() => {
        const onFocus = () => setRefreshKey(prev => prev + 1);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            // Fetch each resource individually to identify which one fails
            let usersData, quizzesData, attemptsData;
            
            try {
                usersData = await userAPI.getAllUsers();
            } catch (err) {
                throw new Error(`Users API failed: ${err.message}`);
            }
            
            try {
                quizzesData = await quizAPI.getAllQuizzes();
            } catch (err) {
                throw new Error(`Quizzes API failed: ${err.message}`);
            }
            
            try {
                attemptsData = await attemptAPI.getAllAttempts({});
            } catch (err) {
                // For APIError objects from fetchAPI
                if (err?.status) {
                    if (err.status === 403) {
                        attemptsData = [];
                    } else if (err.status === 404) {
                        attemptsData = [];
                    } else {
                        attemptsData = [];
                    }
                } else {
                    // Network or other error
                    attemptsData = [];
                }
                // Don't throw - just show empty results
            }

            const studentsList = usersData.filter(u => u.role === 'student');
            setStudents(studentsList);
            setQuizzes(quizzesData || []);
            setAttempts(attemptsData || []);
        } catch (err) {
            // Better error message formatting
            let errorMessage = 'Failed to load student results';
            if (typeof err === 'string') {
                errorMessage = err;
            } else if (err?.message) {
                errorMessage = err.message;
            } else if (err?.data?.detail) {
                errorMessage = err.data.detail;
            } else {
                errorMessage = JSON.stringify(err, null, 2);
            }
            error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter attempts
    const filteredAttempts = attempts.filter(attempt => {
        if (filterQuiz !== 'all' && attempt.quiz_id !== parseInt(filterQuiz)) return false;
        if (filterStudent !== 'all' && attempt.student_id !== parseInt(filterStudent)) return false;
        return true;
    });

    // Get student name by ID
    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
    };

    // Export to CSV
    const exportToCSV = () => {
        if (filteredAttempts.length === 0) {
            error('No data to export');
            return;
        }

        const headers = ['Student Name', 'Email', 'Quiz', 'Score', 'Total Marks', 'Percentage', 'Correct Answers', 'Total Questions', 'Time Taken', 'Submitted At', 'Status'];
        const csvData = filteredAttempts.map(attempt => [
            attempt.student_name || getStudentName(attempt.student_id),
            attempt.student_email || '',
            attempt.quiz_title || `Quiz ${attempt.quiz_id}`,
            attempt.score?.toFixed(1) || 0,
            attempt.quiz_total_marks || attempt.total_marks,
            (attempt.percentage || 0).toFixed(1) + '%',
            attempt.correct_answers || 0,
            attempt.total_questions || 0,
            attempt.time_taken || 'N/A',
            attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted',
            (attempt.percentage || 0) >= 60 ? 'Passed' : 'Failed'
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        success('Report exported successfully');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Quiz Results</h2>
                    <p className="text-gray-600">View all student quiz attempts and performance</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Refresh results"
                    >
                        <RefreshCw size={20} />
                        Refresh
                    </button>
                    <button
                        onClick={exportToCSV}
                        disabled={filteredAttempts.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download size={20} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Quiz</label>
                    <select
                        value={filterQuiz}
                        onChange={(e) => setFilterQuiz(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Quizzes</option>
                        {quizzes.map(quiz => (
                            <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Student</label>
                    <select
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Students</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.first_name} {student.last_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Attempts</div>
                    <div className="text-2xl font-bold text-blue-600">{filteredAttempts.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Average Score</div>
                    <div className="text-2xl font-bold text-green-600">
                        {filteredAttempts.length > 0
                            ? (filteredAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / filteredAttempts.length).toFixed(1)
                            : '0'}%
                    </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Pass Rate</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {filteredAttempts.length > 0
                            ? ((filteredAttempts.filter(a => (a.percentage || 0) >= 60).length / filteredAttempts.length) * 100).toFixed(1)
                            : '0'}%
                    </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Students Participated</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {new Set(filteredAttempts.map(a => a.student_id)).size}
                    </div>
                </div>
            </div>

            {/* Results Table */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading results...</p>
                </div>
            ) : filteredAttempts.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Quiz</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Percentage</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Correct/Total</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Time Taken</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Submitted</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAttempts.map((attempt) => {
                                const percentage = attempt.percentage || 0;
                                const passed = percentage >= 60;
                                
                                return (
                                    <tr key={attempt.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">
                                                {getStudentName(attempt.student_id)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {attempt.quiz_title || 'Quiz ' + attempt.quiz_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-gray-900">
                                                {attempt.score?.toFixed(1) || 0} / {attempt.quiz_total_marks || attempt.total_marks}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {attempt.correct_answers || 0} / {attempt.total_questions || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {attempt.time_taken || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {attempt.submitted_at 
                                                ? new Date(attempt.submitted_at).toLocaleString()
                                                : 'Not submitted'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {passed ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                    <CheckCircle size={14} />
                                                    Passed
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                    <XCircle size={14} />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <Trophy size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No quiz results found</p>
                </div>
            )}
        </div>
    );
};


/**
 * --- MAIN APPLICATION COMPONENT (Admin Dashboard) ---
 */
export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { success } = useToast();
    
    // userViewMode can be 'list' (show table) or 'add' (show form)
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [userViewMode, setUserViewMode] = useState('list');
    const [userListRefresh, setUserListRefresh] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsRefresh, setStatsRefresh] = useState(0);
    const [statsData, setStatsData] = useState(null);

    const fetchDashboardStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            if (user?.role === 'admin') {
                const data = await analyticsAPI.getDashboardStats();
                setStatsData({ kind: 'admin', data });
                return;
            }

            if (user?.role === 'teacher' && user?.id) {
                const data = await analyticsAPI.getTeacherStats(user.id);
                setStatsData({ kind: 'teacher', data });
                return;
            }

            if (user?.role === 'student' && user?.id) {
                const data = await analyticsAPI.getStudentStats(user.id);
                setStatsData({ kind: 'student', data });
                return;
            }

            setStatsData(null);
        } catch (_err) {
            // Keep the dashboard usable even if stats fail to load
            setStatsData(null);
        } finally {
            setStatsLoading(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats, statsRefresh]);

    // Refresh stats whenever user navigates back to Dashboard
    useEffect(() => {
        if (activeTab === 'Dashboard') {
            setStatsRefresh(prev => prev + 1);
        }
    }, [activeTab]);

    // Calculate dynamic stats from real user data
    const dynamicStats = useMemo(() => {
        if (statsData?.kind === 'admin' && statsData?.data) {
            const s = statsData.data;

            return [
                {
                    title: "Total Quizzes Held",
                    value: String(s.total_quizzes ?? 0),
                    icon: FileText,
                    color: "bg-blue-100/50 text-blue-800",
                    subtitle: `${s.active_quizzes ?? 0} active`,
                    trend: "Updated",
                },
                {
                    title: "Total Students",
                    value: String(s.total_students ?? 0),
                    icon: UserCheck,
                    color: "bg-indigo-100/50 text-indigo-800",
                    subtitle: `${s.active_students ?? 0} active`,
                    trend: "Updated",
                },
                {
                    title: "Total Teachers",
                    value: String(s.total_teachers ?? 0),
                    icon: Users,
                    color: "bg-green-100/50 text-green-800",
                    subtitle: `${s.active_teachers ?? 0} active`,
                    trend: "Updated",
                },
                {
                    title: "Total Attempts",
                    value: String(s.total_attempts ?? 0),
                    icon: Trophy,
                    color: "bg-yellow-100/50 text-yellow-800",
                    subtitle: `${s.yesterday_assessments ?? 0} yesterday`,
                    trend: "Updated",
                },
            ];
        }

        if (statsData?.kind === 'teacher' && statsData?.data) {
            const s = statsData.data;
            const avg = s.average_quiz_score;
            const avgLabel = avg === null || avg === undefined ? 'N/A' : `${avg}%`;

            return [
                {
                    title: "Quizzes Created",
                    value: String(s.total_quizzes_created ?? 0),
                    icon: FileText,
                    color: "bg-blue-100/50 text-blue-800",
                    subtitle: `${s.active_quizzes ?? 0} active`,
                    trend: "Updated",
                },
                {
                    title: "Students Attempted",
                    value: String(s.students_attempted ?? 0),
                    icon: Users,
                    color: "bg-indigo-100/50 text-indigo-800",
                    subtitle: "Unique students", 
                    trend: "Updated",
                },
                {
                    title: "Average Score",
                    value: avgLabel,
                    icon: TrendingUp,
                    color: "bg-green-100/50 text-green-800",
                    subtitle: "Completed attempts",
                    trend: "Updated",
                },
                {
                    title: "Questions Authored",
                    value: String(s.total_questions_authored ?? 0),
                    icon: ClipboardList,
                    color: "bg-yellow-100/50 text-yellow-800",
                    subtitle: `${s.subjects_taught ?? 0} subjects taught`,
                    trend: "Updated",
                },
            ];
        }

        if (statsData?.kind === 'student' && statsData?.data) {
            const s = statsData.data;
            const avgLabel = s.average_percentage === null || s.average_percentage === undefined
                ? 'N/A'
                : `${s.average_percentage}%`;

            return [
                {
                    title: "Quizzes Attempted",
                    value: String(s.total_quizzes_attempted ?? 0),
                    icon: FileText,
                    color: "bg-blue-100/50 text-blue-800",
                    subtitle: `${s.quizzes_completed ?? 0} completed`,
                    trend: "Updated",
                },
                {
                    title: "Average",
                    value: avgLabel,
                    icon: TrendingUp,
                    color: "bg-green-100/50 text-green-800",
                    subtitle: "Completed attempts",
                    trend: "Updated",
                },
                {
                    title: "Highest Score",
                    value: String(s.highest_score ?? 'N/A'),
                    icon: Trophy,
                    color: "bg-indigo-100/50 text-indigo-800",
                    subtitle: "Best attempt",
                    trend: "Updated",
                },
                {
                    title: "Pending Quizzes",
                    value: String(s.pending_quizzes ?? 0),
                    icon: Clock,
                    color: "bg-yellow-100/50 text-yellow-800",
                    subtitle: "Not attempted yet",
                    trend: "Updated",
                },
            ];
        }

        // Fallback cards (e.g., not logged in yet)
        return [
            {
                title: "Total Quizzes Held",
                value: "0",
                icon: FileText,
                color: "bg-blue-100/50 text-blue-800",
                subtitle: "Stats unavailable",
                trend: "N/A",
            },
            {
                title: "Total Students",
                value: "0",
                icon: UserCheck,
                color: "bg-indigo-100/50 text-indigo-800",
                subtitle: "Stats unavailable",
                trend: "N/A",
            },
            {
                title: "Total Teachers",
                value: "0",
                icon: Users,
                color: "bg-green-100/50 text-green-800",
                subtitle: "Stats unavailable",
                trend: "N/A",
            },
            {
                title: "Total Attempts",
                value: "0",
                icon: Trophy,
                color: "bg-yellow-100/50 text-yellow-800",
                subtitle: "Stats unavailable",
                trend: "N/A",
            },
        ];
    }, [statsData]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            success('Logged out successfully');
            navigate('/');
        }
    };

    // Handler when user is created successfully
    const handleUserCreated = () => {
        setUserListRefresh(prev => prev + 1); // Trigger refresh
        setStatsRefresh(prev => prev + 1);
    };

    // Role-based navigation
    const navItems = user?.role === 'teacher' ? [
        { name: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
        { name: "Quizzes", icon: FileText, title: "My Quizzes" },
        { name: "Students", icon: Users, title: "My Students" },
        { name: "Student Results", icon: Trophy, title: "Student Results" },
        { name: "SDC Team", icon: Code2, title: "SDC Team" },
        { name: "Settings", icon: Settings, title: "Settings" },
    ] : [
        { name: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
        { name: "Users", icon: Users, title: "User Management", onClick: () => setUserViewMode('list') },
        { name: "Teachers", icon: Users, title: "Teacher Activity Lookup" },
        { name: "Students", icon: Users, title: "Student Activity Lookup" },
        { name: "Quizzes", icon: FileText, title: "Quiz Management" },
        { name: "Student Results", icon: Trophy, title: "Student Results" },
        { name: "Detailed Reports", icon: BarChart3, title: "Detailed Reports" },
        { name: "SDC Team", icon: Code2, title: "SDC Team" },
        { name: "Settings", icon: Settings, title: "Settings" },
    ];

    // Handler to switch to Users tab and open the Add User form immediately
    const handleAddNewUser = () => {
        setActiveTab('Users');
        setUserViewMode('add');
    };

    const getCurrentTitle = () => {
        if (activeTab === 'Users' && userViewMode === 'add') {
            return 'Add New User';
        }
        const currentItem = navItems.find(item => item.name === activeTab);
        return currentItem ? currentItem.title : activeTab;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': { // Added braces to fix no-case-declarations
                return (
                    <div className="space-y-8">
                        {/* 4 Block Metrics (Colors reverted) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statsLoading ? (
                                // Loading skeleton
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-pulse">
                                        <div className="flex items-center justify-between">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="h-10 w-20 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                dynamicStats.map((stat) => (
                                    <StatCard key={stat.title} {...stat} />
                                ))
                            )}
                        </div>
                        {/* Quick Access Card (BG reverted) */}
                        <AddNewUserCard onAddClick={handleAddNewUser} />

                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                                Recent System Activity
                            </h2>
                            <div className="space-y-2">
                                <div className="text-center py-10 text-gray-500 text-lg">
                                    No activity recorded yet. Start by provisioning users and creating quizzes!
                                </div>
                            </div>
                        </div>
                    </div>
                );
            } // Added braces to fix no-case-declarations
            case 'Users':
                return userViewMode === 'add' ? (
                    <UserCreationForm 
                        onCancel={() => setUserViewMode('list')} 
                        onUserCreated={handleUserCreated}
                        currentUserRole={user?.role}
                    />
                ) : (
                    <UserList 
                        onAddClick={() => setUserViewMode('add')} 
                        refreshTrigger={userListRefresh}
                    />
                );
            // NEW CASES for dedicated sidebar links
            case 'Teachers':
                return <UserActivityTable userType="Teachers" />;
            case 'Students':
                return user?.role === 'teacher' 
                    ? <TeacherStudentsView />
                    : <UserActivityTable userType="Students" />;
            // Removed old 'Activity Tracker' case
            case 'Quizzes':
                // Teachers can create/manage quizzes, Admins can only monitor
                return user?.role === 'teacher' 
                    ? <TeacherQuizManagement /> 
                    : <AdminQuizMonitoring />;
            case 'Student Results':
                return <StudentResultsView />;
            case 'Detailed Reports':
                return <DetailedReportsTool />;
            case 'SDC Team':
                return <SdcTeamSection />;
            case 'Settings':
                return <SettingsComponent />;
            default:
                return <Placeholder content="Page Not Found" />;
        }
    };

    // Generic placeholder component for unimplemented tabs
    const Placeholder = ({ content }) => (
        <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center text-gray-500 h-96 flex items-center justify-center">
            <p className="text-2xl font-medium max-w-lg">{content}</p>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 font-inter">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b shadow-md p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setActiveTab('Dashboard')}
                        className="text-xl font-bold text-blue-600"
                    >
                        MacQuiz
                    </button>
                    <span className="text-sm text-gray-500">
                        {user?.role === 'teacher' ? 'Teacher' : 'Admin'}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white border-r shadow-lg z-20">
                <div className="p-6 text-2xl font-extrabold text-blue-700 border-b">
                    MacQuiz <span className="text-gray-400 font-light">
                        {user?.role === 'teacher' ? 'Teacher Portal' : 'Admin'}
                    </span>
                </div>
                <nav className="flex-1 p-4 flex flex-col min-h-0">
                    <div className="space-y-2 overflow-y-auto pr-1">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.name;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        setActiveTab(item.name);
                                        if (item.onClick) item.onClick();
                                    }}
                                    className={`w-full flex items-center p-3 rounded-xl transition duration-150 text-left space-x-3
                                        ${isActive
                                            ? 'bg-blue-600 text-white shadow-md' // Active: Blue BG, White Text
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600' // Hover: Light Gray BG, Blue Text
                                        }`}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium">{item.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 w-full overflow-x-hidden">
                {/* Header/Title with Profile Avatar */}
                <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            {getCurrentTitle()}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {activeTab === 'Dashboard' ? "System overview and quick access actions." : "Detailed views and management tools."}
                        </p>
                    </div>

                    {/* Top Right Controls - Hidden on mobile, shown on desktop */}
                    <div className="hidden sm:flex flex-col items-end gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 rounded-xl transition duration-150 text-red-500 hover:bg-red-50 border border-red-100"
                        >
                            <LogOut size={18} className="mr-2" />
                            <span className="font-medium">Logout</span>
                        </button>

                        <div className="flex flex-col items-end space-y-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md cursor-pointer hover:ring-4 ring-blue-300 transition duration-150">
                                AD
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800">Administrator</p>
                            <p className="text-xs text-gray-500">Admin ID: 001</p>
                        </div>
                    </div>
                </header>

                {renderContent()}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
                <div className="flex justify-around items-center py-2">
                    {navItems.slice(0, 4).map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                setActiveTab(item.name);
                                if (item.onClick) item.onClick();
                            }}
                            className={`flex flex-col items-center p-2 rounded-lg transition ${
                                activeTab === item.name
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="text-xs mt-1">{item.title.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </nav>

            <div className="fixed left-3 bottom-20 lg:bottom-4 z-40 pointer-events-none">
                <img
                    src="/SDC%20logo.png"
                    alt="SDC Logo"
                    className="w-[160px] sm:w-[180px] h-auto object-contain"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/SDC logo.png';
                    }}
                />
            </div>

        </div>
    );
}
import React, { useState, useEffect, useMemo } from "react";
import {
    LayoutDashboard, Users, Zap, FileText, Settings, LogOut, CheckCircle, Clock,
    TrendingUp, TrendingDown, ClipboardList, BarChart3, Search, Plus, X, List, Save, UserCheck, Calendar
} from 'lucide-react';

/**
 * --- MOCK DATA ---
 * Initializing all data to N/A or 0 until the administrator provisions users/quizzes.
 */
// 4 specific blocks for new mockStats data
const mockStats = [
    // Reverted to original Blue/Indigo/Yellow/Green theme
    { title: "Total Quizzes Held", value: "0", icon: FileText, color: "bg-blue-100/50 text-blue-800", subtitle: "No quizzes created yet", trend: "N/A" },
    { title: "Active / Total Students", value: "0 / 0", icon: UserCheck, color: "bg-indigo-100/50 text-indigo-800", subtitle: "Students with regular attempts", trend: "N/A" },
    { title: "Yesterday's Assessments", value: "0 / 0 students", icon: Zap, color: "bg-yellow-100/50 text-yellow-800", subtitle: "Assessments / Attendance", trend: "N/A" },
    { title: "Active Teachers Today", value: "0 / 0", icon: Users, color: "bg-green-100/50 text-green-800", subtitle: "No assessments conducted today", trend: "N/A" },
];

const mockActivity = []; // No activity until users are added

// Mock data for the new Activity Tracker Table
const mockTeacherData = []; // Detaabase mein data save hone tak khali
const mockStudentData = []; // Detaabase mein data save hone tak khali


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
            <Plus size={32} className="opacity-70 bg-white/20 p-1 rounded-full" />
        </div>
        {/* Reverted Button text color to blue */}
        <div className="mt-5 w-full bg-white text-blue-800 py-3 rounded-xl text-center font-semibold transition shadow-lg text-lg">
            Add Teacher / Student
        </div>
    </div>
);

// New Component: Form for creating new users
const UserCreationForm = ({ onCancel }) => {
    const [formData, setFormData] = useState({
        role: 'Student', // Default role
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        studentId: '', // Specific to student
        department: '',
        classYear: '1st Year'
    });
    const [excelFile, setExcelFile] = useState(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setExcelFile(file);
        if (file) {
            console.log("Reading file:", file.name);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (excelFile) {
            // Logic for bulk upload success/failure
            // Instead of alert, use a custom modal/message box
            console.log(`Excel File '${excelFile.name}' uploaded. Creating users in bulk...`);
        } else {
            // Logic for single user creation
            console.log("Submitting New User:", formData);
            // Instead of alert, use a custom modal/message box
        }

        onCancel(); // Close form after submission
    };

    const studentFields = formData.role === 'Student' && (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll No. / Student ID (Required)</label>
                <input type="text" name="studentId" value={formData.studentId} onChange={handleInputChange} required={formData.role === 'Student' && !excelFile} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class/Year</label>
                <select name="classYear" value={formData.classYear} onChange={handleInputChange} required={formData.role === 'Student' && !excelFile} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </>
    );

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Provision New User Account</h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-red-600 transition">
                    <X size={24} />
                </button>
            </div>

            {/* New Bulk Upload Section */}
            <div className="border border-dashed border-gray-400 p-6 rounded-xl mb-8 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                    <List size={20} className="mr-2 text-blue-600" /> {/* Reverted icon color */}
                    Bulk User Upload (Excel/CSV)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                    Upload an Excel file (.xlsx/.csv) with Roll No./ID and complete details to add users in bulk.
                </p>
                <div className="flex items-center space-x-3">
                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100" // Reverted file input color
                    />
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Or, Add Single User Manually</h3>

            <form onSubmit={handleSubmit} className="space-y-6" disabled={excelFile}>
                {/* User Role Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                    {/* Reverted accent color */}
                    <select name="role" value={formData.role} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg bg-blue-50 ring-2 ring-blue-500 font-semibold" disabled={excelFile}>
                        <option value="Teacher">Teacher / Professor</option>
                        <option value="Student">Student</option>
                    </select>
                </div>

                {/* Grid for main details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required={!excelFile} disabled={excelFile} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required={!excelFile} disabled={excelFile} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login ID)</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required={!excelFile} disabled={excelFile} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!excelFile} disabled={excelFile} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>

                {/* Student-specific fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select name="department" value={formData.department} onChange={handleInputChange} required={!excelFile} disabled={excelFile} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select Department</option>
                            {['Computer Science Engg.', 'Artificial Intelligence', 'Mechanical Engineering', 'Electrical Engineering'].map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    {studentFields}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onCancel} className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition">
                        <X size={20} className="mr-2" /> Cancel
                    </button>
                    {/* Reverted primary button color to blue */}
                    <button type="submit" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md">
                        <Save size={20} className="mr-2" /> Create User
                    </button>
                </div>
            </form>
        </div>
    );
};

// Component for listing existing users (Placeholder table)
const UserList = ({ onAddClick }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Existing Users</h2>
            {/* Reverted primary button color to blue */}
            <button onClick={onAddClick} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md">
                <Plus size={20} className="mr-2" /> Add New User
            </button>
        </div>
        <p className="text-center text-gray-500 py-12">
            A table view of all Teachers and Students will be displayed here, with edit/delete options.
        </p>
    </div>
);

// New Component: Unified Table for Teacher/Student Activity Lookup
const UserActivityTable = ({ userType }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Select data based on the current userType
    const currentData = userType === 'Teachers' ? mockTeacherData : mockStudentData;

    // Filter data based on search term (Name or ID/RollNo)
    const filteredData = currentData.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = user.name.toLowerCase().includes(searchLower);
        const idMatch = user.rollNo ? user.rollNo.toLowerCase().includes(searchLower) : false; // Only students have rollNo

        return nameMatch || idMatch;
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{userType} Activity Lookup</h2>

            {/* Search Bar (Prominently placed at the top) */}
            <div className="flex items-center space-x-2 w-full max-w-lg">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder={`Search ${userType} by Name or ${userType === 'Students' ? 'Roll No.' : 'ID'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" // Reverted focus ring
                    />
                    <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* User List Table */}
            <div className="overflow-x-auto border rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                            {userType === 'Students' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sem/Year</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.length > 0 ? filteredData.map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                {userType === 'Students' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.rollNo}</td>}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.branch}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.semYear}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActive}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-blue-600 hover:text-blue-900 text-xs font-bold">View Activity</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={userType === 'Students' ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                                    No {userType} found matching the search criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Component for Detailed Reports Tab
const DetailedReportsTool = () => {
    // Mock data for filter options
    const departments = ['All', 'CS Engg.', 'AI', 'Mechanical', 'Electrical'];
    const years = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
    // const semesters = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8']; // REMOVED STATIC ARRAY

    const [classYear, setClassYear] = useState(years[0]);
    const [department, setDepartment] = useState(departments[0]);
    const [semester, setSemester] = useState('All'); // Initialized to 'All'
    const [reportOutput, setReportOutput] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- NEW LOGIC TO CALCULATE SEMESTER OPTIONS BASED ON YEAR ---
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

    // Effect to reset semester when classYear changes, if the current semester is no longer valid
    useEffect(() => {
        if (!availableSemesters.includes(semester)) {
            setSemester('All');
        }
    }, [classYear, availableSemesters, semester]);
    // -------------------------------------------------------------------


    // Function to simulate report data based on filters
    const generateMockReportData = () => {
        // Return a sample of data that Gemini will analyze
        return `Report Data for ${classYear}, ${department}, Semester ${semester}:
        - ${classYear} ${department} Average Score: 68% (5% decrease vs last month).
        - Top 3 failing topics: 'Algorithms', 'Data Structures', 'Thermodynamics'.
        - Overall Quiz completion rate: 75%.
        - 12 students achieved A+ grade.
        - Teacher Activity (CS Engg.): Prof. A has not submitted a quiz in 4 weeks.
        - Need to address low attendance in 2nd Year Electrical Engineering.`;
    };

    // Function to call the Gemini API
    const analyzeReport = async () => {
        setIsGenerating(true);
        setReportOutput(null);

        // 1. Get the mock report data (which would normally come from a database query)
        const mockData = generateMockReportData();

        // 2. Define the prompt and system instruction for Gemini
        const systemPrompt = "You are a world-class Educational Data Analyst. Analyze the provided report findings and generate exactly four concise, actionable recommendations for the administrative team to improve student performance and system engagement. Use simple bullet points.";
        const userQuery = `Analyze the following educational assessment report data and provide administrative recommendations:\n\n${mockData}`;

        // 3. Construct the API payload (Placeholder for actual API call)
        // NOTE: The actual API call is skipped here as the environment is not available.
        // We will simulate a response for demonstration.

        // Simulation of API Call:
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for 1.5 seconds

        const simulatedAnalysis = `### Analysis for ${classYear} / ${department} / ${semester}
* **Targeted Remedial Action:** Focus on offering short, mandatory tutorials for students in **${classYear}** struggling with 'Algorithms' and 'Data Structures' to prevent cumulative failure.
* **Faculty Engagement Review:** Immediately follow up with **Prof. A (CS Engg.)** regarding the missing quiz submissions, as this directly impacts the overall completion rate.
* **Attendance Policy Reinforcement:** Implement a check-in process for **2nd Year Electrical Engineering** to address low attendance trends, potentially linking it to sessional marks.
* **A+ Student Utilization:** Launch a peer-tutoring initiative, leveraging the **12 A+ grade students** to mentor underperforming peers, improving overall class performance.
---
**Raw Data Preview:** ${mockData.substring(0, 100)}...`; // Using the generated data

        setReportOutput(simulatedAnalysis);
        setIsGenerating(false);
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
                        {departments.map(dept => (<option key={dept}>{dept}</option>))}
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

            {/* Gemini Analysis Output */}
            <div className="border-t pt-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Actionable Insights (Powered by Gemini)</h3>

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


/**
 * --- MAIN APPLICATION COMPONENT (Admin Dashboard) ---
 */
export default function App() {
    // userViewMode can be 'list' (show table) or 'add' (show form)
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [userViewMode, setUserViewMode] = useState('list');

    // NOTE: Removed 'Activity Tracker' and replaced with dedicated 'Teachers' and 'Students' links.
    const navItems = [
        { name: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
        { name: "Users", icon: Users, title: "User Management", onClick: () => setUserViewMode('list') },
        { name: "Teachers", icon: Users, title: "Teacher Activity Lookup" }, // NEW DEDICATED LINK
        { name: "Students", icon: Users, title: "Student Activity Lookup" }, // NEW DEDICATED LINK
        { name: "Quizzes", icon: FileText, title: "Quiz Management" },
        { name: "Detailed Reports", icon: BarChart3, title: "Detailed Reports" },
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
                const hasActivity = mockActivity.length > 0;
                return (
                    <div className="space-y-8">
                        {/* 4 Block Metrics (Colors reverted) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {mockStats.map((stat) => (
                                <StatCard key={stat.title} {...stat} />
                            ))}
                        </div>
                        {/* Quick Access Card (BG reverted) */}
                        <AddNewUserCard onAddClick={handleAddNewUser} />

                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                                Recent System Activity
                            </h2>
                            <div className="space-y-2">
                                {hasActivity ? (
                                    mockActivity.map((activity) => (
                                        <ActivityItem key={activity.id} {...activity} />
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-500 text-lg">
                                        No activity recorded yet. Start by provisioning users and creating quizzes!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            } // Added braces to fix no-case-declarations
            case 'Users':
                return userViewMode === 'add' ? (
                    <UserCreationForm onCancel={() => setUserViewMode('list')} />
                ) : (
                    <UserList onAddClick={() => setUserViewMode('add')} />
                );
            // NEW CASES for dedicated sidebar links
            case 'Teachers':
                return <UserActivityTable userType="Teachers" />;
            case 'Students':
                return <UserActivityTable userType="Students" />;
            // Removed old 'Activity Tracker' case
            case 'Quizzes':
                return <Placeholder content="Quiz Management: View and moderate all active and pending quiz submissions." />;
            case 'Detailed Reports':
                return <DetailedReportsTool />;
            case 'Settings':
                return <Placeholder content="System Configuration: Manage grading scales, departmental listings, and platform settings." />;
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
        <div className="min-h-screen flex bg-gray-50 font-inter">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white border-r shadow-lg z-20">
                <div className="p-6 text-2xl font-extrabold text-blue-700 border-b">
                    MacQuiz <span className="text-gray-400 font-light">Admin</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
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
                </nav>
                <div className="p-4 border-t">
                    <button
                        className="w-full flex items-center p-3 rounded-xl transition duration-150 text-red-500 hover:bg-red-50" // Logout: Red accent
                    >
                        <LogOut size={20} className="mr-3" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 p-4 md:p-8">
                {/* Header/Title with Profile Avatar */}
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            {getCurrentTitle()}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {activeTab === 'Dashboard' ? "System overview and quick access actions." : "Detailed views and management tools."}
                        </p>
                    </div>

                    {/* Profile Panel (Top Right) */}
                    <div className="flex flex-col items-end space-y-1">
                        {/* Reverted profile avatar BG to blue */}
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md cursor-pointer hover:ring-4 ring-blue-300 transition duration-150">
                            AD
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Administrator</p>
                        <p className="text-xs text-gray-500">Admin ID: 001</p>
                    </div>
                </header>

                {renderContent()}
            </main>
        </div>
    );
}
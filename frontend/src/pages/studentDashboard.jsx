import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { quizAPI, attemptAPI, API_BASE_URL } from '../services/api';
import {
    BookOpen, Trophy, Clock, LogOut, User, TrendingUp,
    Calendar, CheckCircle, XCircle, Award, BarChart3, FileText,
    PlayCircle, AlertCircle, RefreshCw
} from 'lucide-react';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { success, error } = useToast();

    const [activeTab, setActiveTab] = useState('Dashboard');
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageScore: 0,
        quizzesTaken: 0,
        bestScore: 0
    });

    // Fetch student's quizzes and attempts
    useEffect(() => {
        fetchDashboardData();
    }, [refreshTrigger]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch available quizzes (only active ones for students)
            try {
                const quizzesData = await quizAPI.getAllQuizzes();
                
                // Filter to show only active quizzes
                // Backend already filters by timing (live sessions) and department/year
                const activeQuizzes = (quizzesData || []).filter(quiz => quiz.is_active === true);
                
                setQuizzes(activeQuizzes);
            } catch (quizErr) {
                console.error('Failed to fetch quizzes:', quizErr);
                setQuizzes([]);
            }

            // Fetch student's attempts
            try {
                console.log('📊 Fetching student attempts...');
                const attemptsData = await attemptAPI.getMyAttempts();
                console.log('📊 Attempts data received:', attemptsData);
                setAttempts(attemptsData || []);

                // Calculate statistics
                if (attemptsData && attemptsData.length > 0) {
                    const totalScore = attemptsData.reduce((sum, att) => sum + (att.percentage || 0), 0);
                    const avgScore = totalScore / attemptsData.length;
                    const bestScore = Math.max(...attemptsData.map(att => att.percentage || 0));

                    const calculatedStats = {
                        totalAttempts: attemptsData.length,
                        averageScore: avgScore.toFixed(1),
                        quizzesTaken: new Set(attemptsData.map(att => att.quiz_id)).size,
                        bestScore: bestScore.toFixed(1)
                    };
                    console.log('📊 Calculated stats:', calculatedStats);
                    setStats(calculatedStats);
                } else {
                    console.log('📊 No attempts data found, keeping default stats');
                }
            } catch (attemptErr) {
                console.error('❌ Failed to fetch attempts:', attemptErr);
                console.error('Error details:', attemptErr.status, attemptErr.data);
                setAttempts([]);
            }
        } catch (err) {
            // Show specific error for network issues
            if (err.status === 0) {
                error(`Cannot connect to server. Please ensure the backend is reachable at ${API_BASE_URL || 'your configured API URL'}`);
            } else {
                error(err.data?.detail || err.message || 'Failed to load dashboard data');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            success('Logged out successfully');
            navigate('/');
        }
    };

    // Stat Card component
    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon size={24} />
                </div>
                <div className="text-sm font-medium text-gray-500">{title}</div>
            </div>
            <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">{value}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        </div>
    );

    // Quiz Card component
    const QuizCard = ({ quiz }) => {
        const handleStartQuiz = () => {
            navigate(`/quiz/${quiz.id}/take`);
        };

        const isLiveNow = quiz.is_live_session && quiz.live_start_time && quiz.live_end_time &&
            new Date() >= new Date(quiz.live_start_time) && new Date() <= new Date(quiz.live_end_time);

        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition duration-300">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-800">{quiz.title || 'Untitled Quiz'}</h3>
                            {isLiveNow && (
                                <span className="flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-500 animate-pulse">
                                    <span className="w-2 h-2 bg-red-600 rounded-full mr-1 animate-ping"></span>
                                    LIVE NOW
                                </span>
                            )}
                            {quiz.is_live_session && !isLiveNow && quiz.live_start_time && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                    Scheduled Live
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{quiz.description || 'No description available'}</p>
                        {quiz.is_live_session && quiz.live_start_time && (
                            <p className="text-xs text-gray-500 mt-1">
                                📅 {new Date(quiz.live_start_time).toLocaleString()}
                            </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center">
                                <FileText size={16} className="mr-1" />
                                {quiz.total_questions || 0} Questions
                            </span>
                            <span className="flex items-center">
                                <Clock size={16} className="mr-1" />
                                {quiz.duration_minutes || 30} mins
                            </span>
                            <span className="flex items-center">
                                <Trophy size={16} className="mr-1" />
                                {quiz.total_marks || 0} marks
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleStartQuiz}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
                    >
                        <PlayCircle size={18} />
                        Start
                    </button>
                </div>
            </div>
        );
    };

    // Attempt History Row
    const AttemptRow = ({ attempt, index }) => {
        const scorePercent = attempt.percentage || 0;
        const scoreColor = scorePercent >= 80 ? 'text-green-600' : scorePercent >= 60 ? 'text-yellow-600' : 'text-red-600';
        const statusIcon = scorePercent >= 60 ? CheckCircle : XCircle;
        const StatusIcon = statusIcon;

        return (
            <tr className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{attempt.quiz_title || 'Quiz'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                    {attempt.submitted_at || attempt.started_at 
                        ? new Date(attempt.submitted_at || attempt.started_at).toLocaleDateString()
                        : 'N/A'}
                </td>
                <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${scoreColor} flex items-center gap-1`}>
                        <StatusIcon size={16} />
                        {scorePercent}%
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                    {attempt.time_taken || (attempt.time_taken_minutes 
                        ? `${Math.floor(attempt.time_taken_minutes)}m ${Math.floor((attempt.time_taken_minutes % 1) * 60)}s`
                        : 'N/A')}
                </td>
            </tr>
        );
    };

    const navItems = [
        { name: "Dashboard", icon: BookOpen },
        { name: "Available Quizzes", icon: FileText },
        { name: "My Progress", icon: BarChart3 },
        { name: "Profile", icon: User },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                return (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Attempts"
                                value={stats.totalAttempts}
                                icon={Trophy}
                                color="bg-blue-100/50 text-blue-800"
                                subtitle={`${stats.totalAttempts} quiz${stats.totalAttempts !== 1 ? 'zes' : ''} completed`}
                            />
                            <StatCard
                                title="Average Score"
                                value={`${stats.averageScore}%`}
                                icon={TrendingUp}
                                color="bg-indigo-100/50 text-indigo-800"
                                subtitle="Your overall performance"
                            />
                            <StatCard
                                title="Quizzes Taken"
                                value={stats.quizzesTaken}
                                icon={FileText}
                                color="bg-green-100/50 text-green-800"
                                subtitle={`${stats.quizzesTaken} unique quiz${stats.quizzesTaken !== 1 ? 'zes' : ''}`}
                            />
                            <StatCard
                                title="Best Score"
                                value={`${stats.bestScore}%`}
                                icon={Award}
                                color="bg-yellow-100/50 text-yellow-800"
                                subtitle="Your highest achievement"
                            />
                        </div>

                        {/* Recent Quizzes */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <div className="flex justify-between items-center border-b pb-4 mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Available Quizzes
                                </h2>
                                <button
                                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                                    className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                    title="Refresh quizzes"
                                >
                                    <RefreshCw size={18} className="mr-2" />
                                    Refresh
                                </button>
                            </div>
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">Loading quizzes...</div>
                            ) : quizzes.length > 0 ? (
                                <div className="space-y-4">
                                    {quizzes.slice(0, 3).map(quiz => (
                                        <QuizCard key={quiz.id} quiz={quiz} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <AlertCircle size={48} className="mx-auto mb-3 text-gray-400" />
                                    <p>No quizzes available at the moment</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Attempts */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                                Recent Attempts
                            </h2>
                            {attempts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Quiz</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Score</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attempts.slice(0, 5).map((attempt, idx) => (
                                                <AttemptRow key={attempt.id} attempt={attempt} index={idx} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <AlertCircle size={48} className="mx-auto mb-3 text-gray-400" />
                                    <p>No quiz attempts yet. Start your first quiz!</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'Available Quizzes':
                return (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">
                                All Available Quizzes
                            </h2>
                            <button
                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                title="Refresh quizzes"
                            >
                                <RefreshCw size={18} className="mr-2" />
                                Refresh
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading quizzes...</div>
                        ) : quizzes.length > 0 ? (
                            <div className="space-y-4">
                                {quizzes.map(quiz => (
                                    <QuizCard key={quiz.id} quiz={quiz} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <AlertCircle size={48} className="mx-auto mb-3 text-gray-400" />
                                <p>No quizzes available at the moment</p>
                            </div>
                        )}
                    </div>
                );

            case 'My Progress':
                return (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                            My Quiz History
                        </h2>
                        {attempts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Quiz</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Score</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attempts.map((attempt, idx) => (
                                            <AttemptRow key={attempt.id} attempt={attempt} index={idx} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <AlertCircle size={48} className="mx-auto mb-3 text-gray-400" />
                                <p>No quiz attempts yet. Start your first quiz!</p>
                            </div>
                        )}
                    </div>
                );

            case 'Profile':
                return (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                            My Profile
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Name</label>
                                <p className="text-lg text-gray-900">{user?.first_name} {user?.last_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Email</label>
                                <p className="text-lg text-gray-900">{user?.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Student ID</label>
                                <p className="text-lg text-gray-900">{user?.student_id || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Class Year</label>
                                <p className="text-lg text-gray-900">{user?.class_year || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Show loading screen if user data is not loaded
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Verify user role
    if (user.role !== 'student') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">This dashboard is only accessible to students.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col lg:flex-row">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b shadow-md p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setActiveTab('Dashboard')}
                        className="text-xl font-bold text-blue-600"
                    >
                        MacQuiz
                    </button>
                    <span className="text-sm text-gray-500">Student</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-lg">
                <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h1 className="text-2xl font-bold text-white">MacQuiz</h1>
                    <p className="text-blue-100 text-sm mt-1">Student Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-150 ${
                                activeTab === item.name
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-150 text-red-500 hover:bg-red-50"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 w-full overflow-x-hidden">
                {/* Header */}
                <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">{activeTab}</h1>
                        <p className="text-gray-500 mt-1">
                            Welcome back, {user?.first_name}!
                        </p>
                    </div>

                    {/* Profile Avatar - Hidden on mobile */}
                    <div className="hidden sm:flex flex-col items-end space-y-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md cursor-pointer hover:ring-4 ring-blue-300 transition duration-150">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-500">Student</p>
                    </div>
                </header>

                {renderContent()}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
                <div className="flex justify-around items-center py-2">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`flex flex-col items-center p-2 rounded-lg transition ${
                                activeTab === item.name
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="text-xs mt-1">{item.name === 'Available Quizzes' ? 'Quizzes' : item.name}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default StudentDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { quizAPI, attemptAPI } from '../services/api';
import {
    BookOpen, Trophy, Clock, LogOut, User, TrendingUp,
    Calendar, CheckCircle, XCircle, Award, BarChart3, FileText,
    PlayCircle, AlertCircle
} from 'lucide-react';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { success, error } = useToast();

    const [activeTab, setActiveTab] = useState('Dashboard');
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageScore: 0,
        quizzesTaken: 0,
        bestScore: 0
    });

    // Fetch student's quizzes and attempts
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch available quizzes
            const quizzesData = await quizAPI.getAllQuizzes();
            setQuizzes(quizzesData || []);

            // Fetch student's attempts
            const attemptsData = await attemptAPI.getMyAttempts();
            setAttempts(attemptsData || []);

            // Calculate statistics
            if (attemptsData && attemptsData.length > 0) {
                const totalScore = attemptsData.reduce((sum, att) => sum + (att.score || 0), 0);
                const avgScore = totalScore / attemptsData.length;
                const bestScore = Math.max(...attemptsData.map(att => att.score || 0));

                setStats({
                    totalAttempts: attemptsData.length,
                    averageScore: avgScore.toFixed(1),
                    quizzesTaken: new Set(attemptsData.map(att => att.quiz_id)).size,
                    bestScore: bestScore.toFixed(1)
                });
            }
        } catch (err) {
            error('Failed to load dashboard data');
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
    const QuizCard = ({ quiz }) => (
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition duration-300">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{quiz.title || 'Untitled Quiz'}</h3>
                    <p className="text-sm text-gray-600 mt-1">{quiz.description || 'No description available'}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center">
                            <FileText size={16} className="mr-1" />
                            {quiz.questions?.length || 0} Questions
                        </span>
                        <span className="flex items-center">
                            <Clock size={16} className="mr-1" />
                            {quiz.time_limit || 30} mins
                        </span>
                    </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <PlayCircle size={18} />
                    Start
                </button>
            </div>
        </div>
    );

    // Attempt History Row
    const AttemptRow = ({ attempt, index }) => {
        const scorePercent = attempt.score || 0;
        const scoreColor = scorePercent >= 80 ? 'text-green-600' : scorePercent >= 60 ? 'text-yellow-600' : 'text-red-600';
        const statusIcon = scorePercent >= 60 ? CheckCircle : XCircle;
        const StatusIcon = statusIcon;

        return (
            <tr className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{attempt.quiz_title || 'Quiz'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(attempt.submitted_at || attempt.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${scoreColor} flex items-center gap-1`}>
                        <StatusIcon size={16} />
                        {scorePercent}%
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{attempt.time_taken || 'N/A'}</td>
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
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                                Available Quizzes
                            </h2>
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
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                            All Available Quizzes
                        </h2>
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
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
            <main className="flex-1 lg:ml-64 p-4 md:p-8">
                {/* Header */}
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">{activeTab}</h1>
                        <p className="text-gray-500 mt-1">
                            Welcome back, {user?.first_name}!
                        </p>
                    </div>

                    {/* Profile Avatar */}
                    <div className="flex flex-col items-end space-y-1">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md cursor-pointer hover:ring-4 ring-blue-300 transition duration-150">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-500">Student</p>
                    </div>
                </header>

                {renderContent()}
            </main>
        </div>
    );
};

export default StudentDashboard;

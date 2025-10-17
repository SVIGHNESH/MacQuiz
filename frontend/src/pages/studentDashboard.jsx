import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { quizAPI, attemptAPI } from '../services/api';
import {
    BookOpen, Trophy, Clock, LogOut, User, TrendingUp,
    Calendar, CheckCircle, XCircle, Award, BarChart3
} from 'lucide-react';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showToast } = useToast();

    const [activeView, setActiveView] = useState('Dashboard');
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
            setQuizzes(quizzesData);

            // Fetch student's attempts
            const attemptsData = await attemptAPI.getMyAttempts();
            setAttempts(attemptsData);

            // Calculate statistics
            if (attemptsData.length > 0) {
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
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    const handleStartQuiz = (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    // Dashboard View - Overview and Stats
    const DashboardView = () => (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.first_name}! 👋</h2>
                <p className="text-blue-100">Ready to test your knowledge today?</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Attempts</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalAttempts}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <BookOpen className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Average Score</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.averageScore}%</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Quizzes Taken</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.quizzesTaken}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <CheckCircle className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Best Score</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.bestScore}%</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <Trophy className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Attempts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Quiz Attempts</h3>
                {attempts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <BookOpen className="mx-auto mb-3 text-gray-400" size={48} />
                        <p>No quiz attempts yet. Start your first quiz!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {attempts.slice(0, 5).map((attempt) => (
                            <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${attempt.score >= 70 ? 'bg-green-100' : attempt.score >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                        {attempt.score >= 70 ? (
                                            <CheckCircle className="text-green-600" size={20} />
                                        ) : (
                                            <XCircle className="text-red-600" size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Quiz #{attempt.quiz_id}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(attempt.submitted_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-800">{attempt.score}%</p>
                                    <p className="text-sm text-gray-500">Score</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Available Quizzes View
    const QuizzesView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Available Quizzes</h2>
                <button
                    onClick={fetchDashboardData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading quizzes...</p>
                </div>
            ) : quizzes.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                    <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Quizzes Available</h3>
                    <p className="text-gray-500">Check back later for new quizzes!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => {
                        const attemptCount = attempts.filter(att => att.quiz_id === quiz.id).length;
                        const bestAttempt = attempts
                            .filter(att => att.quiz_id === quiz.id)
                            .sort((a, b) => b.score - a.score)[0];

                        return (
                            <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <BookOpen className="text-blue-600" size={24} />
                                    </div>
                                    {bestAttempt && (
                                        <div className="bg-green-100 px-3 py-1 rounded-full">
                                            <p className="text-green-700 font-semibold text-sm">{bestAttempt.score}%</p>
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-800 mb-2">{quiz.title}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description || 'Test your knowledge!'}</p>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="mr-2" size={16} />
                                        <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="mr-2" size={16} />
                                        <span>Attempts: {attemptCount}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition"
                                >
                                    {attemptCount > 0 ? 'Retake Quiz' : 'Start Quiz'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // My Results View
    const ResultsView = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">My Quiz Results</h2>

            {attempts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                    <Trophy className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Results Yet</h3>
                    <p className="text-gray-500 mb-4">Take a quiz to see your results here!</p>
                    <button
                        onClick={() => setActiveView('Quizzes')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Browse Quizzes
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {attempts.map((attempt) => (
                                <tr key={attempt.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <BookOpen className="text-blue-600 mr-3" size={20} />
                                            <span className="font-medium text-gray-800">Quiz #{attempt.quiz_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(attempt.submitted_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-2xl font-bold text-gray-800">{attempt.score}%</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {attempt.score >= 70 ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center w-fit">
                                                <CheckCircle className="mr-1" size={16} />
                                                Passed
                                            </span>
                                        ) : attempt.score >= 50 ? (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                                Average
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center w-fit">
                                                <XCircle className="mr-1" size={16} />
                                                Needs Improvement
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    // Profile View
    const ProfileView = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <div className="bg-blue-100 p-6 rounded-full mr-6">
                        <User className="text-blue-600" size={48} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{user?.first_name} {user?.last_name}</h3>
                        <p className="text-gray-500">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Student ID</p>
                        <p className="text-lg font-semibold text-gray-800">{user?.student_id || 'N/A'}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Department</p>
                        <p className="text-lg font-semibold text-gray-800">{user?.department || 'N/A'}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Class Year</p>
                        <p className="text-lg font-semibold text-gray-800">{user?.class_year || 'N/A'}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Role</p>
                        <p className="text-lg font-semibold text-gray-800 capitalize">{user?.role}</p>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Performance Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{stats.totalAttempts}</p>
                            <p className="text-sm text-gray-500">Total Attempts</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{stats.averageScore}%</p>
                            <p className="text-sm text-gray-500">Average Score</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{stats.quizzesTaken}</p>
                            <p className="text-sm text-gray-500">Quizzes Taken</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-yellow-600">{stats.bestScore}%</p>
                            <p className="text-sm text-gray-500">Best Score</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'Dashboard':
                return <DashboardView />;
            case 'Quizzes':
                return <QuizzesView />;
            case 'Results':
                return <ResultsView />;
            case 'Profile':
                return <ProfileView />;
            default:
                return <DashboardView />;
        }
    };

    const menuItems = [
        { name: 'Dashboard', icon: BarChart3 },
        { name: 'Quizzes', icon: BookOpen },
        { name: 'Results', icon: Trophy },
        { name: 'Profile', icon: User }
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">MacQuiz</h1>
                    <p className="text-sm text-gray-500 mt-1">Student Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.name;
                        return (
                            <button
                                key={item.name}
                                onClick={() => setActiveView(item.name)}
                                className={`w-full flex items-center p-3 rounded-xl transition duration-150 ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-600 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Icon size={20} className="mr-3" />
                                <span className="font-medium">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-3 rounded-xl transition duration-150 text-red-500 hover:bg-red-50"
                    >
                        <LogOut size={20} className="mr-3" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;

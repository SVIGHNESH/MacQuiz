import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { quizAPI, attemptAPI } from "../../services/api";
import { getGradeFromPercentage } from "../../utils/settingsHelper";
import { FileText, Clock, Trophy } from 'lucide-react';

const StudentUnifiedView = ({ activeTab, user, profileImage, onPickProfileImage, onRemoveProfileImage }) => {
    const navigate = useNavigate();
    const { error } = useToast();
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [quizzesData, attemptsData] = await Promise.all([
                quizAPI.getAllQuizzes().catch(() => []),
                attemptAPI.getMyAttempts().catch(() => []),
            ]);

            const activeQuizzes = Array.isArray(quizzesData)
                ? quizzesData.filter((quiz) => quiz && quiz.is_active === true)
                : [];

            setQuizzes(activeQuizzes);
            setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
        } catch (err) {
            error(err?.data?.detail || err?.message || 'Failed to load student data');
            setQuizzes([]);
            setAttempts([]);
        } finally {
            setIsLoading(false);
        }
    }, [error]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const QuizCard = ({ quiz }) => (
        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
            <div className="flex justify-between items-start gap-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{quiz.title || 'Untitled Quiz'}</h3>
                    <p className="text-sm text-gray-600 mt-1">{quiz.description || 'No description available'}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center"><FileText size={15} className="mr-1" />{quiz.total_questions || 0} Qs</span>
                        <span className="flex items-center"><Clock size={15} className="mr-1" />{quiz.duration_minutes || 30} mins</span>
                        <span className="flex items-center"><Trophy size={15} className="mr-1" />{quiz.total_marks || 0} marks</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/quiz/${quiz.id}/take`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Start
                </button>
            </div>
        </div>
    );

    if (activeTab === 'Profile') {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h2>
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-white font-bold text-2xl">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={onPickProfileImage}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                        >
                            Upload Image
                        </button>
                        {profileImage && (
                            <button
                                onClick={onRemoveProfileImage}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                    <div><span className="text-gray-500">Name:</span> {user?.first_name} {user?.last_name}</div>
                    <div><span className="text-gray-500">Email:</span> {user?.email}</div>
                    <div><span className="text-gray-500">Student ID:</span> {user?.student_id || 'N/A'}</div>
                    <div><span className="text-gray-500">Class:</span> {user?.class_year || 'N/A'}</div>
                </div>
            </div>
        );
    }

    if (activeTab === 'My Progress') {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Progress</h2>
                {isLoading ? (
                    <p className="text-gray-500">Loading progress...</p>
                ) : attempts.length === 0 ? (
                    <p className="text-gray-500">No attempts yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Quiz</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Score</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Grade</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Submitted</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.map((attempt) => {
                                    const percentage = attempt.percentage || 0;
                                    const grade = getGradeFromPercentage(percentage);
                                    return (
                                        <tr key={attempt.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-800">{attempt.quiz_title || `Quiz ${attempt.quiz_id}`}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{percentage.toFixed(1)}%</td>
                                            <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{grade}</span></td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {attempt.is_completed ? (
                                                    <button
                                                        onClick={() => navigate(`/quiz-result/${attempt.id}`)}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-semibold"
                                                    >
                                                        View Result
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">In Progress</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'My Quizzes') {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">My Quizzes</h2>
                {isLoading ? <p className="text-gray-500">Loading quizzes...</p> : quizzes.length > 0 ? quizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} />) : <p className="text-gray-500">No quizzes available right now.</p>}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
                    <p className="text-sm text-gray-600">Total Attempts</p>
                    <p className="text-3xl font-bold text-blue-600">{attempts.length}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-green-600">
                        {attempts.length ? (attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length).toFixed(1) : '0.0'}%
                    </p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
                    <p className="text-sm text-gray-600">Available Quizzes</p>
                    <p className="text-3xl font-bold text-purple-600">{quizzes.length}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Quick Start</h2>
                    <button onClick={fetchData} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">Refresh</button>
                </div>
                {isLoading ? <p className="text-gray-500">Loading quizzes...</p> : quizzes.slice(0, 3).map((quiz) => <QuizCard key={quiz.id} quiz={quiz} />)}
                {!isLoading && quizzes.length === 0 && <p className="text-gray-500">No quizzes available right now.</p>}
            </div>
        </div>
    );
};

export default StudentUnifiedView;

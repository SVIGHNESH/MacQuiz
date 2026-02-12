import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { attemptAPI } from '../services/api';
import { getGradeFromPercentage } from '../utils/settingsHelper';
import {
    Trophy, Clock, CheckCircle, XCircle, Award, ArrowLeft,
    BarChart3, Target, TrendingUp, Home
} from 'lucide-react';

const QuizResult = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const { error } = useToast();

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const data = await attemptAPI.getAttempt(attemptId);
                setResult(data);
            } catch {
                error('Failed to load quiz result');
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchResult();
    }, [attemptId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading results...</p>
                </div>
            </div>
        );
    }

    const percentage = result?.percentage || 0;
    const grade = getGradeFromPercentage(percentage);
    const passed = grade !== 'F' && grade !== 'N/A';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className={`bg-gradient-to-r ${passed ? 'from-green-600 to-emerald-600' : 'from-red-600 to-pink-600'} text-white rounded-3xl shadow-2xl p-12 mb-8 text-center`}>
                    <div className="mb-6">
                        {passed ? (
                            <Trophy size={80} className="mx-auto animate-bounce" />
                        ) : (
                            <Target size={80} className="mx-auto" />
                        )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        {passed ? 'Congratulations! 🎉' : 'Quiz Completed'}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90">
                        {passed ? 'You passed the quiz!' : 'Keep practicing, you\'ll do better next time!'}
                    </p>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Score */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-blue-100">
                        <div className="text-6xl font-bold text-blue-600 mb-2">
                            {result?.score || 0}
                        </div>
                        <div className="text-gray-500 text-sm uppercase tracking-wide mb-1">Your Score</div>
                        <div className="text-gray-700 font-semibold">
                            Out of {result?.quiz_total_marks || 0} marks
                        </div>
                    </div>

                    {/* Percentage */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-purple-100">
                        <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                            {percentage.toFixed(1)}%
                        </div>
                        <div className="text-gray-500 text-sm uppercase tracking-wide mb-1">Percentage</div>
                        <div className="flex items-center justify-center gap-2">
                            {passed ? (
                                <CheckCircle className="text-green-600" size={20} />
                            ) : (
                                <XCircle className="text-red-600" size={20} />
                            )}
                            <span className={`font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                                {passed ? 'Passed' : 'Failed'}
                            </span>
                        </div>
                    </div>

                    {/* Grade */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-yellow-100">
                        <div className="text-6xl font-bold text-yellow-600 mb-2">
                            {grade}
                        </div>
                        <div className="text-gray-500 text-sm uppercase tracking-wide mb-1">Grade</div>
                        <div className="flex items-center justify-center">
                            <Award className="text-yellow-600 mr-2" size={20} />
                            <span className="text-gray-700 font-semibold">
                                {grade === 'A+' ? 'Excellent!' :
                                 grade === 'A' ? 'Very Good!' :
                                 grade === 'B+' ? 'Very Good' :
                                 grade === 'B' ? 'Good' :
                                 grade === 'C' ? 'Fair' :
                                 grade === 'D' ? 'Pass' : 'Fail'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quiz Details */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <BarChart3 className="mr-3 text-blue-600" size={28} />
                        Quiz Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Correct Answers</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {result?.correct_answers || 0} / {result?.total_questions || 0}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Wrong Answers</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {(result?.total_questions || 0) - (result?.correct_answers || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <Clock className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Time Taken</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {result?.time_taken || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Accuracy</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {result?.correct_answers ? 
                                        ((result.correct_answers / result.total_questions) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Message */}
                <div className={`rounded-2xl shadow-lg p-8 mb-8 ${
                    passed ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' :
                    'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200'
                }`}>
                    <h3 className={`text-xl font-bold mb-4 ${passed ? 'text-green-900' : 'text-red-900'}`}>
                        {passed ? '✨ Great Performance!' : '💪 Keep Trying!'}
                    </h3>
                    <p className={`text-lg ${passed ? 'text-green-800' : 'text-red-800'}`}>
                        {passed
                            ? `Excellent work! You scored ${percentage.toFixed(1)}% and demonstrated strong understanding of the material. Keep up the great work!`
                            : `You scored ${percentage.toFixed(1)}%. Don't be discouraged! Review the material and try again. Practice makes perfect!`}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg"
                    >
                        <Home size={24} className="mr-3" />
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition shadow-lg"
                    >
                        <ArrowLeft size={24} className="mr-3" />
                        View More Quizzes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizResult;

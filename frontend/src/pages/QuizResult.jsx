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
    const { error, success } = useToast();

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloadingReview, setIsDownloadingReview] = useState(false);

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
    const correctAnswers = result?.correct_answers || 0;
    const totalQuestions = result?.total_questions || 0;
    const wrongAnswers = totalQuestions - correctAnswers;
    const negativeMarkingPerWrong = result?.negative_marking || 0;
    const negativeMarksLost = wrongAnswers > 0 ? (wrongAnswers * negativeMarkingPerWrong) : 0;
    const accuracy = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100) : 0;
    const hasScoreAccuracyGap = Math.abs(accuracy - percentage) >= 5;

    const handleDownloadAttemptReview = async () => {
        setIsDownloadingReview(true);
        try {
            const review = await attemptAPI.getAttemptReview(attemptId);
            const rows = review?.questions || [];

            const headers = [
                'Question No.',
                'Question',
                'Question Type',
                'Student Answer',
                'Correct Answer',
                'Is Correct',
                'Marks',
                'Marks Awarded',
                'Mistake'
            ];

            const escapeCSV = (value) => {
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            };

            const csvRows = rows.map((item) => [
                item.question_number,
                item.question_text,
                item.question_type,
                item.student_answer || 'Not Answered',
                item.correct_answer,
                item.is_correct ? 'Yes' : 'No',
                item.marks,
                item.marks_awarded,
                item.mistake ? 'Yes' : 'No'
            ]);

            const metadataRows = [
                ['Quiz Title', review.quiz_title || 'Quiz'],
                ['Attempt ID', review.attempt_id],
                ['Score', review.score],
                ['Total Marks', review.total_marks],
                ['Percentage', `${(review.percentage || 0).toFixed(1)}%`],
                ['Submitted At', review.submitted_at ? new Date(review.submitted_at).toLocaleString() : 'N/A'],
                []
            ];

            const csvContent = [
                ...metadataRows.map((row) => row.map(escapeCSV).join(',')),
                headers.map(escapeCSV).join(','),
                ...csvRows.map((row) => row.map(escapeCSV).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `attempt-review-${attemptId}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            success('Attempt review downloaded successfully');
        } catch (err) {
            error(err?.data?.detail || err?.message || 'Failed to download attempt review');
        } finally {
            setIsDownloadingReview(false);
        }
    };

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
                                    {correctAnswers} / {totalQuestions}
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
                                    {wrongAnswers}
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
                                    {accuracy.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                <XCircle className="text-amber-600" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Negative Marks Deducted</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {negativeMarksLost.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {negativeMarkingPerWrong > 0
                                        ? `${wrongAnswers} wrong × ${negativeMarkingPerWrong}`
                                        : 'No negative marking configured'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {hasScoreAccuracyGap && (
                        <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
                            <p className="text-sm text-amber-900">
                                <strong>Note:</strong> Percentage is based on <strong>marks after negative marking</strong>, while Accuracy is based on correct answers only.
                            </p>
                        </div>
                    )}
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
                            ? (grade === 'A+' || grade === 'A'
                                ? `Excellent work! You scored ${percentage.toFixed(1)}% and demonstrated strong understanding of the material. Keep up the great work!`
                                : grade === 'B+' || grade === 'B'
                                    ? `Good job! You scored ${percentage.toFixed(1)}% and showed solid understanding. Keep improving!`
                                    : `Nice effort! You passed with ${percentage.toFixed(1)}%. Keep practicing to improve your score further.`)
                            : `You scored ${percentage.toFixed(1)}%. Don't be discouraged! Review the material and try again. Practice makes perfect!`}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleDownloadAttemptReview}
                        disabled={isDownloadingReview}
                        className="flex-1 flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg disabled:opacity-60"
                    >
                        {isDownloadingReview ? 'Preparing Download...' : 'Download Attempt Review'}
                    </button>
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

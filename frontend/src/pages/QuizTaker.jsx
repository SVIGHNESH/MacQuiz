import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { quizAPI, attemptAPI } from '../services/api';
import {
    Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
    Send, RotateCcw, Timer, FileText, X, Check, Circle
} from 'lucide-react';

const QuizTaker = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error } = useToast();

    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Load quiz and start attempt
    useEffect(() => {
        const initQuiz = async () => {
            try {
                // Get quiz details
                const quizData = await quizAPI.getQuiz(quizId);
                setQuiz(quizData);

                // Start attempt
                const attemptData = await attemptAPI.startAttempt(quizId);
                setAttempt(attemptData);
                
                // Set timer
                setTimeRemaining(quizData.duration_minutes * 60);
                
                success('Quiz started! Good luck!');
            } catch (err) {
                error(err.data?.detail || 'Failed to start quiz');
                navigate(-1);
            } finally {
                setIsLoading(false);
            }
        };

        initQuiz();
    }, [quizId]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) {
            handleSubmitQuiz(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId, answer) => {
        setAnswers({
            ...answers,
            [questionId]: answer
        });
    };

    const handleSubmitQuiz = async (autoSubmit = false) => {
        if (!autoSubmit && !showSubmitConfirm) {
            setShowSubmitConfirm(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                question_id: parseInt(questionId),
                answer: answer
            }));

            const result = await attemptAPI.submitAttempt(attempt.id, formattedAnswers);
            
            success(autoSubmit ? 'Time up! Quiz submitted automatically.' : 'Quiz submitted successfully!');
            navigate(`/quiz-result/${attempt.id}`, { state: { result } });
        } catch (err) {
            error(err.data?.detail || 'Failed to submit quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQuestion = quiz?.questions?.[currentQuestionIndex];
    const totalQuestions = quiz?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    const timePercentage = quiz ? (timeRemaining / (quiz.duration_minutes * 60)) * 100 : 100;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading quiz...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header Bar */}
            <div className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Quiz Info */}
                        <div className="flex items-center space-x-4">
                            <FileText className="text-blue-600" size={28} />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{quiz?.title}</h1>
                                <p className="text-sm text-gray-500">
                                    Question {currentQuestionIndex + 1} of {totalQuestions}
                                </p>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="flex items-center space-x-6">
                            <div className="text-right">
                                <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                                <div className={`text-2xl font-bold font-mono ${
                                    timeRemaining < 60 ? 'text-red-600 animate-pulse' : 
                                    timeRemaining < 300 ? 'text-yellow-600' : 'text-blue-600'
                                }`}>
                                    <Timer className="inline mr-2" size={24} />
                                    {formatTime(timeRemaining)}
                                </div>
                                {/* Timer bar */}
                                <div className="mt-2 w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${
                                            timePercentage < 10 ? 'bg-red-500' :
                                            timePercentage < 25 ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${timePercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Question Card */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-100">
                            {/* Question Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold bg-white/20 px-4 py-1 rounded-full">
                                        Question {currentQuestionIndex + 1}/{totalQuestions}
                                    </span>
                                    <span className="text-sm font-semibold bg-white/20 px-4 py-1 rounded-full">
                                        {currentQuestion?.marks || 1} {currentQuestion?.marks === 1 ? 'Mark' : 'Marks'}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold leading-relaxed">
                                    {currentQuestion?.question_text}
                                </h2>
                            </div>

                            {/* Options */}
                            <div className="p-8 space-y-4">
                                {currentQuestion?.question_type === 'mcq' && (
                                    <>
                                        {['A', 'B', 'C', 'D'].map((option) => {
                                            const optionKey = `option_${option.toLowerCase()}`;
                                            const optionText = currentQuestion[optionKey];
                                            const isSelected = answers[currentQuestion.id] === option;

                                            if (!optionText) return null;

                                            return (
                                                <button
                                                    key={option}
                                                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                                                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-50 shadow-lg'
                                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                                            isSelected
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {option}
                                                        </div>
                                                        <span className={`text-lg flex-1 ${
                                                            isSelected ? 'text-blue-900 font-semibold' : 'text-gray-700'
                                                        }`}>
                                                            {optionText}
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle className="text-blue-600 flex-shrink-0" size={28} />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </>
                                )}

                                {currentQuestion?.question_type === 'true_false' && (
                                    <>
                                        {['True', 'False'].map((option) => {
                                            const isSelected = answers[currentQuestion.id] === option;
                                            return (
                                                <button
                                                    key={option}
                                                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                                                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-50 shadow-lg'
                                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                                            isSelected
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {option === 'True' ? <Check size={24} /> : <X size={24} />}
                                                        </div>
                                                        <span className={`text-xl font-semibold flex-1 ${
                                                            isSelected ? 'text-blue-900' : 'text-gray-700'
                                                        }`}>
                                                            {option}
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle className="text-blue-600 flex-shrink-0" size={28} />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="px-8 py-6 bg-gray-50 flex justify-between items-center border-t">
                                <button
                                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="flex items-center px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                                >
                                    <ChevronLeft size={20} className="mr-2" />
                                    Previous
                                </button>

                                {currentQuestionIndex === totalQuestions - 1 ? (
                                    <button
                                        onClick={() => setShowSubmitConfirm(true)}
                                        disabled={isSubmitting}
                                        className="flex items-center px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                                    >
                                        <Send size={20} className="mr-2" />
                                        Submit Quiz
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
                                    >
                                        Next
                                        <ChevronRight size={20} className="ml-2" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Question Navigator */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <FileText size={20} className="mr-2 text-blue-600" />
                                Question Navigator
                            </h3>
                            
                            {/* Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Answered</span>
                                    <span className="font-bold text-blue-600">{answeredCount}/{totalQuestions}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Question Grid */}
                            <div className="grid grid-cols-5 gap-2">
                                {quiz?.questions?.map((q, idx) => {
                                    const isAnswered = answers[q.id] !== undefined;
                                    const isCurrent = idx === currentQuestionIndex;

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentQuestionIndex(idx)}
                                            className={`aspect-square rounded-lg font-bold text-sm transition-all duration-200 ${
                                                isCurrent
                                                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                                                    : isAnswered
                                                    ? 'bg-green-100 text-green-700 border-2 border-green-400 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-6 space-y-2 text-xs">
                                <div className="flex items-center">
                                    <div className="w-6 h-6 bg-blue-600 rounded mr-2"></div>
                                    <span className="text-gray-600">Current</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded mr-2"></div>
                                    <span className="text-gray-600">Answered</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded mr-2"></div>
                                    <span className="text-gray-600">Unanswered</span>
                                </div>
                            </div>

                            {/* Quick Submit */}
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                disabled={isSubmitting}
                                className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                            >
                                <Send size={18} className="inline mr-2" />
                                Submit Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="text-yellow-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Quiz?</h2>
                            <p className="text-gray-600 mb-6">
                                You have answered <span className="font-bold text-blue-600">{answeredCount}</span> out of <span className="font-bold">{totalQuestions}</span> questions.
                                {answeredCount < totalQuestions && (
                                    <span className="block mt-2 text-red-600 font-semibold">
                                        {totalQuestions - answeredCount} question(s) unanswered!
                                    </span>
                                )}
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to submit? You cannot change your answers after submission.
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setShowSubmitConfirm(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition"
                                >
                                    Review Answers
                                </button>
                                <button
                                    onClick={() => handleSubmitQuiz(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizTaker;

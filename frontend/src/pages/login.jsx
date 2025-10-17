import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { User, Lock, CheckCircle } from 'lucide-react';
import BG from "../assets/Lbg.svg";

const GlassInput = ({ id, type, placeholder, icon: InputIcon, value, onChange, error: inputError, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-700">
            <InputIcon size={20} />
        </div>
        <input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full pl-10 pr-4 py-3 bg-white/30 text-gray-700 placeholder-gray-500 
                       border ${inputError ? 'border-red-500' : 'border-white/40'} rounded-xl focus:outline-none focus:ring-2 
                       ${inputError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} backdrop-blur-sm transition duration-300 
                       shadow-lg focus:shadow-xl`}
            {...props}
        />
        {inputError && (
            <p className="text-red-600 text-sm mt-1 ml-1 font-medium">{inputError}</p>
        )}
    </div>
);

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { success, error } = useToast();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }
        
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            error("Please fix the form errors");
            return;
        }
        
        setIsLoading(true);
        
        try {
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                setIsLoggedIn(true);
                success("Login successful!");
                
                // Show success screen briefly before navigating
                setTimeout(() => {
                    // Route based on user role
                    if (result.user.role === 'student') {
                        navigate("/student-dashboard");
                    } else {
                        navigate("/dashboard");
                    }
                }, 2000);
            } else {
                error(result.error?.data?.detail || "Login failed. Please check your credentials.");
            }
        } catch (err) {
            error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Success screen after login
    if (isLoggedIn) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4 sm:p-8"
                style={{
                    backgroundImage: `url(${BG})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    fontFamily: 'Inter, sans-serif'
                }}
            >
                <div className="w-full max-w-md p-10 space-y-6 rounded-3xl backdrop-blur-xl bg-green-500/30 border border-green-500/50 shadow-2xl text-white text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-white" />
                    <h2 className="text-4xl font-bold">Login Successful!</h2>
                    <p className="text-xl">Welcome back, {formData.email}!</p>
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-2">Redirecting to dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 sm:p-8"
            style={{
                backgroundImage: `url(${BG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                fontFamily: 'Inter, sans-serif'
            }}
        >
            <div className="relative z-10 w-full max-w-6xl h-[70vh] min-h-[500px] 
                            rounded-3xl shadow-2xl overflow-hidden
                            backdrop-blur-xl bg-white/10 border border-white/20 
                            flex flex-col lg:flex-row transition duration-500">
                {/* Left Side */}
                <div className="hidden lg:flex flex-1 items-center justify-center p-12 text-white/90 bg-black/10">
                    <div className="text-left space-y-6">
                        <h1 className="text-5xl font-extrabold leading-tight">
                            Welcome to <span className="text-blue-500">MacQuiz</span>
                        </h1>
                        <p className="text-xl font-light">
                            Assess. Learn. Improve. Get smarter every day with personalized quizzes designed for excellence.
                        </p>
                        <ul className="list-disc list-inside text-white/70 pt-4 space-y-2">
                            <li>Instant feedback loops</li>
                            <li>Personalized learning paths</li>
                            <li>Track your daily progress</li>
                        </ul>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-sm space-y-6 text-gray-500"
                    >
                        <h2 className="text-3xl font-bold text-center text-white">Sign In</h2>

                        <div className="space-y-4">
                            <GlassInput
                                id="email"
                                type="email"
                                name="email"
                                placeholder="admin@macquiz.com"
                                icon={User}
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                                disabled={isLoading}
                                required
                            />
                            <GlassInput
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                icon={Lock}
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                disabled={isLoading}
                                required
                            />
                            <div className="text-sm text-right">
                                <a href="#" className="font-medium hover:text-gray-400 underline text-gray-800">Forgot Password?</a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-3 rounded-xl font-bold tracking-wider transition duration-300 transform 
                                        ${isLoading
                                    ? 'bg-blue-300 text-white/70 cursor-not-allowed'
                                    : 'bg-white text-black hover:scale-[1.02] hover:bg-white/90 shadow-md hover:shadow-xl'
                                }`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </div>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
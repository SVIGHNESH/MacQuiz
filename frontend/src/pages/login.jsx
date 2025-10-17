import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BgSvg from "../assets/Lbg.svg";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
        setServerError("");
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setServerError("");

        try {
            const result = await login(formData.email, formData.password);
            
            if (result.success && result.user) {
                toast.success("Login successful! Redirecting...");
                
                // Redirect based on user role
                setTimeout(() => {
                    if (result.user.role === 'student') {
                        navigate("/student-dashboard");
                    } else {
                        // admin or teacher goes to admin dashboard
                        navigate("/admin-dashboard");
                    }
                }, 500);
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = "An error occurred during login. Please try again.";
            
            if (error.status === 401) {
                errorMessage = "Invalid email or password. Please try again.";
            } else if (error.status === 400) {
                errorMessage = "Your account is inactive. Please contact support.";
            } else if (error.status === 0) {
                errorMessage = "Cannot connect to server. Please check if the backend is running.";
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setServerError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side with SVG instead of gradient */}
            <div className="hidden lg:flex w-1/2 relative text-gray-800 items-center justify-center p-10">
                {/* SVG Image - fill entire div */}
                <img
                    src={BgSvg}
                    alt="Quiz Illustration"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none"
                />

                {/* Content overlays SVG */}
                <div className="relative z-10 text-center space-y-6">
                    <h1 className="text-4xl font-bold">Welcome to MacQuiz</h1>
                    <p className="text-lg">Assess. Learn. Improve. Get smarter everyday.</p>
                    <div className="mt-8 p-6 bg-white/80 rounded-xl backdrop-blur-sm">
                        <h3 className="font-semibold text-lg mb-2">Default Admin Login:</h3>
                        <p className="text-sm text-gray-600">Email: admin@macquiz.com</p>
                        <p className="text-sm text-gray-600">Password: admin123</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-white p-4">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md p-8 space-y-6 rounded-xl border bg-white
                    shadow-[20px_20px_40px_rgba(0,0,0,0.2),-10px_-10px_25px_rgba(255,255,255,0.5)]"
                >
                    <h2 className="text-3xl font-bold text-center mb-6">Login to Your Account</h2>

                    {/* Server Error Message */}
                    {serverError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@macquiz.com"
                            className={`w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.email 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="********"
                            className={`w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.password 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

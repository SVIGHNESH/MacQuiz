import React from "react";
import BgSvg from "../assets/bg.svg"; // adjust path according to your file structure

export default function Login() {
    return (
        <div className="min-h-screen flex">
            {/* Left Side with SVG instead of gradient */}
            <div className="hidden lg:flex w-1/2 relative text-gray-800 items-center justify-center p-10">
                {/* SVG Image - fill entire div */}
                <img
                    src={BgSvg}
                    alt="Quiz Illustration"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />

                {/* Content overlays SVG */}
                <div className="relative z-10 text-center space-y-6">
                    <h1 className="text-4xl font-bold">Welcome to MacQuiz</h1>
                    <p>Assess. Learn. Improve. Get smarter everyday.</p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-white">
                <form
                    className="w-full max-w-md p-8 space-y-6 rounded-xl border bg-white
               shadow-[20px_20px_40px_rgba(0,0,0,0.2),-10px_-10px_25px_rgba(255,255,255,0.5)]"
                >
                    <h2 className="text-3xl font-bold text-center mb-6">Login to Your Account</h2>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            placeholder="user@example"
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="********"
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition"
                    >
                        Login
                    </button>
                </form>
            </div>

        </div>
    );
}

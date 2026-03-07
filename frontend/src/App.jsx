import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";

const Login = lazy(() => import("./pages/login"));
const AdminDashboard = lazy(() => import("./pages/dashBoard"));
const QuizCreator = lazy(() => import("./pages/QuizCreator"));
const QuizTaker = lazy(() => import("./pages/QuizTaker"));
const QuizResult = lazy(() => import("./pages/QuizResult"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading page...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Legacy alias to unified dashboard route */}
              <Route 
                path="/student-dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quiz/create" 
                element={
                  <ProtectedRoute>
                    <QuizCreator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quiz/edit/:quizId" 
                element={
                  <ProtectedRoute>
                    <QuizCreator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quiz/:quizId/take" 
                element={
                  <ProtectedRoute>
                    <QuizTaker />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quiz-result/:attemptId" 
                element={
                  <ProtectedRoute>
                    <QuizResult />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
                    <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Go Home
                    </a>
                  </div>
                </div>
              } />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
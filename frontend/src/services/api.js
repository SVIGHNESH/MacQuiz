// API Service for QuizzApp
// Centralized API configuration and methods

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom API error class for better error handling
 */
class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    // Add authorization token if available
    const token = localStorage.getItem('access_token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        const isJSON = contentType && contentType.includes('application/json');
        
        const data = isJSON ? await response.json() : await response.text();

        if (!response.ok) {
            throw new ApiError(
                data?.detail || data?.message || 'An error occurred',
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Network error or other issues
        throw new ApiError(
            'Network error. Please check your connection.',
            0,
            null
        );
    }
}

/**
 * Authentication API methods
 */
export const authAPI = {
    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{access_token: string, token_type: string}>}
     */
    login: async (email, password) => {
        // Using form data for OAuth2 compatibility
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetchAPI('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        // Store token in localStorage
        if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
        }

        return response;
    },

    /**
     * Logout user (clear local storage)
     */
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },
};

/**
 * User API methods
 */
export const userAPI = {
    /**
     * Get current user profile
     */
    getCurrentUser: async () => {
        return await fetchAPI('/api/v1/users/me');
    },

    /**
     * Get all users (admin only)
     */
    getAllUsers: async () => {
        return await fetchAPI('/api/v1/users/');
    },

    /**
     * Create a new user
     * @param {Object} userData - User data object
     */
    createUser: async (userData) => {
        return await fetchAPI('/api/v1/users/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Update user
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     */
    updateUser: async (userId, userData) => {
        return await fetchAPI(`/api/v1/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Delete user
     * @param {number} userId - User ID
     */
    deleteUser: async (userId) => {
        return await fetchAPI(`/api/v1/users/${userId}`, {
            method: 'DELETE',
        });
    },
};

/**
 * Quiz API methods
 */
export const quizAPI = {
    /**
     * Get all quizzes
     */
    getAllQuizzes: async () => {
        return await fetchAPI('/api/v1/quizzes/');
    },

    /**
     * Get quiz by ID
     * @param {number} quizId - Quiz ID
     */
    getQuizById: async (quizId) => {
        return await fetchAPI(`/api/v1/quizzes/${quizId}`);
    },

    /**
     * Create new quiz
     * @param {Object} quizData - Quiz data object
     */
    createQuiz: async (quizData) => {
        return await fetchAPI('/api/v1/quizzes/', {
            method: 'POST',
            body: JSON.stringify(quizData),
        });
    },

    /**
     * Update quiz
     * @param {number} quizId - Quiz ID
     * @param {Object} quizData - Updated quiz data
     */
    updateQuiz: async (quizId, quizData) => {
        return await fetchAPI(`/api/v1/quizzes/${quizId}`, {
            method: 'PUT',
            body: JSON.stringify(quizData),
        });
    },

    /**
     * Delete quiz
     * @param {number} quizId - Quiz ID
     */
    deleteQuiz: async (quizId) => {
        return await fetchAPI(`/api/v1/quizzes/${quizId}`, {
            method: 'DELETE',
        });
    },
};

/**
 * Quiz Attempt API methods
 */
export const attemptAPI = {
    /**
     * Get all attempts for a quiz
     * @param {number} quizId - Quiz ID
     */
    getQuizAttempts: async (quizId) => {
        return await fetchAPI(`/api/v1/attempts/quiz/${quizId}`);
    },

    /**
     * Get student's attempts
     */
    getMyAttempts: async () => {
        return await fetchAPI('/api/v1/attempts/my-attempts');
    },

    /**
     * Start a new quiz attempt
     * @param {number} quizId - Quiz ID
     */
    startAttempt: async (quizId) => {
        return await fetchAPI('/api/v1/attempts/start', {
            method: 'POST',
            body: JSON.stringify({ quiz_id: quizId }),
        });
    },

    /**
     * Submit quiz attempt
     * @param {number} attemptId - Attempt ID
     * @param {Array} answers - Array of answers
     */
    submitAttempt: async (attemptId, answers) => {
        return await fetchAPI(`/api/v1/attempts/${attemptId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers }),
        });
    },
};

/**
 * Health check
 */
export const healthCheck = async () => {
    try {
        const response = await fetchAPI('/health');
        return response;
    } catch (error) {
        console.error('Health check failed:', error);
        return null;
    }
};

export { ApiError, API_BASE_URL };

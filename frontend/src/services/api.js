const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
console.log('🔧 [v2024-11-24-4:15pm] API Configuration:', { 
    API_BASE_URL, 
    ENV_VALUE: import.meta.env.VITE_API_BASE_URL,
    MODE: import.meta.env.MODE 
});

class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'APIError';
    }
}

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Only logout on 401 Unauthorized, not on other errors like 400 Bad Request
            if (response.status === 401) {
                console.error('Unauthorized - clearing auth token');
                localStorage.removeItem('access_token');
                window.location.href = '/';
            }
            
            throw new APIError(
                errorData.detail || `HTTP ${response.status}`,
                response.status,
                errorData
            );
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return response;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        // Network error or other fetch failures
        console.error('Network error:', error);
        console.error('Attempted URL:', url);
        console.error('Request options:', options);
        throw new APIError(
            error.message || 'Network error - please check if the server is running',
            0,
            { detail: `[NEW CODE v4:15pm] Unable to connect to backend at ${API_BASE_URL}. Backend status: ${navigator.onLine ? 'Online' : 'Offline'}` }
        );
    }
}

export const authAPI = {
    login: async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await fetchAPI('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            skipAuth: true,
        });
        
        localStorage.setItem('access_token', response.access_token);
        return response;
    },
    
    logout: () => {
        localStorage.removeItem('access_token');
    },
};

export const userAPI = {
    getCurrentUser: () => fetchAPI('/api/v1/users/me'),
    getAllUsers: () => fetchAPI('/api/v1/users/'),
    getUser: (id) => fetchAPI(`/api/v1/users/${id}`),
    createUser: (userData) => fetchAPI('/api/v1/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    updateUser: (id, userData) => fetchAPI(`/api/v1/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    }),
    deleteUser: (id) => fetchAPI(`/api/v1/users/${id}`, {
        method: 'DELETE',
    }),
    bulkUpload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/users/bulk-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Bulk upload failed');
        }
        return await response.json();
    },
};

export const quizAPI = {
    getAllQuizzes: () => fetchAPI('/api/v1/quizzes/'),
    getQuiz: (id) => fetchAPI(`/api/v1/quizzes/${id}`),
    checkEligibility: (id) => fetchAPI(`/api/v1/quizzes/${id}/eligibility`),
    createQuiz: (quizData) => fetchAPI('/api/v1/quizzes/', {
        method: 'POST',
        body: JSON.stringify(quizData),
    }),
    updateQuiz: (id, quizData) => fetchAPI(`/api/v1/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(quizData),
    }),
    deleteQuiz: (id) => fetchAPI(`/api/v1/quizzes/${id}`, {
        method: 'DELETE',
    }),
};

export const attemptAPI = {
    getMyAttempts: () => fetchAPI('/api/v1/attempts/my-attempts'),
    getAllAttempts: (filters = {}) => {
        const params = [];
        if (filters.quiz_id) params.push(`quiz_id=${filters.quiz_id}`);
        if (filters.student_id) params.push(`student_id=${filters.student_id}`);
        if (filters.completed_only !== undefined) params.push(`completed_only=${filters.completed_only}`);
        const url = params.length > 0 
            ? `/api/v1/attempts/all-attempts?${params.join('&')}`
            : '/api/v1/attempts/all-attempts';
        return fetchAPI(url);
    },
    getAttempt: (id) => fetchAPI(`/api/v1/attempts/${id}`),
    getRemainingTime: (attemptId) => fetchAPI(`/api/v1/attempts/${attemptId}/remaining-time`),
    startAttempt: (quizId) => fetchAPI('/api/v1/attempts/start', {
        method: 'POST',
        body: JSON.stringify({ quiz_id: quizId }),
    }),
    submitAttempt: (attemptId, answers) => fetchAPI(`/api/v1/attempts/submit?attempt_id=${attemptId}`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
    }),
    saveAnswer: (attemptId, answerData) => fetchAPI(`/api/v1/attempts/${attemptId}/save-answer`, {
        method: 'POST',
        body: JSON.stringify(answerData),
    }),
    getSavedAnswers: (attemptId) => fetchAPI(`/api/v1/attempts/${attemptId}/answers`),
};

export const subjectAPI = {
    getAllSubjects: (activeOnly = true, department = null) => {
        let url = '/api/v1/subjects/?';
        if (activeOnly !== null) url += `active_only=${activeOnly}&`;
        if (department) url += `department=${department}&`;
        return fetchAPI(url);
    },
    getSubject: (id) => fetchAPI(`/api/v1/subjects/${id}`),
    createSubject: (subjectData) => fetchAPI('/api/v1/subjects/', {
        method: 'POST',
        body: JSON.stringify(subjectData),
    }),
    updateSubject: (id, subjectData) => fetchAPI(`/api/v1/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(subjectData),
    }),
    deleteSubject: (id) => fetchAPI(`/api/v1/subjects/${id}`, {
        method: 'DELETE',
    }),
    getStatistics: (id) => fetchAPI(`/api/v1/subjects/${id}/statistics`),
};

export const questionBankAPI = {
    getAllQuestions: (filters = {}) => {
        let url = '/api/v1/question-bank/?';
        if (filters.subject_id) url += `subject_id=${filters.subject_id}&`;
        if (filters.difficulty) url += `difficulty=${filters.difficulty}&`;
        if (filters.topic) url += `topic=${filters.topic}&`;
        if (filters.question_type) url += `question_type=${filters.question_type}&`;
        if (filters.active_only !== undefined) url += `active_only=${filters.active_only}&`;
        return fetchAPI(url);
    },
    getQuestion: (id) => fetchAPI(`/api/v1/question-bank/${id}`),
    createQuestion: (questionData) => fetchAPI('/api/v1/question-bank/', {
        method: 'POST',
        body: JSON.stringify(questionData),
    }),
    updateQuestion: (id, questionData) => fetchAPI(`/api/v1/question-bank/${id}`, {
        method: 'PUT',
        body: JSON.stringify(questionData),
    }),
    deleteQuestion: (id) => fetchAPI(`/api/v1/question-bank/${id}`, {
        method: 'DELETE',
    }),
};

export const analyticsAPI = {
    getDashboardStats: () => fetchAPI('/api/v1/analytics/dashboard'),
    getTeacherStats: (teacherId) => fetchAPI(`/api/v1/analytics/teacher/${teacherId}/stats`),
    getStudentStats: (studentId) => fetchAPI(`/api/v1/analytics/student/${studentId}/stats`),
    getRecentActivity: (limit = 20) => fetchAPI(`/api/v1/analytics/activity/recent?limit=${limit}`),
    getUserActivity: (filters = {}) => {
        let url = '/api/v1/analytics/activity/users?';
        if (filters.role) url += `role=${filters.role}&`;
        if (filters.department) url += `department=${filters.department}&`;
        if (filters.limit) url += `limit=${filters.limit}&`;
        return fetchAPI(url);
    },
    getSubjectPerformance: (subjectId) => fetchAPI(`/api/v1/analytics/performance/subject/${subjectId}`),
    getDepartmentPerformance: (department) => fetchAPI(`/api/v1/analytics/performance/department/${department}`),
};

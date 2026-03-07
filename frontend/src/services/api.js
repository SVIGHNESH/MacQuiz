// Normalize API base URL and tolerate accidental comma-separated values in env.
function resolveApiBaseUrl() {
    const envValue = import.meta.env.VITE_API_BASE_URL;
    if (!envValue) {
        if (import.meta.env.DEV) {
            return 'http://localhost:8000';
        }
        // Vercel production fallback: use same-origin deployment if backend is served on this domain.
        if (typeof window !== 'undefined' && window.location?.origin) {
            return window.location.origin;
        }
        return '';
    }

    const candidates = envValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    // Prefer explicit backend ports when multiple URLs are provided accidentally.
    const preferred = candidates.find((value) => /:8000(?:\/|$)/.test(value)) || candidates[0];
    return preferred;
}

const rawApiUrl = resolveApiBaseUrl();
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');
if (import.meta.env.DEV) {
    console.log('🔧 API Configuration:', {
        API_BASE_URL,
        ENV_VALUE: import.meta.env.VITE_API_BASE_URL,
        MODE: import.meta.env.MODE,
    });
}

class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'APIError';
    }
}

const GET_CACHE_TTL_MS = 8000;
const getResponseCache = new Map();

function cloneJsonData(data) {
    if (data === null || data === undefined) return data;
    try {
        return structuredClone(data);
    } catch {
        return JSON.parse(JSON.stringify(data));
    }
}

export function clearApiCache() {
    getResponseCache.clear();
}

function isJwtExpired(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        if (!payload.exp) return false;
        const nowSeconds = Math.floor(Date.now() / 1000);
        return nowSeconds >= Number(payload.exp);
    } catch {
        return false;
    }
}

async function fetchAPI(endpoint, options = {}) {
    if (!API_BASE_URL) {
        throw new APIError(
            'API base URL is not configured. Set VITE_API_BASE_URL in Vercel, or deploy frontend/backend under the same origin.',
            0,
            { detail: 'Missing VITE_API_BASE_URL' }
        );
    }
    const url = `${API_BASE_URL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const token = localStorage.getItem('access_token');
    if (token && isJwtExpired(token)) {
        localStorage.removeItem('access_token');
        // If the token is expired, treat as logged out
        window.location.href = '/';
        throw new APIError('Session expired. Please log in again.', 401, { detail: 'Token expired' });
    }
    
    const headers = {
        ...options.headers,
    };

    const body = options.body;
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const isUrlEncoded = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;

    // Default to JSON only when we're not sending multipart/form-data or x-www-form-urlencoded
    if (!isFormData && !isUrlEncoded && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const shouldUseGetCache = method === 'GET' && !options.skipCache;
    const cacheKey = shouldUseGetCache ? `${token || 'anon'}::${url}` : null;

    if (shouldUseGetCache && cacheKey) {
        const cached = getResponseCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cloneJsonData(cached.data);
        }
        if (cached) {
            getResponseCache.delete(cacheKey);
        }
    } else if (method !== 'GET') {
        clearApiCache();
    }
    
    try {
        const controller = new AbortController();
        const timeoutMs = options.timeoutMs ?? 20000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let response;
        try {
            response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeoutId);
        }
        
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
            const jsonData = await response.json();
            if (shouldUseGetCache && cacheKey) {
                getResponseCache.set(cacheKey, {
                    data: jsonData,
                    expiresAt: Date.now() + GET_CACHE_TTL_MS,
                });
            }
            return cloneJsonData(jsonData);
        }
        
        return response;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        // Network error or other fetch failures
        console.error('Network error:', error);
        console.error('Attempted URL:', url);
        if (import.meta.env.DEV) {
            console.error('Request options:', options);
        }
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
        clearApiCache();
        return response;
    },
    
    logout: () => {
        // Best-effort server-side revoke; only call if a token exists
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchAPI('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
        }
        localStorage.removeItem('access_token');
        clearApiCache();
    },

    changePassword: (currentPassword, newPassword) => fetchAPI('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
        }),
    }),

    logoutAll: () => fetchAPI('/api/v1/auth/logout-all', { method: 'POST' }),
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
        if (filters.skip !== undefined) params.push(`skip=${filters.skip}`);
        params.push(`limit=${filters.limit ?? 100}`);
        const url = params.length > 0 
            ? `/api/v1/attempts/all-attempts?${params.join('&')}`
            : '/api/v1/attempts/all-attempts';
        return fetchAPI(url);
    },
    getAttempt: (id) => fetchAPI(`/api/v1/attempts/${id}`),
    getAttemptReview: async (id) => {
        try {
            return await fetchAPI(`/api/v1/attempts/${id}/review`);
        } catch (err) {
            if (err?.status === 404) {
                return await fetchAPI(`/api/v1/attempts/review/${id}`);
            }
            throw err;
        }
    },
    getRemainingTime: (attemptId) => fetchAPI(`/api/v1/attempts/${attemptId}/remaining-time`, { skipCache: true }),
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

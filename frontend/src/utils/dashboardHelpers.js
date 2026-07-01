// Backend emits UTC-naive datetimes (no 'Z'/offset suffix); mark them as UTC
// before parsing so they render in the viewer's local time, matching the
// convention already used for scheduled_at/live_start_time elsewhere in the app.
export const parseBackendUtcDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

    const raw = String(value).trim().replace(' ', 'T');
    if (!raw) return null;

    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
    const parsed = new Date(hasTimezone ? raw : `${raw}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Password strength validator
export const validatePasswordStrength = (password) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        // eslint-disable-next-line no-useless-escape
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    let strength = 'weak';
    let color = 'bg-red-500';

    if (score >= 5) {
        strength = 'strong';
        color = 'bg-green-500';
    } else if (score >= 3) {
        strength = 'medium';
        color = 'bg-yellow-500';
    }

    return { checks, score, strength, color };
};

// Strong password generator
export const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*_-+=';

    const allChars = uppercase + lowercase + numbers + special;

    // Ensure at least one of each type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining characters (total length 12)
    for (let i = password.length; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Email domain validator
export const validateEmailDomain = (email) => {
    const allowedDomains = ['gmail.com', 'rbmi.in', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.includes(domain);
};

export const getDisplayUserId = (user) => {
    if (!user) return 'N/A';
    if (user.role === 'student') return user.student_id || `STU-${user.id ?? 'N/A'}`;
    if (user.role === 'teacher') {
        if (user.student_id) return user.student_id;
        const numericId = Number(user.id);
        return Number.isFinite(numericId)
            ? `RBMI-T-${String(numericId).padStart(4, '0')}`
            : 'RBMI-T-0000';
    }
    return `ADM-${user.id ?? 'N/A'}`;
};

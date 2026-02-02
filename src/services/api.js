import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor pentru a adăuga token-ul JWT la fiecare request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Interceptor pentru a reîmprospăta token-ul dacă expiră
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Dacă nu avem refresh token sau nu e 401, nu încercăm nimic special
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
            // Nu avem cu ce reîmprospăta; ștergem token-urile și continuăm fără redirect forțat
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const response = await axios.post(`${API_URL}/token/refresh/`, {
                refresh: refreshToken,
            });

            const { access } = response.data;
            localStorage.setItem("access_token", access);

            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
        } catch (refreshError) {
            // Refresh eșuat: curățăm token-urile, dar NU mai redirecționăm automat
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            return Promise.reject(refreshError);
        }
    },
);

// Auth
export const login = (username, password) => {
    return api.post("/token/", { username, password });
};

// Training Sessions
export const getTrainingSessions = () => {
    return api.get("/training-sessions/");
};

export const getCurrentTrainingSession = () => {
    return api.get("/training-sessions/current/");
};

export const createTrainingSession = (data) => {
    return api.post("/training-sessions/", data);
};

export const updateTrainingSession = (id, data) => {
    return api.put(`/training-sessions/${id}/`, data);
};

export const deleteTrainingSession = (id) => {
    return api.delete(`/training-sessions/${id}/`);
};

// Check-ins
export const createCheckIn = (phoneNumber, athleteIdOrName = "") => {
    // Dacă e number, e athlete_id; dacă e string, e athlete_name (legacy)
    if (typeof athleteIdOrName === "number") {
        return api.post("/checkins/", {
            phone_number: phoneNumber,
            athlete_id: athleteIdOrName,
        });
    } else {
        return api.post("/checkins/", {
            phone_number: phoneNumber,
            athlete_name: athleteIdOrName,
        });
    }
};

export const getCheckIns = () => {
    return api.get("/checkins/");
};

export const getMonthlyStats = (year, month) => {
    return api.get(`/checkins/monthly_stats/?year=${year}&month=${month}`);
};

// Athletes
export const getAthletes = () => {
    return api.get("/athletes/");
};

export const updateAthleteSubscription = (athleteId, subscriptionActive) => {
    return api.patch(`/athletes/${athleteId}/`, {
        subscription_active: subscriptionActive,
    });
};

export const updateAthlete = (athleteId, payload) => {
    return api.patch(`/athletes/${athleteId}/`, payload);
};

// User Management
export const getCurrentUser = () => {
    return api.get("/users/me/");
};

export const getUsers = () => {
    return api.get("/users/");
};

export const createUser = (username, password, passwordConfirm) => {
    return api.post("/users/", {
        username,
        password,
        password_confirm: passwordConfirm,
    });
};

export const updateUser = (userId, data) => {
    return api.patch(`/users/${userId}/`, data);
};

export const deleteUser = (userId) => {
    return api.delete(`/users/${userId}/`);
};

// Phone Numbers & Athletes
export const getAthletesForPhone = (phoneNumber) => {
    return api.post("/phone-numbers/get_athletes/", { phone_number: phoneNumber });
};

export const createAthleteForPhone = (phoneNumber, athleteName) => {
    return api.post("/phone-numbers/create_athlete/", {
        phone_number: phoneNumber,
        athlete_name: athleteName,
    });
};

export const addAthleteViaPin = (phoneNumber, athletePin) => {
    return api.post("/phone-numbers/add_athlete/", {
        phone_number: phoneNumber,
        athlete_pin: athletePin,
    });
};

export const removeAthleteFromPhone = (phoneNumber, athleteId) => {
    return api.post("/phone-numbers/remove_athlete/", {
        phone_number: phoneNumber,
        athlete_id: athleteId,
    });
};

// Get athlete by ID
export const getAthlete = (athleteId) => {
    return api.get(`/athletes/${athleteId}/`);
};

export const getAthletePhones = (athleteId) => {
    return api.get(`/athletes/${athleteId}/phones/`);
};

export const getAthleteAttendance = (athleteId, year, month) => {
    return api.get(`/athletes/${athleteId}/attendance/?year=${year}&month=${month}`);
};

export const updateAthleteAttendance = (athleteId, data) => {
    return api.post(`/athletes/${athleteId}/attendance/`, data);
};

// App Settings
export const getAppSettings = () => {
    return api.get("/app-settings/current/");
};

export const updateAppSettings = (data) => {
    return api.patch("/app-settings/1/", data);
};

// Athlete Payments
export const getAthletePayments = (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/athlete-payments/?${params.toString()}`);
};

export const createAthletePayment = (data) => {
    return api.post("/athlete-payments/", data);
};

export const updateAthletePayment = (paymentId, data) => {
    return api.patch(`/athlete-payments/${paymentId}/`, data);
};

export default api;

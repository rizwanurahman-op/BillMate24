import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
}> = [];

// Flag to prevent multiple redirects
let isRedirecting = false;

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Helper function to get token from cookies
const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get('accessToken') || null;
};

// Helper function to get refresh token from cookies
const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get('refreshToken') || null;
};

// Helper function to update tokens in cookies
const updateTokens = (accessToken: string, refreshToken?: string) => {
    const cookieOptions = {
        path: '/',
        sameSite: 'lax' as const,
        expires: 7,
        secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    };

    Cookies.set('accessToken', accessToken, cookieOptions);
    if (refreshToken) {
        Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 });
    }
};

// Helper function to clear all auth data and redirect to login
const handleUnauthorized = () => {
    if (typeof window === 'undefined') return;

    // Prevent multiple simultaneous redirects
    if (isRedirecting) return;
    isRedirecting = true;

    // Don't redirect if already on login page
    if (window.location.pathname === '/login') {
        isRedirecting = false;
        return;
    }

    console.log('Session expired - Clearing auth and redirecting to login');

    // Clear cookies
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    Cookies.remove('userRole', { path: '/' });

    // Clear zustand persisted storage
    try {
        localStorage.removeItem('auth-storage');
    } catch (e) {
        // localStorage might not be available
    }

    // Redirect to login with small delay to ensure cleanup
    setTimeout(() => {
        window.location.href = '/login';
    }, 100);
};

// Process the queued requests after token refresh
const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token!);
        }
    });
    failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip handling if no response (network error)
        if (!error.response) {
            return Promise.reject(error);
        }

        // If 401 and not already retried
        if (error.response.status === 401 && !originalRequest._retry) {
            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        },
                        reject: (err: Error) => {
                            reject(err);
                        },
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();

                if (!refreshToken) {
                    console.log('No refresh token available');
                    processQueue(new Error('No refresh token'), null);
                    handleUnauthorized();
                    return Promise.reject(error);
                }

                console.log('Attempting token refresh...');
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken,
                });

                if (response.data?.data?.accessToken) {
                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                    console.log('Token refresh successful');

                    // Update cookies with new tokens
                    updateTokens(accessToken, newRefreshToken);

                    // Process queued requests with new token
                    processQueue(null, accessToken);

                    // Fetch user profile and update Zustand store
                    // This ensures the user state is properly restored after token refresh
                    try {
                        const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        });

                        if (profileResponse.data?.data) {
                            // Dynamically import to avoid circular dependencies
                            const { useAuthStore } = await import('@/store/auth.store');
                            const updateUser = useAuthStore.getState().updateUser;
                            const setAuth = useAuthStore.getState().setAuth;

                            // If user exists, just update. Otherwise, set full auth state.
                            const currentUser = useAuthStore.getState().user;
                            if (currentUser) {
                                updateUser(profileResponse.data.data);
                            } else {
                                setAuth(profileResponse.data.data, { accessToken, refreshToken: newRefreshToken });
                            }
                            console.log('User profile restored after token refresh');
                        }
                    } catch (profileError) {
                        console.warn('Could not restore user profile after token refresh:', profileError);
                        // Not critical - the request will still work
                    }

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } else {
                    throw new Error('Invalid refresh response');
                }
            } catch (refreshError) {
                console.log('Token refresh failed:', refreshError);
                processQueue(refreshError as Error, null);
                handleUnauthorized();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const API = `${BACKEND_URL}/api`;

    useEffect(() => {
        // Check if user is logged in on app start
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setToken(savedToken);
            } catch (error) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API}/login`, {
                email,
                password
            });
            
            const userData = response.data;
            const userToken = userData.user_id; // Using user_id as token
            
            // Set nick as username for compatibility
            const fullUserData = {
                ...userData,
                nick: userData.username
            };
            
            setUser(fullUserData);
            setToken(userToken);
            localStorage.setItem('user', JSON.stringify(fullUserData));
            localStorage.setItem('token', userToken);
            
            return { success: true };
        } catch (error) {
            let errorMessage = 'Ошибка входа';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }
            return { success: false, error: errorMessage };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post(`${API}/register`, {
                username,
                email,
                password
            });
            
            const userData = response.data;
            const userToken = userData.user_id; // Using user_id as token
            
            // Set nick as username for compatibility
            const fullUserData = {
                ...userData,
                nick: userData.username
            };
            
            setUser(fullUserData);
            setToken(userToken);
            localStorage.setItem('user', JSON.stringify(fullUserData));
            localStorage.setItem('token', userToken);
            
            return { success: true };
        } catch (error) {
            let errorMessage = 'Ошибка регистрации';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }
            return { success: false, error: errorMessage };
        }
    };

    const fetchUserProfile = async () => {
        if (!token) return;
        
        try {
            const response = await axios.get(`${API}/profile`, {
                params: { token }
            });
            
            const userData = response.data;
            const fullUserData = {
                ...userData,
                nick: userData.username
            };
            
            setUser(fullUserData);
            localStorage.setItem('user', JSON.stringify(fullUserData));
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        loading,
        API,
        fetchUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
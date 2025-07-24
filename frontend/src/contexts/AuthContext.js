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
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const API = `${BACKEND_URL}/api`;

    useEffect(() => {
        // Check if user is logged in on app start
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                localStorage.removeItem('user');
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
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
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
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            return { success: true };
        } catch (error) {
            let errorMessage = 'Ошибка регистрации';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
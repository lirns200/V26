import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const { login, register } = useAuth();

    const validateForm = () => {
        const errors = {};
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            errors.email = 'Email обязателен';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Некорректный формат email';
        }
        
        // Password validation
        if (!formData.password) {
            errors.password = 'Пароль обязателен';
        } else if (formData.password.length < 6) {
            errors.password = 'Пароль должен содержать минимум 6 символов';
        }
        
        // Username validation for registration
        if (!isLogin) {
            if (!formData.username) {
                errors.username = 'Имя пользователя обязательно';
            } else if (formData.username.length < 3) {
                errors.username = 'Имя пользователя должно содержать минимум 3 символа';
            } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                errors.username = 'Имя пользователя может содержать только буквы, цифры и подчеркивания';
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        // Clear specific field validation error
        if (validationErrors[e.target.name]) {
            setValidationErrors({
                ...validationErrors,
                [e.target.name]: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            let result;
            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                result = await register(formData.username, formData.email, formData.password);
            }
            
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Произошла неожиданная ошибка');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setValidationErrors({});
        setFormData({ username: '', email: '', password: '' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full blur-xl animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white opacity-5 rounded-full blur-xl animate-pulse animation-delay-4000"></div>
            </div>
            
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d={isLogin ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"} />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isLogin ? 'Добро пожаловать!' : 'Создать аккаунт'}
                        </h2>
                        <p className="text-white/80 text-sm">
                            {isLogin ? 'Войдите в свой аккаунт' : 'Присоединяйтесь к нашему мессенджеру'}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="px-8 py-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Имя пользователя
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                                            validationErrors.username ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        placeholder="Введите имя пользователя"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                {validationErrors.username && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                                        validationErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    placeholder="Введите ваш email"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>
                            {validationErrors.email && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Пароль
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pr-12 ${
                                        validationErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    placeholder="Введите пароль"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="w-5 h-5"/>
                                    ) : (
                                        <EyeIcon className="w-5 h-5"/>
                                    )}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Пожалуйста, подождите...
                                </div>
                            ) : (
                                isLogin ? 'Войти' : 'Создать аккаунт'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">или</span>
                            </div>
                        </div>
                        
                        <button
                            onClick={switchMode}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200 hover:underline"
                        >
                            {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
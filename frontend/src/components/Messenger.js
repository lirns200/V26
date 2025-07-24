import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Messenger = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h1 className="ml-3 text-xl font-semibold text-gray-900">Мессенджер</h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                                Привет, <span className="font-semibold text-gray-900">{user?.username}</span>!
                            </div>
                            <button
                                onClick={logout}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать в мессенджер!</h2>
                    <p className="text-gray-600 mb-6">Регистрация прошла успешно. Вы вошли в систему как <strong>{user?.username}</strong>.</p>
                    
                    <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о пользователе:</h3>
                        <div className="text-left space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Имя пользователя:</span>
                                <span className="font-medium text-gray-900">{user?.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium text-gray-900">{user?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">ID:</span>
                                <span className="font-medium text-gray-900 text-xs">{user?.user_id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messenger;
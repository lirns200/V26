import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  MicrophoneIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  CogIcon,
  XMarkIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

const Messenger = () => {
  const { user, logout, token, API, fetchUserProfile } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [editingNick, setEditingNick] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [chatWallpaper, setChatWallpaper] = useState('default');
  const [privacySettings, setPrivacySettings] = useState({
    hideLastSeen: false,
    hideProfilePhoto: false,
    hideStatus: false,
    readReceipts: true
  });
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [searchFilter, setSearchFilter] = useState('users');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChats();
    loadUnreadCounts();
    if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedChat && selectedChat !== 'Избранное') {
      loadMessages();
    } else if (selectedChat === 'Избранное') {
      loadFavorites();
    }
  }, [selectedChat]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Периодическое обновление непрочитанных сообщений
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'chats') {
        loadUnreadCounts();
      }
    }, 10000); // каждые 10 секунд

    return () => clearInterval(interval);
  }, [activeTab]);

  const loadChats = () => {
    const savedChats = JSON.parse(localStorage.getItem('chatsList') || '[]');
    setChats(savedChats);
  };

  const saveChats = (chatsList) => {
    localStorage.setItem('chatsList', JSON.stringify(chatsList));
    setChats(chatsList);
  };

  const loadUnreadCounts = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/users`, {
        params: { token }
      });
      // Mock unread counts since the API doesn't support this yet
      setUnreadCounts({});
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat || selectedChat === 'Избранное') return;

    try {
      const response = await axios.get(`${API}/messages/${selectedChat}`, {
        params: { token }
      });
      
      // Format messages to match expected structure
      const formattedMessages = (response.data.messages || []).map(msg => ({
        text: msg.text,
        from: msg.sender_id === token ? user?.nick : selectedChat,
        timestamp: new Date(msg.timestamp).getTime() / 1000,
        id: msg.id
      }));
      
      setMessages(formattedMessages);

      // Очистить счетчик непрочитанных для этого чата
      if (unreadCounts[selectedChat]) {
        const newUnreadCounts = { ...unreadCounts };
        delete newUnreadCounts[selectedChat];
        setUnreadCounts(newUnreadCounts);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`, {
        params: { token }
      });
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`${API}/users`, {
        params: { token }
      });
      
      // Filter users by username containing query
      const filtered = (response.data.users || []).filter(u => 
        u.username.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered.map(u => ({
        ...u,
        nick: u.username,
        online: true // Mock online status
      })));
    } catch (error) {
      setSearchResults([]);
      console.error('Error searching users:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || selectedChat === 'Избранное') return;

    try {
      await axios.post(`${API}/messages`, {
        receiver_id: selectedChat,
        text: newMessage
      }, {
        params: { token }
      });

      // Добавить в список чатов если еще нет
      if (!chats.includes(selectedChat)) {
        const updatedChats = [selectedChat, ...chats];
        saveChats(updatedChats);
      }

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const addToFavorites = async (message) => {
    try {
      await axios.post(`${API}/favorites`, {
        type: 'text',
        text: message ? message.text : newMessage,
        orig: message || null
      }, {
        params: { token }
      });

      if (!message) {
        setNewMessage('');
      }

      if (activeTab === 'favorites' || selectedChat === 'Избранное') {
        await loadFavorites();
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post(`${API}/upload`, formData, {
        params: { token },
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.data.url) {
        if (selectedChat === 'Избранное') {
          await axios.post(`${API}/favorites`, {
            type: 'file',
            file_url: uploadResponse.data.url,
            text: `Файл: ${file.name}`
          }, {
            params: { token }
          });

          await loadFavorites();
        } else {
          // Отправить файл как сообщение (для будущей реализации)
          console.log('File uploaded:', uploadResponse.data.url);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }

    event.target.value = '';
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post(`${API}/upload`, formData, {
        params: { token },
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.data.url) {
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }

    event.target.value = '';
  };

  const updateNickname = async () => {
    if (!newNick.trim()) return;

    try {
      await axios.post(`${API}/update_profile`, {
        new_username: newNick
      }, {
        params: { token }
      });

      await fetchUserProfile();
      setEditingNick(false);
      setNewNick('');
    } catch (error) {
      console.error('Error updating nickname:', error);
    }
  };

  const selectChat = (chatName) => {
    setSelectedChat(chatName);
    setActiveTab('chats');
  };

  const addUserToChats = (userNick) => {
    if (!chats.includes(userNick)) {
      const updatedChats = [userNick, ...chats];
      saveChats(updatedChats);
    }
    setSelectedChat(userNick);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name ? name.slice(0, 2).toUpperCase() : '??';
  };

  const renderMessage = (message, index) => {
    const isMyMessage = message.from === user?.nick;

    return (
      <div
        key={index}
        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative group ${
          isMyMessage
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white text-gray-900 rounded-bl-md shadow-sm border'
        }`}>
          {!isMyMessage && (
            <p className="text-xs text-blue-600 font-medium mb-1">
              {message.from}
            </p>
          )}
          <p className="break-words">{message.text}</p>
          <div className="flex items-center justify-between mt-1">
            <p className={`text-xs ${
              isMyMessage ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatTime(message.timestamp)}
            </p>

            {/* Кнопка добавления в избранное */}
            <button
              onClick={() => addToFavorites(message)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
              title="Добавить в избранное"
            >
              <HeartIcon className="w-3 h-3 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFavoriteMessage = (fav, index) => {
    const isFile = fav.type === 'file' && fav.file_url;
    const isVoice = fav.type === 'voice' && fav.voice_url;

    return (
      <div key={index} className="flex justify-end animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-md">
          {isFile ? (
            <div>
              <a
                href={fav.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white underline"
              >
                📎 {fav.text || 'Файл'}
              </a>
            </div>
          ) : isVoice ? (
            <div>
              <audio controls className="w-full">
                <source src={fav.voice_url} type="audio/webm" />
                Ваш браузер не поддерживает аудио элемент.
              </audio>
            </div>
          ) : (
            <p className="break-words">{fav.text}</p>
          )}

          <p className="text-xs text-blue-100 mt-2">
            {formatTime(fav.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile overlay */}
      {showSearch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSearch(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col ${
        selectedChat ? 'hidden lg:flex' : 'flex'
      } relative z-50`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-blue-500 rounded-lg p-2 transition-all duration-200 transform hover:scale-105"
              onClick={() => setShowSettings(true)}
            >
              <div className="relative w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden group">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {getInitials(user?.nick)}
                  </span>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <CogIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{user?.nick}</h3>
                <p className="text-xs text-blue-100">В сети</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                title="Поиск пользователей"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                title="Выйти"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section */}
        {showSearch && (
          <div className="p-4 border-b border-gray-200 bg-gray-50 animate-slideDown">
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Поиск пользователей, сообщений, файлов..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Search Filters */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSearchFilter('users')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    searchFilter === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  👤 Пользователи
                </button>
                <button 
                  onClick={() => setSearchFilter('messages')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    searchFilter === 'messages' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  💬 Сообщения
                </button>
                <button 
                  onClick={() => setSearchFilter('files')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    searchFilter === 'files' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📎 Файлы
                </button>
              </div>
            </div>

            {/* Enhanced Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => addUserToChats(result.id)}
                    className="p-3 bg-white rounded-lg hover:bg-gray-100 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                          {result.avatar ? (
                            <img
                              src={result.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {getInitials(result.nick)}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          result.online ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{result.nick}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            {result.online ? '🟢 В сети' : '⚫ Не в сети'}
                          </span>
                          {!result.online && result.last_online && (
                            <span>
                              • {new Date(result.last_online * 1000).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <UserPlusIcon className="w-5 h-5 text-blue-400" />
                        <span className="text-xs text-gray-400">Добавить</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <div className="mt-3 p-6 text-center text-gray-500 bg-white rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MagnifyingGlassIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-medium mb-1">Ничего не найдено</p>
                <p className="text-sm">Попробуйте изменить поисковый запрос</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 p-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
            Чаты
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 p-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'favorites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HeartIcon className="w-4 h-4 inline mr-2" />
            Избранное
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <>
              {/* Избранное как первый элемент */}
              <div
                onClick={() => selectChat('Избранное')}
                className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-all duration-200 ${
                  selectedChat === 'Избранное' ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <HeartSolid className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Избранное</h4>
                    <p className="text-sm text-gray-500">Сохранённые сообщения</p>
                  </div>
                </div>
              </div>

              {/* User chats */}
              {chats.map((chat, index) => (
                <div
                  key={chat}
                  onClick={() => selectChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-all duration-200 animate-slideUp ${
                    selectedChat === chat ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {getInitials(chat)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{chat}</h4>
                        {unreadCounts[chat] && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse">
                            {unreadCounts[chat]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Нажмите для открытия чата</p>
                    </div>
                  </div>
                </div>
              ))}

              {chats.length === 0 && (
                <div className="p-8 text-center text-gray-500 animate-fadeIn">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Пока нет чатов</p>
                  <p className="text-sm">Найдите пользователей для начала общения</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'favorites' && (
            <div className="p-4">
              {favorites.length === 0 ? (
                <div className="text-center text-gray-500 py-8 animate-fadeIn">
                  <HeartIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-bounce" />
                  <p className="font-medium">Пока ничего нет</p>
                  <p className="text-sm">Добавьте сообщения в избранное</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav, index) => (
                    <div
                      key={index}
                      onClick={() => selectChat('Избранное')}
                      className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 cursor-pointer animate-slideUp"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <p className="text-sm text-gray-900 mb-1">
                        {fav.type === 'file' && fav.file_url ? (
                          <span className="text-blue-600">📎 {fav.text || 'Файл'}</span>
                        ) : fav.type === 'voice' && fav.voice_url ? (
                          <span className="text-purple-600">🎵 Голосовое сообщение</span>
                        ) : (
                          fav.text
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(fav.timestamp)} в {formatTime(fav.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${
        selectedChat ? 'flex' : 'hidden lg:flex'
      }`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    {selectedChat === 'Избранное' ? (
                      <HeartSolid className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {getInitials(selectedChat)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedChat}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat === 'Избранное' ? 'Ваши сохранённые сообщения' : 'В сети'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {/* Video call button */}
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {/* Phone call button */}
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  {/* More options */}
                  <button 
                    onClick={() => setShowChatSettings(!showChatSettings)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* Chat settings dropdown */}
              {showChatSettings && (
                <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]">
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
                    🔍 Поиск в чате
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
                    🔇 Отключить уведомления
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
                    🎨 Изменить тему чата
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
                    📱 Общие файлы
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600">
                    🚫 Заблокировать пользователя
                  </button>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedChat === 'Избранное' ? (
                favorites.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center animate-fadeIn">
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <HeartSolid className="w-12 h-12 text-red-500" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Избранные сообщения
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Здесь будут храниться ваши важные сообщения, файлы и заметки
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p>• Добавляйте текстовые сообщения</p>
                        <p>• Загружайте файлы и документы</p>
                        <p>• Записывайте голосовые заметки</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {favorites.map((fav, index) => renderFavoriteMessage(fav, index))}
                    <div ref={messagesEndRef} />
                  </>
                )
              ) : (
                messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center animate-fadeIn">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 text-blue-500" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Начните общение
                      </h2>
                      <p className="text-gray-600">
                        Отправьте первое сообщение пользователю {selectedChat}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => renderMessage(message, index))}
                    <div ref={messagesEndRef} />
                  </>
                )
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                  title="Прикрепить файл"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={selectedChat === 'Избранное' ? 'Добавить в избранное...' : 'Напишите сообщение...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (selectedChat === 'Избранное') {
                          addToFavorites();
                        } else {
                          sendMessage();
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-110">
                  <MicrophoneIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={selectedChat === 'Избранное' ? addToFavorites : sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title={selectedChat === 'Избранное' ? 'Добавить в избранное' : 'Отправить сообщение'}
                >
                  {selectedChat === 'Избранное' ? (
                    <HeartSolid className="w-5 h-5" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center animate-fadeIn">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-blue-500" />
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Добро пожаловать в Messenger
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Выберите чат для начала общения или найдите пользователей для новых разговоров
              </p>
              <div className="space-y-3 text-sm text-gray-500 max-w-sm mx-auto">
                <div className="flex items-center space-x-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-blue-500" />
                  <span>Найдите пользователей по имени</span>
                </div>
                <div className="flex items-center space-x-3">
                  <HeartIcon className="w-5 h-5 text-red-500" />
                  <span>Сохраняйте важные сообщения в Избранное</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-500" />
                  <span>Общайтесь с друзьями в реальном времени</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-xl font-semibold">⚙️ Настройки</h2>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setEditingNick(false);
                  setNewNick('');
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
              {/* Settings Navigation */}
              <div className="w-full lg:w-64 border-r border-gray-200 bg-gray-50">
                <div className="p-4">
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActiveSettingsTab('profile')}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeSettingsTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span className="font-medium">Профиль</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveSettingsTab('privacy')}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeSettingsTab === 'privacy' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-medium">Приватность</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveSettingsTab('appearance')}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeSettingsTab === 'appearance' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                      <span className="font-medium">Внешний вид</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveSettingsTab('notifications')}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeSettingsTab === 'notifications' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19l16-16m0 0H4m16 0v16" />
                      </svg>
                      <span className="font-medium">Уведомления</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveSettingsTab('storage')}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeSettingsTab === 'storage' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      <span className="font-medium">Хранилище</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Profile Settings */}
                {activeSettingsTab === 'profile' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6">👤 Настройки профиля</h3>
                    
                    <div className="flex flex-col items-center mb-8">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-lg">
                              {getInitials(user?.nick)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all duration-200 transform hover:scale-110"
                        >
                          <CameraIcon className="w-4 h-4" />
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </div>

                      <div className="mt-4 text-center w-full max-w-md">
                        {editingNick ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newNick}
                              onChange={(e) => setNewNick(e.target.value)}
                              placeholder={user?.nick?.split('#')[0]}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={updateNickname}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingNick(false);
                                setNewNick('');
                              }}
                              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">{user?.nick}</h3>
                            <button
                              onClick={() => {
                                setEditingNick(true);
                                setNewNick(user?.nick?.split('#')[0] || '');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 mt-1">ID: {user?.user_id}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">📝 Статус</h4>
                        <input
                          type="text"
                          placeholder="Добавьте свой статус..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue="В сети"
                        />
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">📧 Email</h4>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue={user?.email}
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeSettingsTab === 'privacy' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6">🔒 Настройки приватности</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">👁️ Видимость профиля</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Скрыть время последнего посещения</span>
                            <input
                              type="checkbox"
                              checked={privacySettings.hideLastSeen}
                              onChange={(e) => setPrivacySettings({...privacySettings, hideLastSeen: e.target.checked})}
                              className="rounded"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Скрыть фото профиля</span>
                            <input
                              type="checkbox"
                              checked={privacySettings.hideProfilePhoto}
                              onChange={(e) => setPrivacySettings({...privacySettings, hideProfilePhoto: e.target.checked})}
                              className="rounded"
                            />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Скрыть статус</span>
                            <input
                              type="checkbox"
                              checked={privacySettings.hideStatus}
                              onChange={(e) => setPrivacySettings({...privacySettings, hideStatus: e.target.checked})}
                              className="rounded"
                            />
                          </label>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">📨 Сообщения</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Отчеты о прочтении</span>
                            <input
                              type="checkbox"
                              checked={privacySettings.readReceipts}
                              onChange={(e) => setPrivacySettings({...privacySettings, readReceipts: e.target.checked})}
                              className="rounded"
                            />
                          </label>
                          <div>
                            <p className="text-sm text-gray-700 mb-2">Кто может писать мне сообщения</p>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                              <option>Все пользователи</option>
                              <option>Только контакты</option>
                              <option>Никто</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-800 mb-3">🚫 Заблокированные пользователи</h4>
                        <p className="text-sm text-red-600 mb-3">У вас нет заблокированных пользователей</p>
                        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                          Управление заблокированными
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Settings */}
                {activeSettingsTab === 'appearance' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6">🎨 Внешний вид</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">🌙 Тема</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setTheme('light')}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="w-full h-12 bg-white rounded mb-2 border"></div>
                            <p className="text-sm font-medium">Светлая</p>
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="w-full h-12 bg-gray-800 rounded mb-2"></div>
                            <p className="text-sm font-medium">Темная</p>
                          </button>
                          <button
                            onClick={() => setTheme('auto')}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              theme === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="w-full h-12 bg-gradient-to-r from-white to-gray-800 rounded mb-2"></div>
                            <p className="text-sm font-medium">Авто</p>
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">📱 Размер шрифта</h4>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="fontSize"
                              value="small"
                              checked={fontSize === 'small'}
                              onChange={(e) => setFontSize(e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-sm">Маленький</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="fontSize"
                              value="medium"
                              checked={fontSize === 'medium'}
                              onChange={(e) => setFontSize(e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-base">Средний</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="fontSize"
                              value="large"
                              checked={fontSize === 'large'}
                              onChange={(e) => setFontSize(e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-lg">Большой</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">🖼️ Фон чата</h4>
                        <div className="grid grid-cols-4 gap-3">
                          <button
                            onClick={() => setChatWallpaper('default')}
                            className={`aspect-square rounded-lg border-2 transition-colors ${
                              chatWallpaper === 'default' ? 'border-blue-500' : 'border-gray-200'
                            } bg-gray-100`}
                          >
                            <span className="text-xs">По умолчанию</span>
                          </button>
                          <button
                            onClick={() => setChatWallpaper('pattern1')}
                            className={`aspect-square rounded-lg border-2 transition-colors ${
                              chatWallpaper === 'pattern1' ? 'border-blue-500' : 'border-gray-200'
                            } bg-gradient-to-br from-blue-400 to-purple-600`}
                          >
                          </button>
                          <button
                            onClick={() => setChatWallpaper('pattern2')}
                            className={`aspect-square rounded-lg border-2 transition-colors ${
                              chatWallpaper === 'pattern2' ? 'border-blue-500' : 'border-gray-200'
                            } bg-gradient-to-br from-green-400 to-blue-600`}
                          >
                          </button>
                          <button
                            onClick={() => setChatWallpaper('custom')}
                            className={`aspect-square rounded-lg border-2 transition-colors ${
                              chatWallpaper === 'custom' ? 'border-blue-500' : 'border-gray-200'
                            } bg-gray-200 flex items-center justify-center`}
                          >
                            <span className="text-xs">📷</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeSettingsTab === 'notifications' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6">🔔 Уведомления</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">📱 Общие уведомления</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Включить уведомления</span>
                            <input type="checkbox" defaultChecked className="rounded" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Показывать превью сообщений</span>
                            <input type="checkbox" defaultChecked className="rounded" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Звук уведомлений</span>
                            <input type="checkbox" defaultChecked className="rounded" />
                          </label>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">⏰ Не беспокоить</h4>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Включить режим "Не беспокоить"</span>
                            <input type="checkbox" className="rounded" />
                          </label>
                          <div className="flex space-x-3">
                            <div className="flex-1">
                              <label className="text-sm text-gray-700">С</label>
                              <input type="time" defaultValue="22:00" className="w-full px-2 py-1 border rounded" />
                            </div>
                            <div className="flex-1">
                              <label className="text-sm text-gray-700">До</label>
                              <input type="time" defaultValue="08:00" className="w-full px-2 py-1 border rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Storage Settings */}
                {activeSettingsTab === 'storage' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-6">💾 Управление хранилищем</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">📊 Использование памяти</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Сообщения</span>
                            <span className="text-sm font-medium">2.4 МБ</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Изображения</span>
                            <span className="text-sm font-medium">15.2 МБ</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Документы</span>
                            <span className="text-sm font-medium">8.7 МБ</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between items-center font-medium">
                              <span className="text-gray-900">Всего</span>
                              <span className="text-gray-900">26.3 МБ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">🗑️ Очистка данных</h4>
                        <div className="space-y-3">
                          <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">Очистить кэш изображений</span>
                              <span className="text-xs text-gray-500">15.2 МБ</span>
                            </div>
                          </button>
                          <button className="w-full p-3 text-left bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">Удалить временные файлы</span>
                              <span className="text-xs text-gray-500">3.1 МБ</span>
                            </div>
                          </button>
                          <button className="w-full p-3 text-left bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                            <span className="text-sm text-red-700">Очистить все данные</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                  💾 Сохранить настройки
                </button>
                <button
                  onClick={logout}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  🚪 Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Messenger;
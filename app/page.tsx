"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, PlusCircle, Search, X, Settings, LogOut, Database, FileText, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthComponent from '@/components/Auth';
import ProfileModal from '@/components/ProfileModal';
import EditableTitle from '@/components/EditableTitle';
import ChatSearch from '@/components/ChatSearch';
import DriveFileLink from '@/components/DriveFileLink';
import { Session } from '@supabase/supabase-js';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { getAIResponse, generateChatTitle } from '@/lib/ai-service';

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  chat_id: string;
  user_id: string;
}

interface ProfileData {
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DriveFile {
  id: string;
  url: string;
  name: string;
  isProcessed: boolean;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // File state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [newFileUrl, setNewFileUrl] = useState('');
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFilesSection, setShowFilesSection] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        getProfile(session.user.id);
        loadChats(session.user.id);
        // You would load files here if they're stored in the database
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getProfile(session.user.id);
        loadChats(session.user.id);
      }
    });

    // Close profile menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Existing functions...
  async function loadChats(userId: string) {
    try {
      setIsLoadingChats(true);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setChats(data);
        if (data.length > 0) {
          setCurrentChatId(data[0].id);
          loadMessages(userId, data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  }

  async function loadMessages(userId: string, chatId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async function handleUpdateChatTitle(chatId: string, newTitle: string) {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId);

      if (error) throw error;

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  }

  const handleNewChat = async () => {
    if (!session?.user.id) return;

    try {
      const newChatId = uuidv4();
      const { data, error } = await supabase
        .from('chats')
        .insert([
          { 
            id: newChatId,
            user_id: session.user.id,
            title: 'New Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setChats(prev => [data, ...prev]);
        setCurrentChatId(data.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    if (session?.user.id) {
      loadMessages(session.user.id, chatId);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!session?.user.id) return;

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        if (chats.length > 1) {
          const nextChat = chats.find(chat => chat.id !== chatId);
          if (nextChat) {
            setCurrentChatId(nextChat.id);
            loadMessages(session.user.id, nextChat.id);
          }
        } else {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowProfileMenu(false);
  };

  // File handling functions
  const extractFileId = (url: string) => {
    // Common Google Drive URL patterns
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/,
      /[-\w]{25,}/ // Fallback to match typical file ID pattern
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const getFileNameFromUrl = (url: string) => {
    // Try to extract a meaningful name
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && !lastPart.includes('?')) return lastPart;
    return `File ${driveFiles.length + 1}`;
  };

  const addDriveLink = () => {
    try {
      setFileError(null);
      if (!newFileUrl.trim()) {
        setFileError("Please enter a file URL");
        return;
      }

      const fileId = extractFileId(newFileUrl);
      if (!fileId) {
        setFileError("Invalid Google Drive link");
        return;
      }

      // Check if file already exists
      if (driveFiles.some(f => f.id === fileId)) {
        setFileError("This file has already been added");
        return;
      }

      const fileName = getFileNameFromUrl(newFileUrl);
      const newFile: DriveFile = {
        id: fileId,
        url: newFileUrl,
        name: fileName,
        isProcessed: false
      };

      setDriveFiles(prev => [...prev, newFile]);
      setNewFileUrl('');
    } catch (err) {
      setFileError("Error adding file");
      console.error("Error adding file:", err);
    }
  };

  const removeFile = (fileId: string) => {
    setDriveFiles(prev => prev.filter(file => file.id !== fileId));
    // If you're storing file contents, remove them too
    const updatedContents = {...fileContents};
    delete updatedContents[fileId];
    setFileContents(updatedContents);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !session?.user.id || !currentChatId) return;

    try {
      setIsLoading(true);
      
      let prompt = inputMessage;
      if (driveFiles.length > 0) {
        prompt = `Using the following file references:\n${driveFiles.map(f => `- ${f.name} (${f.url})`).join('\n')}\n\nUser question: ${inputMessage}`;
      }
      
      const userMessage = inputMessage;
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          user_id: session.user.id,
          chat_id: currentChatId,
          content: userMessage,
          role: 'user',
        });

      if (userMessageError) throw userMessageError;

      // Generate title for new chats
      if (messages.length === 0) {
        const newTitle = await generateChatTitle(userMessage);
        await handleUpdateChatTitle(currentChatId, newTitle);
      }

      setMessages(prev => [...prev, { 
        id: Date.now(), 
        content: userMessage, 
        role: 'user',
        created_at: new Date().toISOString(),
        chat_id: currentChatId,
        user_id: session.user.id
      }]);
      setInputMessage('');

      const aiResponse = await getAIResponse(prompt);
      if (aiResponse) {
        const { error: aiMessageError } = await supabase
          .from('messages')
          .insert({
            user_id: session.user.id,
            chat_id: currentChatId,
            content: aiResponse,
            role: 'assistant',
          });

        if (aiMessageError) throw aiMessageError;

        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          content: aiResponse, 
          role: 'assistant',
          created_at: new Date().toISOString(),
          chat_id: currentChatId,
          user_id: session.user.id
        }]);
      }

    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return <AuthComponent />;
  }

  return (
    <div className="grid grid-cols-[256px_1fr] h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="chat-sidebar overflow-hidden flex flex-col bg-gray-900">
        <button 
          onClick={handleNewChat}
          className="w-full mb-4 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          New Chat
        </button>

        <ChatSearch onSearch={setSearchTerm} />

        <div className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <div className="text-gray-400 text-center p-4">Loading chats...</div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item group relative ${
                  currentChatId === chat.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div 
                    onClick={() => handleSelectChat(chat.id)}
                    className="flex-grow cursor-pointer"
                  >
                    <EditableTitle
                      title={chat.title}
                      onSave={(newTitle) => handleUpdateChatTitle(chat.id, newTitle)}
                    />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex flex-col bg-white overflow-hidden">
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            {showFilesSection 
              ? 'Files Database' 
              : (currentChatId ? chats.find(c => c.id === currentChatId)?.title : 'My Smart AI Assistant')}
          </h1>
          
          {/* Profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg"
            >
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <User className="w-8 h-8 p-1 bg-gray-200 rounded-full" />
              )}
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(true);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Settings size={16} />
                  Profile Settings
                </button>
                
                <button
                  onClick={() => {
                    setShowFilesSection(!showFilesSection);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Database size={16} />
                  Files Database
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {showFilesSection ? (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-600 mb-6">
                Add Google Drive file links to use as context for your AI conversations.
              </p>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-medium mb-3">Add a new file link</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    placeholder="Paste Google Drive shared link"
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addDriveLink}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Add File
                  </button>
                </div>
                
                {fileError && (
                  <p className="text-red-500 text-sm mt-1 mb-3">{fileError}</p>
                )}
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Your Files ({driveFiles.length})</h3>
                  {driveFiles.length > 0 ? (
                    <div className="space-y-2">
                      {driveFiles.map(file => (
                        <div key={file.id} className="flex items-center gap-2 p-3 border rounded-lg">
                          <FileText className="text-blue-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 truncate">{file.url}</p>
                          </div>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete file"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No files added yet</p>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => setShowFilesSection(false)}
                className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Return to Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`message-bubble ${message.role}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="message-bubble assistant">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4">
              {driveFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {driveFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-1 bg-gray-100 text-sm px-2 py-1 rounded">
                      <FileText size={14} className="text-blue-500" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="ml-1 text-gray-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="chat-input"
                />
                <button
                  type="submit"
                  disabled={isLoading || !currentChatId}
                  className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => {
          setIsProfileOpen(false);
          if (session) {
            getProfile(session.user.id);
          }
        }} 
      />
    </div>
  );
}
"use client";
import React, { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthComponent from '@/components/Auth';
import ProfileModal from '@/components/ProfileModal';
import { Session } from '@supabase/supabase-js';
import Image from 'next/image';
import { getAIResponse } from '@/lib/ai-service';

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ProfileData {
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        getProfile(session.user.id);
        loadMessages(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getProfile(session.user.id);
        loadMessages(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadMessages(userId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url, first_name, last_name')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  }

  async function saveMessage(content: string, role: 'user' | 'assistant') {
    if (!session?.user.id || !content) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: session.user.id,
          content,
          role
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    try {
      setIsLoading(true);
      
      // Save and display user message
      const userMessage = inputMessage;
      await saveMessage(userMessage, 'user');
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        content: userMessage, 
        role: 'user',
        created_at: new Date().toISOString()
      }]);
      setInputMessage('');

      // Get and save AI response
      const aiResponse = await getAIResponse(userMessage);
      if (aiResponse) {
        await saveMessage(aiResponse, 'assistant');
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          content: aiResponse, 
          role: 'assistant',
          created_at: new Date().toISOString()
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
    <main className="flex flex-col h-screen bg-gray-100">
      {/* Chat header with user info */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-semibold text-gray-800">My Smart AI Assistant</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 p-1 bg-gray-200 rounded-full" />
            )}
            <span className="text-sm text-gray-600">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : session.user.email}
            </span>
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 shadow-lg border-t">
        <div className="flex space-x-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 focus:outline-none disabled:bg-blue-300 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => {
          setIsProfileOpen(false);
          if (session) {
            getProfile(session.user.id);
          }
        }} 
      />
    </main>
  );
}
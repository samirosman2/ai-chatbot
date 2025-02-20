import { supabase } from './supabase';
import { getAIResponse } from './ai-service';

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export async function generateChatTitle(firstMessage: string) {
  try {
    const prompt = `Based on this first message, generate a short, concise chat title (max 6 words): "${firstMessage}"`;
    const titleResponse = await getAIResponse(prompt);
    return titleResponse.replace(/["']/g, '').trim();
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Chat';
  }
}

export async function createChat(userId: string, title: string) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert([
        { user_id: userId, title }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

export async function loadChats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading chats:', error);
    throw error;
  }
}
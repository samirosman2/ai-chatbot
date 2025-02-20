import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// Initialize OpenAI with explicit API key
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interface for document type
interface Document {
  id: number;
  content: string;
  similarity: number;
}

// Function to generate embeddings
async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to add content to knowledge base
export async function addToKnowledgeBase(content: string) {
  try {
    console.log('Generating embedding for:', content);
    const embedding = await generateEmbedding(content);
    
    console.log('Inserting into database...');
    const { error } = await supabase
      .from('knowledge_base')
      .insert({
        content,
        embedding
      });

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Successfully added to knowledge base');
    return true;
  } catch (error) {
    console.error('Error adding to knowledge base:', error);
    throw error;
  }
}

// Function to search knowledge base
export async function searchKnowledgeBase(query: string): Promise<Document[]> {
  try {
    console.log('Searching for:', query);
    const queryEmbedding = await generateEmbedding(query);
    
    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.8,
        match_count: 3
      });

    if (error) {
      console.error('Supabase search error:', error);
      throw error;
    }

    console.log('Search results:', data);
    return data || [];
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    throw error;
  }
}

// Optional: Function to delete content from knowledge base
export async function deleteFromKnowledgeBase(id: number) {
  try {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting from knowledge base:', error);
    throw error;
  }
}

// Optional: Function to list all documents
export async function listAllDocuments() {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('id, content')
      .order('id', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
}
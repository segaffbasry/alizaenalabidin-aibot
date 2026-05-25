export interface Profile {
  id: string
  name: string | null
  role: 'user' | 'admin'
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface KnowledgeEntry {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

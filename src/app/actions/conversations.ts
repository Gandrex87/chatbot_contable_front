'use server';

import { query } from '@/lib/db/postgres';
import type { Message } from '@/lib/types';

interface ChatHistoryRow {
  id: number;
  session_id: string;
  message: {
    type: 'ai' | 'human';
    content: string;
    tool_calls?: any[];
    additional_kwargs?: any;
    response_metadata?: any;
  };
  created_at?: string; // Si la tabla tiene timestamp
}

export interface Conversation {
  sessionId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getConversationsList(username: string): Promise<Conversation[]> {
  try {
    // Query para obtener lista de conversaciones agrupadas por session_id
    // WITH conversation_summary AS (...) es un CTE - una tabla temporal en la query
    const sqlQuery = `
      WITH conversation_summary AS (
        SELECT 
          session_id,
          MIN(id) as first_message_id,
          MAX(id) as last_message_id,
          COUNT(*) as message_count,
          MIN(id) as created_order,
          MAX(id) as updated_order
        FROM n8n_chat_histories
        WHERE session_id LIKE $1
        GROUP BY session_id
      )
      SELECT 
        cs.session_id,
        cs.message_count,
        first_msg.message as first_message,
        last_msg.message as last_message,
        cs.created_order,
        cs.updated_order
      FROM conversation_summary cs
      JOIN n8n_chat_histories first_msg ON first_msg.id = cs.first_message_id
      JOIN n8n_chat_histories last_msg ON last_msg.id = cs.last_message_id
      ORDER BY cs.updated_order DESC
      LIMIT 20
    `;

    const rows = await query<any>(sqlQuery, [`${username}_%`]);

    // Formatear las conversaciones
    const conversations: Conversation[] = rows.map(row => {
      // Extraer el primer mensaje del usuario para el título
      let title = 'Nueva conversación';
      try {
        const firstMessage = row.first_message;
        if (firstMessage.type === 'human') {
          title = firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '');
        } else {
          // Si el primer mensaje es del AI, usar el segundo mensaje
          title = 'Conversación iniciada por asistente';
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }

      // Extraer el último mensaje
      let lastMessage = '';
      try {
        const lastMsg = row.last_message;
        lastMessage = lastMsg.content.substring(0, 100) + (lastMsg.content.length > 100 ? '...' : '');
      } catch (e) {
        console.error('Error parsing last message:', e);
      }

      return {
        sessionId: row.session_id,
        title,
        lastMessage,
        messageCount: parseInt(row.message_count),
        createdAt: new Date(row.created_order), // Usamos el ID como referencia temporal
        updatedAt: new Date(row.updated_order),
      };
    });

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

export async function getConversationMessages(sessionId: string, username: string): Promise<Message[]> {
  try {
    // Verificar que el sessionId pertenece al usuario
    if (!sessionId.startsWith(`${username}_`)) {
      throw new Error('Unauthorized access to conversation');
    }

    const sqlQuery = `
      SELECT id, session_id, message
      FROM n8n_chat_histories 
      WHERE session_id = $1
      ORDER BY id ASC
    `;

    const rows = await query<ChatHistoryRow>(sqlQuery, [sessionId]);

    // Convertir formato n8n a formato de la aplicación
    const messages: Message[] = rows.map((row, index) => {
      const msg = row.message;
      return {
        id: row.id.toString(),
        role: msg.type === 'human' ? 'user' : 'assistant',
        content: msg.content,
        // No incluimos reportId aquí, se detecta después si es necesario
      };
    });

    return messages;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return [];
  }
}

// Función auxiliar para obtener el título de una conversación basado en los primeros mensajes
export async function getConversationTitle(sessionId: string): Promise<string> {
  try {
    const sqlQuery = `
      SELECT message 
      FROM n8n_chat_histories 
      WHERE session_id = $1 AND message->>'type' = 'human'
      ORDER BY id ASC 
      LIMIT 1
    `;

    const rows = await query<any>(sqlQuery, [sessionId]);
    
    if (rows.length > 0) {
      const content = rows[0].message.content;
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    return 'Nueva conversación';
  } catch (error) {
    console.error('Error getting conversation title:', error);
    return 'Conversación';
  }
}
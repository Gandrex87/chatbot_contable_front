'use server';

import { query } from '@/lib/db/postgres';
import type { Message } from '@/lib/types';

// Tipos para las filas de la base de datos
interface ConversationHistoryRow {
  sessionId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string; // La fecha viene como string desde la BD
}

interface ChatHistoryRow {
  id: number;
  message: {
    type: 'ai' | 'human';
    content: string;
  };
}

// Interfaz que usa el frontend (sin cambios)
export interface Conversation {
  sessionId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: Date;
}

// =================================================================
// 1. getConversationsList (¡AHORA MUY SIMPLE!)
// =================================================================
export async function getConversationsList(username: string): Promise<Conversation[]> {
  try {
    // La consulta ahora es un simple SELECT a nuestra tabla de resumen.
    const sqlQuery = `
      SELECT
        session_id as "sessionId",
        title,
        last_message as "lastMessage",
        message_count as "messageCount",
        updated_at as "updatedAt"
      FROM
        conversations_history
      WHERE
        username = $1
      ORDER BY
        updated_at DESC;
    `;

    const rows = await query<ConversationHistoryRow>(sqlQuery, [username]);

    // El mapeo ahora es trivial: solo convertimos la fecha a objeto Date.
    return rows.map(row => ({
      ...row,
      updatedAt: new Date(row.updatedAt),
    }));

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

// =================================================================
// 2. getConversationMessages (SIN CAMBIOS)
// =================================================================
export async function getConversationMessages(sessionId: string, username: string): Promise<Message[]> {
  try {
    // Esta función sigue siendo necesaria y correcta.
    // Lee el historial detallado de la tabla de memoria original de n8n.
    if (!sessionId.startsWith(`${username}_`)) {
      throw new Error('Unauthorized access to conversation');
    }

    const sqlQuery = `
      SELECT id, message
      FROM n8n_chat_histories 
      WHERE session_id = $1
      ORDER BY id ASC
    `;

    const rows = await query<ChatHistoryRow>(sqlQuery, [sessionId]);

    return rows.map(row => ({
      id: row.id.toString(),
      role: row.message.type === 'human' ? 'user' : 'assistant',
      content: row.message.content,
    }));

  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return [];
  }
}

// =================================================================
// 3. getConversationTitle (ELIMINADA)
// =================================================================
// Esta función ya no es necesaria. El título se obtiene directamente
// desde la tabla conversations_history en getConversationsList.
// Puedes borrarla por completo.
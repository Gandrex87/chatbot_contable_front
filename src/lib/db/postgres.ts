import { Pool } from 'pg';

// Crear pool de conexiones
export const pool = new Pool({
  host: '10.1.0.188',
  port: 5433,
  database: process.env.POSTGRES_DATABASE || 'n8n',
  user: process.env.POSTGRES_USER || 'n8n',
  password: process.env.POSTGRES_PASSWORD || 'testpostgrespass33',
  max: 20, // Máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 3000, // Tiempo máximo para conectar
});

// Función helper para ejecutar queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Función para verificar la conexión
export async function checkConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
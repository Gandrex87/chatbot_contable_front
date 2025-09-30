// test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: '10.1.0.188',
  port: 5433,
  database: 'n8n', // o el nombre correcto
  user: 'n8n',
  password: 'testpostgrespass33',
});

async function test() {
  try {
    // Test conexión
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', res.rows[0]);
    
    // Test tabla
    const tables = await pool.query(`
      SELECT COUNT(*) as total 
      FROM n8n_chat_histories 
      WHERE session_id LIKE 'admin_%'
    `);
    console.log('✅ Conversaciones encontradas:', tables.rows[0].total);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
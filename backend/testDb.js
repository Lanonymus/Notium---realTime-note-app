import pool from './db.js';

async function addUser(username, passwordHash) {
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, passwordHash] // $1 i $2 to parametry zapytania
    );
    console.log('Dodano użytkownika o id:', result.rows[0].id);
  } catch (err) {
    console.error('Błąd przy dodawaniu użytkownika:', err);
  }
}

// test
addUser('Kuba', 'tajnehaslohash');

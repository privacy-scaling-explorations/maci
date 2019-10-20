// @flow
const { Pool } = require('pg')
const { getDbCredentials } = require('./settings')

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME
} = getDbCredentials()

const pool = new Pool({
  connectionString: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
})

const initDb = async () => {
  // Tries to connect to database
  try {
    await pool.query('SELECT NOW();')
    console.log('Database connected')
  } catch (e) {
    console.log(e)
    throw new Error('Unable to connect to database')
  }

  // Initializes the database if needed

  // Vault (private and public key)
  try {
    await pool.query('SELECT * FROM vault;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE vault (
        name TEXT,
        private_key TEXT
      );
    `)
  }

  // User
  try {
    await pool.query('SELECT * FROM users LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        index INTEGER NOT NULL,
        public_key TEXT[] NOT NULL
      );
    `)
  }

  // Submitted messages (a.k.a votes)
  try {
    await pool.query('SELECT * FROM messages LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        message INTEGER[] NOT NULL
      );
    `)
  }

  // Merkle Tree (cache)
  try {
    await pool.query('SELECT * FROM merkletrees LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE merkletrees (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        depth INTEGER NOT NULL,
        next_index INTEGER NOT NULL,
        root TEXT NOT NULL,
        zero_value TEXT NOT NULL,
        zeros JSONB NOT NULL,
        filled_sub_trees JSONB NOT NULL,
        filled_paths JSONB NOT NULL
      );
    `)
  }

  // Merkle Tree (leaf value)
  try {
    await pool.query('SELECT * FROM leaves LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE leaves (
        merkletree_id INTEGER REFERENCES merkletrees(id),
        index INTEGER NOT NULL,
        data JSONB NOT NULL,
        hash TEXT NOT NULL
      );
    `)
  }

  console.log('Database initialized successfully')
}

module.exports = {
  initDb,
  dbPool: pool
}

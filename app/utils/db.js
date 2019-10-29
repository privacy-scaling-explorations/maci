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
  } catch (e) {
    console.log('[ERROR]', e)
    throw new Error('Unable to connect to database')
  }

  // If test then drop all tables
  if (process.env.ENV_TYPE === 'TEST') {
    await pool.query('DROP SCHEMA public CASCADE;')
    await pool.query('CREATE SCHEMA public;')
    console.log('[STATUS]', 'Dropping database tables')
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
    // Note: index in user corresponds to the index its
    // located in the merkletree
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        index INTEGER NOT NULL,
        public_key TEXT[] NOT NULL,
        public_key_hash TEXT NOT NULL
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
    // public_key is the user's public key used to
    // encrypt the data in `data` column (with a structure of { data: BigInt[] })
    await pool.query(`
      CREATE TABLE leaves (
        merkletree_id INTEGER REFERENCES merkletrees(id),
        index INTEGER NOT NULL,
        data JSONB NOT NULL,
        public_key TEXT[] NOT NULL,
        hash TEXT NOT NULL
      );
    `)
  }
}

module.exports = {
  initDb,
  dbPool: pool
}

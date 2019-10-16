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
        private_key BIGINT
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
        public_key BIGINT[] NOT NULL
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

  // Merkle Tree state
  try {
    await pool.query('SELECT * FROM leaves LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE leaves (
        index INTEGER NOT NULL PRIMARY KEY,
        data JSONB not NULL,
        hash BIGINT not null,
        message_id INTEGER REFERENCES messages(id)
      );
    `)
  }

  try {
    await pool.query('SELECT * FROM sub_trees LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE sub_trees (
        index INTEGER NOT NULL,
        hash BIGINT NOT NULL
      );
    `)
  }

  try {
    await pool.query('SELECT * FROM tree_paths LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE tree_paths (
        depth INTEGER NOT NULL,
        index INTEGER NOT NULL,
        hash BIGINT NOT NULL
      );
    `)
  }
}

module.exports = {
  initDb,
  dbPool: pool
}

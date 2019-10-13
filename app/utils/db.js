// @flow
import type { DbCredentials } from './settings'

const { Pool } = require('pg')
const { getDbCredentials } = require('./settings')

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT
} = getDbCredentials()

const pool = new Pool({
  connectionString: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_PORT}`
})

const initDb = async () => {
  // Tries to connect to database
  try {
    await pool.query('SELECT NOW()')
    console.log('Database connected')
  } catch (e) {
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

  // Merkle Tree state
  try {
    await pool.query('SELECT * FROM leaves LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE leaves (
        index INTEGER NOT NULL PRIMARY KEY,
        data JSONB not NULL,
        hash BIGINT not null
      );
    `)
  }

  try {
    await pool.query('SELECT * FROM sub_trees LIMIT 1;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE sub_trees (
        depth INTEGER NOT NULL,
        index INTEGER NOT NULL,
        hash BIGINT not null
      );
    `)
  }

  try {
    await pool.query('SELECT * FROM sub_trees;')
  } catch (e) {
    await pool.query(`
      CREATE TABLE sub_trees (
        depth INTEGER NOT NULL,
        index INTEGER NOT NULL,
        hash BIGINT not null
      );
    `)
  }
}

module.exports = {
  initDb
}

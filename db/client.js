// db/client.js
// Neon serverless Postgres connection
// Used by all pipeline scripts and API routes

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Check your .env file.');
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };

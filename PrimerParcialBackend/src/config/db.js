import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pizarra',
  password: 'Medrano73697178',
  port: 5432
});

export default pool;

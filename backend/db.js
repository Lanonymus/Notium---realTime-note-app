import { Pool } from 'pg' // postgreSQL

const pool = new Pool({
  user: "postgres",       // zmień na swoje dane
  host: "localhost",
  database: "Notium",
  password: "1234",
  port: 5432,
});

export default pool

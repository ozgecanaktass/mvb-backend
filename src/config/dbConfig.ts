import 'dotenv/config';

// Azure SQL settings
export const sqlConfig = {
  // using individual parameters instead of connection string !!
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER || 'localhost', // default to localhost for local/dev
  
  pool: {
    max: 10, 
    min: 0, 
    idleTimeoutMillis: 30000 
  },

  options: {
    encrypt: false, 
    trustServerCertificate: true 
  }
};

// Azure Cosmos DB settings
export const cosmosConfig = {
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
  databaseId: process.env.COSMOS_DATABASE_ID || 'EyewearDB',
  containerId: 'visits', 
};
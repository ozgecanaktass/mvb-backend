import 'dotenv/config';

export const sqlConfig = {
  connectionString: process.env.AZURE_SQL_CONNECTION_STRING,
  options: {
    encrypt: true, 
    trustServerCertificate: false 
  }
};
export const cosmosConfig = {
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
  databaseId: process.env.COSMOS_DATABASE_ID || 'EyewearDB',
  containerId: 'visits', 
};
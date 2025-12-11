//import .env 
import dotenv from 'dotenv';
dotenv.config();

import app from './app';

// get the port from .env or use default
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🚀 Server is starting...');

    app.listen(PORT, () => {
      console.log(`
        ################################################
          Server Started Successfully!
          Address: http://localhost:${PORT}
          Environment: ${process.env.NODE_ENV}
        ################################################
      `);
    });

  } catch (error) {
    console.error('❌ FAILED TO START SERVER:', error);
    process.exit(1);
  }
};

startServer();

// error handling for server
process.on('unhandledRejection', (reason : Error) => {
  console.error('Unhandled Rejection at:', reason.message);
});

// for unexpected code error exceptions
process.on('uncaughtException', (error : Error) => {
  console.error('Uncaught Exception thrown:', error.message);
  process.exit(1);
});


import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';

const port = Number(process.env.PORT) || 5000;

try {
  await connectDB();
  const server = app.listen(port, () => {
    console.info(`API listening on port ${port}`);
  });

  const shutdown = (signal) => {
    console.info(`${signal} received; closing HTTP server`);
    server.close(async (error) => {
      if (error) {
        console.error('Error while closing HTTP server:', error);
        process.exitCode = 1;
      }
      await mongoose.disconnect();
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error('Failed to start API:', error.message);
  process.exit(1);
}

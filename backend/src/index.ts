import app from './app';
import { env } from './config/env';

async function start() {
  try {
    // Start server
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();

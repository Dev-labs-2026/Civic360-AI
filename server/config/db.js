import mongoose from 'mongoose';

let dbType = 'Disconnected';
let dbHost = '';
let dbName = '';

/**
 * Returns current database connection metadata without exposing secrets
 */
export const getDbStatus = () => {
  const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = mongoose.connection.readyState;

  return {
    connected: state === 1,
    status: stateNames[state] || 'unknown',
    type: dbType,
    host: dbHost,
    name: dbName,
  };
};

/**
 * Connect to MongoDB
 * Connects to MongoDB Atlas or local MongoDB using Mongoose.
 * Strict rules:
 * - When an Atlas or remote URI is provided, NEVER use memory fallback.
 * - Never log credentials or raw connection strings.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in server/.env.');
  }

  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');
  const isLocal = uri.includes('127.0.0.1') || uri.includes('localhost');

  try {
    console.log(` Connecting to ${isAtlas ? 'MongoDB Atlas' : isLocal ? 'Local MongoDB' : 'Remote MongoDB'}...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    dbType = isAtlas ? 'MongoDB Atlas' : isLocal ? 'Local MongoDB' : 'Remote MongoDB';
    dbHost = conn.connection.host || 'connected';
    dbName = conn.connection.name || 'civic360';

    console.log(` [Database] Connected successfully to ${dbType}`);
    console.log(`   Host: ${dbHost}`);
    console.log(`   Database Name: ${dbName}`);

    return conn;
  } catch (err) {
    // If it is Atlas or explicit remote URI, DO NOT use in-memory fallback
    if (isAtlas || !isLocal) {
      console.error(' [Database Error] Failed to connect to the configured remote MongoDB instance.');
      throw err;
    }

    // Optional local dev fallback ONLY if local mongo daemon is offline and memory fallback is allowed
    if (process.env.ALLOW_MEMORY_FALLBACK === 'true') {
      console.warn('! Local MongoDB connection failed; attempting the configured development fallback.');
      console.log(' Attempting fallback to MongoMemoryServer (development mode)...');

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const conn = await mongoose.connect(memoryUri);

        dbType = 'In-Memory Fallback (Dev Only)';
        dbHost = conn.connection.host || 'in-memory-daemon';
        dbName = conn.connection.name || 'civic360_dev';

        console.log(` [Database] Connected to ${dbType} at ${dbHost}`);
        return conn;
      } catch (fallbackError) {
        console.error(' Failed to initialize in-memory fallback.');
        throw fallbackError;
      }
    }

    // Default error handling
    console.error(' [Database Error] MongoDB connection failed.');
    throw err;
  }
};

export default connectDB;

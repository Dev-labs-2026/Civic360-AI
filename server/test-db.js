import { MongoMemoryServer } from 'mongodb-memory-server';

console.log('Testing MongoMemoryServer...');
try {
  const mongod = await MongoMemoryServer.create();
  console.log('Uri:', mongod.getUri());
  await mongod.stop();
  console.log('Done!');
} catch (e) {
  console.error('Error:', e);
}

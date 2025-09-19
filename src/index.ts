import fastify from 'fastify'
import dotenv from 'dotenv';
import scrape from './scrape';
import { request } from 'http';
import { getCache, setCache } from './cache';
import redisStore from './db/redis';

dotenv.config({ override: true });

const server = fastify();

server.get('/classes', async (request, reply) => {
  
  const collegeId = (request.query as any).collegeId;

  if (!collegeId) {
    reply.status(400);
    return { error: "collegeId is required" };
  }

  const cache = await getCache(redisStore, collegeId);

  if(cache) {
    reply.header('content-type', 'application/json');
    return cache;
  }

  const tableData = await scrape(collegeId);
  
  await setCache(redisStore, collegeId, JSON.stringify(tableData));

  return tableData;

});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
});
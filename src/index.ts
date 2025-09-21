import fastify from "fastify";
import dotenv from "dotenv";
import scrape from "./scrape";
import { getCache, setCache } from "./cache";
import redisStore from "./db/redis";
import type { ClassesQuery } from "./types/api";
import fastifyCors from "@fastify/cors";

dotenv.config({ override: true });

const server = fastify();

// TODO: add options for the cors before deploy
(async () => await server.register(fastifyCors))();

server.get<{ Querystring: ClassesQuery }>(
  "/classes",
  async (request, reply) => {
    const collegeId = request.query.collegeId;

    if (!collegeId) {
      reply.status(400);
      return { error: "collegeId is required" };
    }

    const cache = await getCache(redisStore, collegeId);

    if (cache) {
      reply.header("content-type", "application/json");
      return cache;
    }

    const tableData = await scrape(collegeId);

    await setCache(redisStore, collegeId, JSON.stringify(tableData));

    return tableData;
  },
);

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

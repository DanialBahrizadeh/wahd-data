import fastify from "fastify";
import scrape from "./scrape";
import { getCache, setCache } from "./cache";
import redisStore from "./db/redis";
import memoryStore from "./db/memory";
import type { ClassesQuery, BuildHeader } from "./types/api";
import fastifyCors from "@fastify/cors";
import {env} from "./config/env";
import { Lesson } from "./types/lesson";
import formbody from "@fastify/formbody";

const server = fastify();

server.register(formbody);

// TODO: add options for the cors before deploy
(async () => await server.register(fastifyCors))();

server.get<{ Querystring: ClassesQuery }>(
  "/classes",
  async (request, reply) => {
    const collegeId = request.query.collegeId;

    if (!collegeId) {
      reply.status(400);
      return { error: "collegeId is required", code: "bad_query"};
    }

    const cache = await getCache(memoryStore, collegeId);

    if (cache) {
      reply.header("content-type", "application/json");
      return cache;
    }

    reply.status(400);
    return {error: "fetching data and building cache", code: "fetching_data"};

    // const tableData = await scrape();

    // await setCache(memoryStore, collegeId, JSON.stringify(tableData));

  }

);

server.post<{ Headers: BuildHeader}>(
  "/build",
  async (request, reply) => {
    
    const value = request.headers.authorization;

    if(!value) {
      reply.status(400);
      return {error: "authorization header is required", code:"bad_headers"}
    }

    const [authType, authSecret] = value.split(" "); 

    if(authType != "Basic") {
      reply.status(400);
      return {error: "only basic authorization is accepted", code: "bad_authorization_header"}
    }

    if(authSecret != env.ADMIN_SECRET) {
      reply.status(401);
      return {error: "not authorized to access this resource", code: "unauthorized"}
    }

    const data = await scrape();

    // TODO multithread this code and use memorystore for job report
    for(const [facultyId, lessons] of Object.entries(data)) {
      await setCache(memoryStore, facultyId, JSON.stringify(lessons));
    };

    return {
      message: "success"
    }

    // await setCache(memoryStore, collegeId, JSON.stringify(tableData));

  }

);

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

import fastify from "fastify";
import scrape from "./scrape";
import { getCache, setCache } from "./cache";
import redisStore from "./db/redis";
import memoryStore from "./db/memory";
import type { ClassesQuery, BuildHeader } from "./types/api";
import fastifyCors from "@fastify/cors";
import { env } from "./config/env";
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
    const gender = request.query.gender;

    if (!collegeId) {
      reply.status(400);
      return { error: "collegeId is required", code: "bad_query" };
    }

    if (!gender) {
      reply.status(400);
      return { error: "gender is required", code: "bad_query" };
    }

    if (gender == 0) {
      return { error: "no reason", code: "god_knows" };
    }

    const cache = await getCache(
      redisStore,
      gender == 1 ? `man-${collegeId}` : `woman-${collegeId}`,
    );

    if (cache) {
      reply.header("content-type", "application/json");
      return cache;
    }

    reply.status(400);
    return { error: "fetching data and building cache", code: "fetching_data" };

    // const tableData = await scrape();

    // await setCache(memoryStore, collegeId, JSON.stringify(tableData));
  },
);

server.post<{ Headers: BuildHeader }>("/build", async (request, reply) => {
  const value = request.headers.authorization;

  if (!value) {
    reply.status(400);
    return { error: "authorization header is required", code: "bad_headers" };
  }

  const [authType, authSecret] = value.split(" ");

  if (authType != "Basic") {
    reply.status(400);
    return {
      error: "only basic authorization is accepted",
      code: "bad_authorization_header",
    };
  }

  if (authSecret != env.ADMIN_SECRET) {
    reply.status(401);
    return {
      error: "not authorized to access this resource",
      code: "unauthorized",
    };
  }

  let data = await scrape(env.USERNAME, env.PASSWORD);

  // TODO multithread this code and use memorystore for job report
  for (const [facultyId, lessons] of Object.entries(data)) {
    await setCache(redisStore, "man-" + facultyId, JSON.stringify(lessons));
  }

  // data = await scrape(env.USERNAME_GIRL, env.PASSWORD_GIRL, [55, 42]);
  //
  // for (const [facultyId, lessons] of Object.entries(data)) {
  //   await setCache(redisStore, "woman-" + facultyId, JSON.stringify(lessons));
  // }

  return {
    message: "success",
  };

  // await setCache(memoryStore, collegeId, JSON.stringify(tableData));
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

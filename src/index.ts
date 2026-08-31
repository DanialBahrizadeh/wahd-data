import fastify from "fastify";
import { getCache, isCacheFresh } from "./cache";
import redisStore from "./db/redis";
import type { ClassesQuery, BuildHeader } from "./types/api";
import fastifyCors from "@fastify/cors";
import { env } from "./config/env";
import formbody from "@fastify/formbody";
import faculties, { getFacultyCacheId } from "./utils/faculties.util";
import { buildCache } from "./buildCache";

const server = fastify();

server.register(formbody);

// TODO: add options for the cors before deploy
(async () => await server.register(fastifyCors))();

server.get<{ Querystring: ClassesQuery }>(
  "/classes",
  async (request, reply) => {
    const collegeId = Number(request.query.collegeId);

    const gender = Number(request.query.gender);

    if (!Number.isFinite(collegeId)) {
      reply.status(400);

      return {
        error: "collegeId is required",
        code: "bad_query",
      };
    }

    if (gender !== 0 && gender !== 1) {
      reply.status(400);

      return {
        error: "invalid gender",
        code: "bad_query",
      };
    }

    const facultySet = new Set<number>(faculties);

    if (!facultySet.has(collegeId)) {
      reply.status(400);

      return {
        error: "invalid collegeId",
        code: "bad_query",
      };
    }

    const cacheKey = getFacultyCacheId(collegeId, gender);

    let cache = await getCache(redisStore, cacheKey);

    const fresh = await isCacheFresh(redisStore, gender);

    if (cache && fresh) {
      return JSON.parse(cache);
    }

    let result: "built" | "busy";

    try {
      result = await buildCache(gender);
    } catch (error) {
      console.error("cache refresh failed:", error);

      // Behestan failed, but we still
      // have usable data from <24h ago
      if (cache) {
        return JSON.parse(cache);
      }

      throw error;
    }

    if (result === "busy") {
      // another request is refreshing it,
      // return our existing data
      if (cache) {
        return JSON.parse(cache);
      }

      reply.status(202);

      return {
        error: "cache is currently being built",
        code: "fetching_data",
      };
    }

    cache = await getCache(redisStore, cacheKey);

    if (!cache) {
      reply.status(500);

      return {
        error: "cache build failed",
        code: "cache_error",
      };
    }

    return JSON.parse(cache);
  },
);

server.post<{ Headers: BuildHeader }>("/build", async (request, reply) => {
  const value = request.headers.authorization;

  if (!value) {
    reply.status(400);

    return {
      error: "authorization header is required",
      code: "bad_headers",
    };
  }

  const [authType, authSecret] = value.split(" ");

  if (authType !== "Basic") {
    reply.status(400);

    return {
      error: "only basic authorization is accepted",
      code: "bad_authorization_header",
    };
  }

  if (authSecret !== env.ADMIN_SECRET) {
    reply.status(401);

    return {
      error: "not authorized to access this resource",
      code: "unauthorized",
    };
  }

  const result = await buildCache(1);

  if (result === "busy") {
    reply.status(409);

    return {
      error: "cache is already being built",
      code: "build_in_progress",
    };
  }

  return {
    message: "success",
  };
});

server.get("/", async () => {
  return {
    ok: true,
    service: "wahd-data",
  };
});

server.listen(
  {
    port: Number(process.env.PORT ?? 8080),
    host: "0.0.0.0",
  },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Server listening at ${address}`);
  },
);

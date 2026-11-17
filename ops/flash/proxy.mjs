/**
 * The Supabase-shaped front for the Flash stack on the VPS.
 *
 * The app talks to Supabase, which serves its REST API under `/rest/v1`
 * behind its own gateway. The VPS stack runs PostgREST on its own, which
 * serves the same API at the root. This proxy puts the `/rest/v1` prefix
 * back so the app needs no changes and no secrets of its own.
 *
 *   node ops/flash/proxy.mjs
 *
 * It expects the tunnel to be open:
 *
 *   ssh -i ~/.ssh/deploy_key -L 3001:127.0.0.1:3001 root@72.62.158.102
 */

import http from "node:http";

const PORT = Number(process.env.FLASH_PROXY_PORT ?? 3002);
const TARGET = new URL(process.env.FLASH_PROXY_TARGET ?? "http://127.0.0.1:3001");
const PREFIX = "/rest/v1";

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (!url.pathname.startsWith(PREFIX)) {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        message: `Flash only serves ${PREFIX}. Requested ${url.pathname}.`,
      }),
    );
    return;
  }

  const target = new URL(url.pathname.slice(PREFIX.length) + url.search, TARGET);

  const headers = { ...request.headers, host: TARGET.host };
  delete headers["accept-encoding"];

  const upstream = http.request(
    {
      hostname: TARGET.hostname,
      port: TARGET.port,
      path: target.pathname + target.search,
      method: request.method,
      headers,
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", (error) => {
    response.writeHead(502, { "content-type": "application/json" });
    response.end(JSON.stringify({ message: `The database is not reachable: ${error.message}` }));
  });

  request.pipe(upstream);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Flash proxy on http://127.0.0.1:${PORT}${PREFIX} -> ${TARGET.origin}`);
});

import { currentUserId } from "@/lib/auth/server";
import { buildLiveDigest } from "@/lib/live/stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 5000;
const HEARTBEAT_MS = 15000;
const MAX_STREAM_MS = 5 * 60 * 1000;

const HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store, no-transform",
  connection: "keep-alive",
  "x-accel-buffering": "no",
};

/**
 * Authenticated server-sent events.
 *
 * The route never streams database rows. It emits only a coarse refresh signal
 * when a server-keyed fingerprint of the signed-in user's rows changes. Each
 * connection is scoped to one Clerk user and has a bounded lifetime.
 */
export async function GET(request: Request): Promise<Response> {
  const userId = await currentUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401, headers: HEADERS });
  }

  let digest: string;
  try {
    digest = await buildLiveDigest(userId);
  } catch {
    return new Response("Service unavailable", { status: 503, headers: HEADERS });
  }

  const encoder = new TextEncoder();
  let poll: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  let inFlight = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        if (poll) clearInterval(poll);
        if (heartbeat) clearInterval(heartbeat);
        if (deadline) clearTimeout(deadline);
        try {
          controller.close();
        } catch {
          // The client may already have gone away.
        }
      };

      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };

      send(": connected\n\n");
      request.signal.addEventListener("abort", close, { once: true });

      poll = setInterval(() => {
        if (closed || inFlight) return;
        inFlight = true;

        void buildLiveDigest(userId)
          .then((next) => {
            if (next !== digest) {
              digest = next;
              send("event: refresh\ndata: {}\n\n");
            }
          })
          .catch(() => {
            send("event: error\ndata: {}\n\n");
            close();
          })
          .finally(() => {
            inFlight = false;
          });
      }, POLL_MS);

      heartbeat = setInterval(() => send(": keepalive\n\n"), HEARTBEAT_MS);
      deadline = setTimeout(close, MAX_STREAM_MS);
    },
    cancel() {
      closed = true;
      if (poll) clearInterval(poll);
      if (heartbeat) clearInterval(heartbeat);
      if (deadline) clearTimeout(deadline);
    },
  });

  return new Response(stream, { headers: HEADERS });
}

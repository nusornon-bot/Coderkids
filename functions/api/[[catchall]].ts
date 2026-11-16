/**
 * Cloudflare Pages Functions API route handler
 * Automatically executes for any /api/* request when deployed on Cloudflare Pages
 * Delegates to the unified Cloudflare Worker backend (worker/index.ts)
 */
import worker, { Env } from '../../worker/index';

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  return worker.fetch(context.request, context.env);
}

import { cacheLife } from 'next/cache';
import { spans, TRACE_START } from '@/content/resume';
import { traceView, type TraceView } from './trace';

/**
 * The career trace as of today. "Now" is the only time-dependent input on the site, so it is
 * computed on the server and cached for a day: the page stays static, the bars keep up with the
 * calendar without a redeploy, and the client never renders a different month than the server.
 */
export async function getCareerTrace(): Promise<TraceView> {
  'use cache';
  cacheLife('days');
  return traceView(spans, TRACE_START, new Date());
}

import { connection } from 'next/server';

export async function GET() {
  // Must run per request: an uptime check is meaningless if it is answered from a prerendered file.
  await connection();
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}

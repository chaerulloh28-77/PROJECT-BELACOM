/**
 * Vercel Serverless Function for /api/sync/data
 */

let memoryCache: {
  version: number;
  lastUpdated: string;
  data: any;
} = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  data: null
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.statusCode = 200;
    return res.end();
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { data, timestamp } = body || {};
    memoryCache.version += 1;
    memoryCache.lastUpdated = timestamp || new Date().toISOString();
    if (data) memoryCache.data = data;

    const resPayload = {
      success: true,
      version: memoryCache.version,
      lastUpdated: memoryCache.lastUpdated
    };
    if (typeof res.json === 'function') return res.status(200).json(resPayload);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(resPayload));
  }

  // GET
  const resPayload = {
    success: true,
    version: memoryCache.version,
    lastUpdated: memoryCache.lastUpdated,
    data: memoryCache.data
  };
  if (typeof res.json === 'function') return res.status(200).json(resPayload);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify(resPayload));
}

const buckets = new Map<string, { count: number; resetAt: number }>()

export function requestId() {
  return crypto.randomUUID();
}

export function withRequestId(response: Response, id: string) {
  response.headers.set('X-Request-ID', id);
  return response;
}

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  current.count += 1
  const allowed = current.count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - current.count),
    retryAfter: allowed ? 0 : Math.ceil((current.resetAt - now) / 1000),
  }
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return `${scope}:${forwarded || request.headers.get('x-real-ip') || 'unknown'}`
}

export function safeError(requestIdValue: string, message: string, status = 500) {
  return Response.json({ error: message, requestId: requestIdValue }, { status })
}

export async function verifyHmacSha256(secret: string, payload: string, signature: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (expected.length !== signature.length) return false
  let matches = true
  for (let index = 0; index < expected.length; index += 1) matches = matches && expected.charCodeAt(index) === signature.charCodeAt(index)
  return matches
}

export function pruneRateLimitBuckets() {
  if (buckets.size < 5000) return
  const now = Date.now()
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key)
}

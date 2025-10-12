type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function allow(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }
  if (bucket.count < limit) {
    bucket.count += 1
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
  }
  return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
}



import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// สร้าง Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiter หลักสำหรับ API ทั่วไป
export const apiLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, '1 m'), // 2 requests ต่อนาที (สำหรับทดสอบ)
  analytics: true,
  prefix: 'ratelimit:api',
});


// ===== WHITELIST Configuration =====

const WHITELISTED_ORIGINS = [
  'https://astrax-blue.vercel.app',  // ✅ ลบ / ท้ายออก
];

const WHITELISTED_API_KEYS = [
  process.env.TRUSTED_API_KEY,
].filter(Boolean);

// ===== Helper Functions =====

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || 
         req.ip || 
         req.connection?.remoteAddress || 
         'unknown';
}

function isWhitelisted(req) {
  // 1. ตรวจสอบ Origin/Referer
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    // ✅ ลบ / ท้ายออกจากทั้ง origin และ allowed
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = WHITELISTED_ORIGINS.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedOrigin.startsWith(normalizedAllowed);
    });
    
    if (isAllowed) {
      console.log(`✅ Whitelisted origin: ${origin}`);
      return true;
    }
  }
  
  // 2. ตรวจสอบ API Key
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey && WHITELISTED_API_KEYS.includes(apiKey)) {
    console.log(`✅ Whitelisted API Key: ${apiKey.substring(0, 10)}...`);
    return true;
  }
  
  console.log(`❌ NOT whitelisted - Origin: ${origin}, IP: ${getClientIP(req)}`);
  return false;
}

// ===== Main Middleware =====

export function rateLimitMiddleware(limiter = apiLimiter) {
  return async (req, res, next) => {
    try {
      // ตรวจสอบ whitelist ก่อน
      if (isWhitelisted(req)) {
        console.log('⏭️  Bypassing rate limit (whitelisted)');
        return next();
      }
      
      // ดึง identifier (IP หรือ User ID)
      const ip = getClientIP(req);
      const identifier = req.user?.id || ip;
      
      console.log(`⏱️  Checking rate limit for: ${identifier}`);
      
      // ตรวจสอบ rate limit
      const { success, limit, reset, remaining } = await limiter.limit(identifier);
      
      // เพิ่ม rate limit headers
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());
      
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        
        console.log(`⛔ Rate limit exceeded for ${ip} (${remaining}/${limit})`);
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'คุณส่ง request มากเกินไป กรุณารอสักครู่',
          limit: limit,
          remaining: remaining,
          retryAfter: retryAfter,
          reset: new Date(reset).toISOString()
        });
      }
      
      console.log(`✅ Rate limit OK (${remaining}/${limit} remaining)`);
      next();
    } catch (error) {
      console.error('❌ Rate limit error:', error);
      next(); // Fail open
    }
  };
}

export function createRateLimiter(requests, window, prefix = 'ratelimit') {
  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: prefix,
  });
}
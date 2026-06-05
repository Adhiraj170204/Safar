// k6 load test for Safar API
// Run: k6 run scripts/load.js
// With auth: k6 run -e BASE_URL=http://<EC2-IP> -e TEST_EMAIL=you@email.com -e TEST_PASSWORD=yourpass scripts/load.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 5  },  // warm up
    { duration: '1m',  target: 20 },  // ramp to normal load
    { duration: '1m',  target: 30 },  // ramp to peak load
    { duration: '1m',  target: 30 },  // hold peak
    { duration: '30s', target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed:   ['rate<0.15'],  // 429s are expected due to rate limiter
  },
};

// Safe JSON parse — returns null instead of throwing
function tryJson(body) {
  try { return JSON.parse(body); } catch { return null; }
}

// ── Setup: log in once, share cookies across all VUs ──────────────────────────
export function setup() {
  const email    = __ENV.TEST_EMAIL    || '';
  const password = __ENV.TEST_PASSWORD || '';

  if (!email || !password) {
    console.warn('TEST_EMAIL / TEST_PASSWORD not set — authenticated tests will be skipped');
    return { accessToken: null, refreshToken: null };
  }

  const res = http.post(
    `${BASE_URL}/api/user/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, { 'setup: login 200': (r) => r.status === 200 });

  return {
    accessToken:  res.cookies.accessToken?.[0]?.value  || null,
    refreshToken: res.cookies.refreshToken?.[0]?.value || null,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function authJar(data) {
  const jar = http.cookieJar();
  if (data.accessToken) {
    jar.set(BASE_URL, 'accessToken',  data.accessToken);
    jar.set(BASE_URL, 'refreshToken', data.refreshToken);
  }
  return jar;
}

// ── Default function — runs per VU per iteration ──────────────────────────────
export default function (data) {
  authJar(data);

  // /health is not proxied by Nginx so we skip it and go straight to API routes.
  let firstCampId = null;

  // ── Camps list ────────────────────────────────────────────────────────────
  group('Public - Camps List', () => {
    const res = http.get(`${BASE_URL}/api/camp/index?page=1&limit=10`);
    const body = tryJson(res.body);
    check(res, {
      'camps 200':   (r) => r.status === 200,
      'camps array': () => Array.isArray(body?.camps),
    });

    if (body?.camps?.length > 0) firstCampId = body.camps[0]._id;

    const search   = http.get(`${BASE_URL}/api/camp/index?search=camp&page=1&limit=5`);
    check(search,   { 'search 200': (r) => r.status === 200 });

    const filtered = http.get(`${BASE_URL}/api/camp/index?tags=mountain&minCost=0&maxCost=5000`);
    check(filtered, { 'filter 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  // ── Single camp ───────────────────────────────────────────────────────────
  if (firstCampId) {
    group('Public - Single Camp', () => {
      const res  = http.get(`${BASE_URL}/api/camp/${firstCampId}`);
      const body = tryJson(res.body);
      check(res, {
        'camp 200':    (r) => r.status === 200,
        'camp has id': () => body?._id === firstCampId,
      });
    });
    sleep(0.3);
  }

  // ── Authenticated endpoints ───────────────────────────────────────────────
  if (data.accessToken) {
    group('Auth - Profile', () => {
      const res = http.get(`${BASE_URL}/api/user/profile`);
      check(res, { 'profile 200': (r) => r.status === 200 });
    });
    sleep(0.3);

    group('Auth - My Camps', () => {
      const res  = http.get(`${BASE_URL}/api/user/my-camps`);
      const body = tryJson(res.body);
      check(res, {
        'my-camps 200':    (r) => r.status === 200,
        'has count field': () => body?.count !== undefined,
      });
    });
    sleep(0.3);

    group('Auth - Favorites', () => {
      const res = http.get(`${BASE_URL}/api/user/favorites`);
      check(res, { 'favorites 200': (r) => r.status === 200 });
    });
    sleep(0.3);
  }

  sleep(1);
}

// Wamdh k6 AI Soak Test
// Tests AI-backed endpoints under sustained 10-VU load for 3 minutes
// Install: choco install k6  (Windows) OR  brew install k6  (Mac)
// Run:     k6 run k6_ai_soak.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up to 10 virtual users
    { duration: '3m',  target: 10 },   // sustain 10 VUs for 3 minutes
    { duration: '30s', target: 0  },   // ramp down
  ],
  thresholds: {
    // AI endpoints can be slower — allow 3s p95
    http_req_duration: ['p(95)<3000'],
    http_req_failed:   ['rate<0.01'],
  },
};

const BASE = 'http://localhost:8000';

// Setup: obtain a JWT token once before the test starts
export function setup() {
  const loginRes = http.post(
    `${BASE}/api/auth/login/`,
    JSON.stringify({ username: 'qa_load_test_user', password: 'LoadTestPass123!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const body = loginRes.json();
  if (!body.access) {
    throw new Error(`Login failed: ${loginRes.status} — ${loginRes.body}`);
  }
  return { token: body.access };
}

// Default function: executed by each VU on each iteration
export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Rotate between AI endpoints
  const rand = Math.random();

  if (rand < 0.33) {
    // AI Study Tip
    const res = http.post(
      `${BASE}/api/ai/study-tip/`,
      JSON.stringify({ subject: 'Physics' }),
      { headers, tags: { endpoint: 'ai_study_tip' } }
    );
    check(res, {
      'ai_study_tip status 200': (r) => r.status === 200,
    });

  } else if (rand < 0.66) {
    // AI Key Points
    const res = http.post(
      `${BASE}/api/ai/key-points/`,
      JSON.stringify({ text: 'The mitochondria is the powerhouse of the cell. It produces ATP through oxidative phosphorylation.' }),
      { headers, tags: { endpoint: 'ai_key_points' } }
    );
    check(res, {
      'ai_key_points status 200': (r) => r.status === 200,
    });

  } else {
    // RAG Chat History (read-only, tests DB performance)
    const res = http.get(
      `${BASE}/api/rag/chat/history/`,
      { headers, tags: { endpoint: 'rag_history' } }
    );
    check(res, {
      'rag_history status 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}

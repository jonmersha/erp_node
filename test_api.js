import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

async function test() {
  const token = jwt.sign({ uid: 'test', companyId: 'test' }, 'fallback_dev_secret_key');
  try {
    const res = await fetch('http://localhost:4000/api/financialPlans?companyId=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log('Response:', res.status, text);
  } catch(e) {
    console.error('Fetch error:', e.message);
  }
}
test();

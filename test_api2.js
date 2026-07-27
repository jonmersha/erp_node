import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

async function test() {
  const token = jwt.sign({ uid: 'fhjv2MxB39fm4WsE2XfiZIpNS072', companyId: '39eeefea-8f69-4d55-8f97-e10f130ca68d' }, 'fallback_dev_secret_key');
  try {
    const res = await fetch('http://localhost:4000/api/financialPlans?companyId=39eeefea-8f69-4d55-8f97-e10f130ca68d', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log('Response:', res.status, text);
  } catch(e) {
    console.error('Fetch error:', e.message);
  }
}
test();

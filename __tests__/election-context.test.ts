import { NextRequest } from 'next/server';
import { POST } from '@/app/api/election-context/route';

describe('/api/election-context', () => {
  it('returns 400 for invalid payload', async () => {
    const req = new Request('http://localhost/api/election-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: '', state: '', country: '' }),
    });

    const res = await POST(req as unknown as NextRequest);

    expect(res.status).toBe(400);
  });

  it('returns structured context for valid India payload', async () => {
    const req = new Request('http://localhost/api/election-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      }),
    });

    const res = await POST(req as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty('countryCode', 'IN');
    expect(json).toHaveProperty('verificationNote');
    expect(json).toHaveProperty('hasOfficialData');
    expect(Array.isArray(json.keySteps)).toBe(true);
  });

  it('normalizes UK to GB', async () => {
    const req = new Request('http://localhost/api/election-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'London',
        state: 'England',
        country: 'UK',
      }),
    });

    const res = await POST(req as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.countryCode).toBe('GB');
  });
});

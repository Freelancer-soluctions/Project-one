import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: 1,
      name: 'Johan',
    });
  }),

  http.post('/api/login', async ({ request }) => {
    const body = await request.json();

    if (body.email === 'test@test.com') {
      return HttpResponse.json({ token: 'fake-token' });
    }

    return new HttpResponse(null, { status: 401 });
  }),
];

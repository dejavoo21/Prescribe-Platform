import request from 'supertest';
import app from '../app';

export async function loginAs(
  email: string,
  password = 'ChangeMe123!'
): Promise<string[]> {
  const response = await request(app).post('/api/auth/login').send({
    email,
    password,
  });

  if (response.status !== 200 || !response.headers['set-cookie']) {
    throw new Error(`Login failed for ${email}`);
  }

  return response.headers['set-cookie'];
}

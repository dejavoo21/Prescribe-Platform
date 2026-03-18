import request from 'supertest';
import app from '../app';
import { describe, it, expect } from 'vitest';
import { TestFixtures } from './fixtures';

describe('Auth', () => {
  it('doctor logs in successfully', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'doctor@prescribe.local',
      password: 'ChangeMe123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.role).toBe('doctor');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('pharmacy logs in successfully', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'pharmacy@prescribe.local',
      password: 'ChangeMe123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('pharmacy');
  });

  it('patient logs in successfully', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'patient@prescribe.local',
      password: 'ChangeMe123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('patient');
  });

  it('admin logs in successfully', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@prescribe.local',
      password: 'ChangeMe123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('admin');
  });

  it('rejects invalid email', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@prescribe.local',
      password: 'ChangeMe123!',
    });

    expect(response.status).toBe(401);
  });

  it('rejects invalid password', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'doctor@prescribe.local',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
  });

  it('rejects missing email', async () => {
    const response = await request(app).post('/api/auth/login').send({
      password: 'ChangeMe123!',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('rejects missing password', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'doctor@prescribe.local',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('returns user context on /me', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'doctor@prescribe.local',
      password: 'ChangeMe123!',
    });

    const cookie = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.role).toBe('doctor');
    expect(meRes.body.user.doctorProfileId).toBeDefined();
  });
});

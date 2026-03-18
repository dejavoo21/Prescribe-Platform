import request from 'supertest';
import app from '../app';
import { describe, it, expect, beforeAll } from 'vitest';
import { TestFixtures } from './fixtures';

async function loginAdmin() {
  const response = await request(app).post('/api/auth/login').send({
    email: 'admin@prescribe.local',
    password: 'ChangeMe123!',
  });
  return response.headers['set-cookie'];
}

async function loginDoctor() {
  const response = await request(app).post('/api/auth/login').send({
    email: 'doctor@prescribe.local',
    password: 'ChangeMe123!',
  });
  return response.headers['set-cookie'];
}

async function loginPatient() {
  const response = await request(app).post('/api/auth/login').send({
    email: 'patient@prescribe.local',
    password: 'ChangeMe123!',
  });
  return response.headers['set-cookie'];
}

describe('Admin RBAC and Audit Logs', () => {
  it('admin can view audit logs', async () => {
    const adminCookie = await loginAdmin();

    const response = await request(app)
      .get('/api/audit')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('admin can filter audit logs by action', async () => {
    const adminCookie = await loginAdmin();

    const response = await request(app)
      .get('/api/audit?action=prescription.created')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('admin can filter audit logs by limit', async () => {
    const adminCookie = await loginAdmin();

    const response = await request(app)
      .get('/api/audit?limit=10')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(10);
  });

  it('doctor cannot access audit logs', async () => {
    const doctorCookie = await loginDoctor();

    const response = await request(app)
      .get('/api/audit')
      .set('Cookie', doctorCookie);

    expect(response.status).toBe(403);
  });

  it('patient cannot access audit logs', async () => {
    const patientCookie = await loginPatient();

    const response = await request(app)
      .get('/api/audit')
      .set('Cookie', patientCookie);

    expect(response.status).toBe(403);
  });

  it('unauthenticated user cannot access audit logs', async () => {
    const response = await request(app).get('/api/audit');

    expect(response.status).toBe(401);
  });

  it('doctor cannot access pharmacy prescriptions', async () => {
    const doctorCookie = await loginDoctor();

    // Try to access /assigned which is pharmacy-only
    const response = await request(app)
      .get('/api/prescriptions/assigned')
      .set('Cookie', doctorCookie);

    expect(response.status).toBe(403);
  });

  it('patient cannot access doctor prescriptions', async () => {
    const patientCookie = await loginPatient();

    // Try to access /mine which is doctor-only
    const response = await request(app)
      .get('/api/prescriptions/mine')
      .set('Cookie', patientCookie);

    expect(response.status).toBe(403);
  });

  it('pharmacy cannot access patient visibility', async () => {
    const pharmacyCookie = await request(app).post('/api/auth/login').send({
      email: 'pharmacy@prescribe.local',
      password: 'ChangeMe123!',
    }).then(r => r.headers['set-cookie']);

    // Try to access /visible which is patient-only
    const response = await request(app)
      .get('/api/prescriptions/visible')
      .set('Cookie', pharmacyCookie);

    expect(response.status).toBe(403);
  });

  it('prescription mutations are logged in audit log', async () => {
    const doctorCookie = await loginDoctor();
    const adminCookie = await loginAdmin();
    const patient = await TestFixtures.getPatientById('patient@prescribe.local');
    const pharmacy = await TestFixtures.getPharmacyById('pharmacy@prescribe.local');
    const medication = await TestFixtures.getMedicationById();

    // Create a prescription
    const createRes = await request(app)
      .post('/api/prescriptions')
      .set('Cookie', doctorCookie)
      .send({
        patientId: patient.id,
        pharmacyId: pharmacy.id,
        medicationId: medication.id,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '7 days',
      });

    expect(createRes.status).toBe(201);

    // Check audit log contains the creation event
    const auditRes = await request(app)
      .get('/api/audit')
      .set('Cookie', adminCookie);

    expect(auditRes.status).toBe(200);
    const hasCreationEvent = auditRes.body.data.some((log: any) =>
      log.action.includes('prescription.created') || log.action.includes('created')
    );
    expect(hasCreationEvent).toBe(true);
  });

  it('cannot access lookups without authentication', async () => {
    const response = await request(app).get('/api/lookups/patients');

    expect(response.status).toBe(401);
  });

  it('patient cannot access patient lookup endpoint', async () => {
    const patientCookie = await loginPatient();

    const response = await request(app)
      .get('/api/lookups/patients')
      .set('Cookie', patientCookie);

    expect(response.status).toBe(403);
  });

  it('doctor can access medication lookup', async () => {
    const doctorCookie = await loginDoctor();

    const response = await request(app)
      .get('/api/lookups/medications')
      .set('Cookie', doctorCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('pharmacy can access medication lookup', async () => {
    const pharmacyCookie = await request(app).post('/api/auth/login').send({
      email: 'pharmacy@prescribe.local',
      password: 'ChangeMe123!',
    }).then(r => r.headers['set-cookie']);

    const response = await request(app)
      .get('/api/lookups/medications')
      .set('Cookie', pharmacyCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('can search medications by name', async () => {
    const doctorCookie = await loginDoctor();

    const response = await request(app)
      .get('/api/lookups/medications?search=ventolin')
      .set('Cookie', doctorCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

import request from 'supertest';
import app from '../app';
import { describe, it, expect, beforeAll } from 'vitest';
import { getSeedFixtureIds } from './testFixtures';
import { loginAs } from './helpers';

describe('Doctor prescription lifecycle', () => {
  let patientId: string;
  let pharmacyId: string;
  let medicationId: string;

  beforeAll(async () => {
    const fixtures = await getSeedFixtureIds();
    patientId = fixtures.patientProfileId;
    pharmacyId = fixtures.pharmacyProfileId;
    medicationId = fixtures.medicationId;
  });

  it('creates a draft prescription', async () => {
    const cookie = await loginAs('doctor@prescribe.local');

    const response = await request(app)
      .post('/api/prescriptions')
      .set('Cookie', cookie)
      .send({
        patientId,
        pharmacyId,
        medicationId,
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '7 days',
        quantityPrescribed: 14,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('DRAFTED');
    expect(response.body.data.patient_id).toBe(patientId);
  });

  it('creates, signs, and sends a prescription', async () => {
    const cookie = await loginAs('doctor@prescribe.local');

    // Create draft
    const createRes = await request(app)
      .post('/api/prescriptions')
      .set('Cookie', cookie)
      .send({
        patientId,
        pharmacyId,
        medicationId,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '10 days',
        quantityPrescribed: 10,
      });

    expect(createRes.status).toBe(201);
    const prescriptionId = createRes.body.data.id;

    // Sign
    const signRes = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', cookie);

    expect(signRes.status).toBe(200);
    expect(signRes.body.data.status).toBe('SIGNED');

    // Send
    const sendRes = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/send`)
      .set('Cookie', cookie)
      .send({});

    expect(sendRes.status).toBe(200);
    expect(sendRes.body.data.status).toBe('SENT');
  });

  it('rejects sending a draft directly (invalid transition)', async () => {
    const cookie = await loginAs('doctor@prescribe.local');

    const createRes = await request(app)
      .post('/api/prescriptions')
      .set('Cookie', cookie)
      .send({
        patientId,
        pharmacyId,
        medicationId,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '5 days',
        quantityPrescribed: 5,
      });

    const prescriptionId = createRes.body.data.id;

    const sendRes = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/send`)
      .set('Cookie', cookie)
      .send({});

    expect(sendRes.status).toBe(400);
  });

  it('cannot create prescription with invalid patient UUID', async () => {
    const cookie = await loginAs('doctor@prescribe.local');

    const response = await request(app)
      .post('/api/prescriptions')
      .set('Cookie', cookie)
      .send({
        patientId: 'not-a-uuid',
        pharmacyId,
        medicationId,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '7 days',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('cannot create prescription without required fields', async () => {
    const cookie = await loginAs('doctor@prescribe.local');

    const response = await request(app)
      .post('/api/prescriptions')
      .set('Cookie', cookie)
      .send({
        patientId,
        pharmacyId,
        medicationId,
        // Missing dosage, frequency, duration
      });

    expect(response.status).toBe(400);
  });

  it('reverts signed prescription back to draft', async () => {
    const cookie = await loginAs('doctor@prescribe.local');

    // Create and sign
    const createRes = await request(app)
      .post('/api/prescriptions')
      .set('Cookie', cookie)
      .send({
        patientId,
        pharmacyId,
        medicationId,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '7 days',
      });

    const prescriptionId = createRes.body.data.id;

    const signRes = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', cookie);

    expect(signRes.status).toBe(200);
    expect(signRes.body.data.status).toBe('SIGNED');

    // Revert
    const revertRes = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/revert-to-draft`)
      .set('Cookie', cookie);

    expect(revertRes.status).toBe(200);
    expect(revertRes.body.data.status).toBe('DRAFTED');
  });

  it('lists only own prescriptions', async () => {
    const cookie = await loginAs('doctor@prescribe.local');

    // Create a prescription
    await request(app)
      .post('/api/prescriptions')
      .set('Cookie', cookie)
      .send({
        patientId,
        pharmacyId,
        medicationId,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '7 days',
      });

    // List own
    const listRes = await request(app)
      .get('/api/prescriptions/mine')
      .set('Cookie', cookie);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });
});

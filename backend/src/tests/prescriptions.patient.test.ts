import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import { getSeedFixtureIds } from './testFixtures';
import { loginAs } from './helpers';

async function createSentPrescription() {
  const fixtures = await getSeedFixtureIds();
  const doctorCookie = await loginAs('doctor@prescribe.local');

  const createResponse = await request(app)
    .post('/api/prescriptions')
    .set('Cookie', doctorCookie)
    .send({
      patientId: fixtures.patientProfileId,
      pharmacyId: fixtures.pharmacyProfileId,
      medicationId: fixtures.medicationId,
      dosage: '2 puffs',
      frequency: 'Every 6 hours',
      duration: '5 days',
      quantityPrescribed: 1,
    });

  const prescriptionId = createResponse.body.data.id;

  await request(app)
    .put(`/api/prescriptions/${prescriptionId}/sign`)
    .set('Cookie', doctorCookie);

  await request(app)
    .put(`/api/prescriptions/${prescriptionId}/send`)
    .set('Cookie', doctorCookie)
    .send({});

  return prescriptionId;
}

describe('Patient visibility rules', () => {
  it('patient can see own visible prescriptions', async () => {
    const patientCookie = await loginAs('patient@prescribe.local');
    const prescriptionId = await createSentPrescription();

    const response = await request(app)
      .get('/api/prescriptions/visible')
      .set('Cookie', patientCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((row: { id: string }) => row.id === prescriptionId)).toBe(
      true
    );
  });

  it('patient does not see drafted prescriptions', async () => {
    const fixtures = await getSeedFixtureIds();
    const doctorCookie = await loginAs('doctor@prescribe.local');
    const patientCookie = await loginAs('patient@prescribe.local');

    await request(app)
      .post('/api/prescriptions')
      .set('Cookie', doctorCookie)
      .send({
        patientId: fixtures.patientProfileId,
        pharmacyId: fixtures.pharmacyProfileId,
        medicationId: fixtures.medicationId,
        dosage: '1 capsule',
        frequency: 'Once daily',
        duration: '10 days',
      });

    const response = await request(app)
      .get('/api/prescriptions/visible')
      .set('Cookie', patientCookie);

    expect(response.status).toBe(200);
    expect(
      response.body.data.every(
        (row: { status: string }) =>
          row.status !== 'DRAFTED' && row.status !== 'SIGNED'
      )
    ).toBe(true);
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import { getSeedFixtureIds } from './testFixtures';
import { loginAs } from './helpers';

async function createSignedPrescription() {
  const fixtures = await getSeedFixtureIds();
  const doctorCookie = await loginAs('doctor@prescribe.local');

  const createResponse = await request(app)
    .post('/api/prescriptions')
    .set('Cookie', doctorCookie)
    .send({
      patientId: fixtures.patientProfileId,
      pharmacyId: fixtures.pharmacyProfileId,
      medicationId: fixtures.medicationId,
      dosage: '1 tablet',
      frequency: 'Twice daily',
      duration: '7 days',
      quantityPrescribed: 14,
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

describe('Pharmacy prescription flow', () => {
  it('assigned pharmacy can receive a sent prescription', async () => {
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');
    const prescriptionId = await createSignedPrescription();

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/receive`)
      .set('Cookie', pharmacyCookie);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('RECEIVED');
  });

  it('assigned pharmacy can dispense a received prescription', async () => {
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');
    const prescriptionId = await createSignedPrescription();

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/receive`)
      .set('Cookie', pharmacyCookie);

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/dispense`)
      .set('Cookie', pharmacyCookie)
      .send({
        quantityDispensed: 14,
        lotNumber: 'LOT-ABC-001',
        expirationDate: '2027-12-31',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('DISPENSED');
  });

  it('cannot dispense directly from SENT', async () => {
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');
    const prescriptionId = await createSignedPrescription();

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/dispense`)
      .set('Cookie', pharmacyCookie)
      .send({
        quantityDispensed: 14,
      });

    expect(response.status).toBe(400);
  });
});

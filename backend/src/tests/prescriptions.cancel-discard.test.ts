import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import { getSeedFixtureIds } from './testFixtures';
import { loginAs } from './helpers';

async function createDraft() {
  const fixtures = await getSeedFixtureIds();
  const doctorCookie = await loginAs('doctor@prescribe.local');

  const response = await request(app)
    .post('/api/prescriptions')
    .set('Cookie', doctorCookie)
    .send({
      patientId: fixtures.patientProfileId,
      pharmacyId: fixtures.pharmacyProfileId,
      medicationId: fixtures.medicationId,
      dosage: '1 tablet',
      frequency: 'Twice daily',
      duration: '7 days',
    });

  return {
    doctorCookie,
    prescriptionId: response.body.data.id as string,
  };
}

describe('Prescription cancel and discard', () => {
  it('doctor can discard a drafted prescription', async () => {
    const { doctorCookie, prescriptionId } = await createDraft();

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/discard`)
      .set('Cookie', doctorCookie);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('DISCARDED');
  });

  it('doctor can cancel a signed prescription', async () => {
    const { doctorCookie, prescriptionId } = await createDraft();

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', doctorCookie)
      .send({
        cancellationReasonCode: 'clinical_change',
        cancellationNote: 'Dose needs correction',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CANCELLED');
  });

  it('doctor can cancel a sent prescription', async () => {
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
      });

    const prescriptionId = createResponse.body.data.id;

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/send`)
      .set('Cookie', doctorCookie)
      .send({});

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', doctorCookie)
      .send({
        cancellationReasonCode: 'clinical_change',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CANCELLED');
  });

  it('doctor can cancel a received prescription', async () => {
    const fixtures = await getSeedFixtureIds();
    const doctorCookie = await loginAs('doctor@prescribe.local');
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');

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
      });

    const prescriptionId = createResponse.body.data.id;

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/send`)
      .set('Cookie', doctorCookie)
      .send({});

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/receive`)
      .set('Cookie', pharmacyCookie);

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', doctorCookie)
      .send({
        cancellationReasonCode: 'clinical_change',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CANCELLED');
  });

  it('pharmacy can cancel a sent prescription', async () => {
    const fixtures = await getSeedFixtureIds();
    const doctorCookie = await loginAs('doctor@prescribe.local');
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');

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
      });

    const prescriptionId = createResponse.body.data.id;

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/send`)
      .set('Cookie', doctorCookie)
      .send({});

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', pharmacyCookie)
      .send({
        cancellationReasonCode: 'out_of_stock',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CANCELLED');
  });

  it('pharmacy can cancel a received prescription', async () => {
    const fixtures = await getSeedFixtureIds();
    const doctorCookie = await loginAs('doctor@prescribe.local');
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');

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
      });

    const prescriptionId = createResponse.body.data.id;

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/send`)
      .set('Cookie', doctorCookie)
      .send({});

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/receive`)
      .set('Cookie', pharmacyCookie);

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', pharmacyCookie)
      .send({
        cancellationReasonCode: 'out_of_stock',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CANCELLED');
  });

  it('pharmacy cannot cancel a signed prescription', async () => {
    const { doctorCookie, prescriptionId } = await createDraft();
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', pharmacyCookie)
      .send({
        cancellationReasonCode: 'out_of_stock',
      });

    expect([400, 403]).toContain(response.status);
  });

  it('pharmacy cannot cancel a drafted prescription', async () => {
    const { prescriptionId } = await createDraft();
    const pharmacyCookie = await loginAs('pharmacy@prescribe.local');

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', pharmacyCookie)
      .send({
        cancellationReasonCode: 'out_of_stock',
      });

    expect([400, 403]).toContain(response.status);
  });

  it('cancelled prescriptions become terminal', async () => {
    const { doctorCookie, prescriptionId } = await createDraft();

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    const cancelRes = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', doctorCookie)
      .send({
        cancellationReasonCode: 'clinical_change',
      });

    expect(cancelRes.status).toBe(200);

    // Try to sign a cancelled prescription (should fail)
    const signRes = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    expect(signRes.status).toBe(400);
  });

  it('cancellation writes audit log', async () => {
    const { doctorCookie, prescriptionId } = await createDraft();
    const adminCookie = await loginAs('admin@prescribe.local');

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', doctorCookie)
      .send({
        cancellationReasonCode: 'clinical_change',
        cancellationNote: 'needs review',
      });

    // Check audit log
    const auditResponse = await request(app)
      .get('/api/audit?action=prescription_cancelled')
      .set('Cookie', adminCookie);

    expect(auditResponse.status).toBe(200);
    expect(
      auditResponse.body.data.some((row: any) => row.resource_id === prescriptionId)
    ).toBe(true);
  });

  it('discard requires drafted status', async () => {
    const { doctorCookie, prescriptionId } = await createDraft();

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/discard`)
      .set('Cookie', doctorCookie);

    expect(response.status).toBe(400);
  });

  it('cancel requires cancellationReasonCode', async () => {
    const { doctorCookie, prescriptionId } = await createDraft();

    await request(app)
      .put(`/api/prescriptions/${prescriptionId}/sign`)
      .set('Cookie', doctorCookie);

    const response = await request(app)
      .put(`/api/prescriptions/${prescriptionId}/cancel`)
      .set('Cookie', doctorCookie)
      .send({
        // Missing cancellationReasonCode
      });

    expect(response.status).toBe(400);
  });
});

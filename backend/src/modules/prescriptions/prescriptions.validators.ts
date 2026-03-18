import { Request } from 'express';
import { isNonEmptyString, isPositiveNumber, isUuid } from '../../lib/validators';

export function validateCreatePrescription(req: Request) {
  const errors: string[] = [];
  const body = req.body ?? {};

  if (!isUuid(body.patientId)) errors.push('patientId must be a valid UUID');
  if (body.pharmacyId && !isUuid(body.pharmacyId)) {
    errors.push('pharmacyId must be a valid UUID');
  }
  if (!isUuid(body.medicationId)) errors.push('medicationId must be a valid UUID');
  if (!isNonEmptyString(body.dosage)) errors.push('dosage is required');
  if (!isNonEmptyString(body.frequency)) errors.push('frequency is required');
  if (!isNonEmptyString(body.duration)) errors.push('duration is required');

  if (
    body.quantityPrescribed !== undefined &&
    body.quantityPrescribed !== null &&
    !isPositiveNumber(body.quantityPrescribed)
  ) {
    errors.push('quantityPrescribed must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePrescriptionIdParam(req: Request) {
  const errors: string[] = [];

  if (!isUuid(req.params.id)) {
    errors.push('id must be a valid UUID');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSendPrescription(req: Request) {
  const errors: string[] = [];
  const body = req.body ?? {};

  if (body.pharmacyId && !isUuid(body.pharmacyId)) {
    errors.push('pharmacyId must be a valid UUID');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDispensePrescription(req: Request) {
  const errors: string[] = [];
  const body = req.body ?? {};

  if (
    body.quantityDispensed !== undefined &&
    body.quantityDispensed !== null &&
    !isPositiveNumber(body.quantityDispensed)
  ) {
    errors.push('quantityDispensed must be a positive number');
  }

  if (
    body.lotNumber !== undefined &&
    body.lotNumber !== null &&
    typeof body.lotNumber !== 'string'
  ) {
    errors.push('lotNumber must be a string');
  }

  if (
    body.expirationDate !== undefined &&
    body.expirationDate !== null &&
    typeof body.expirationDate !== 'string'
  ) {
    errors.push('expirationDate must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCancelPrescription(req: Request) {
  const errors: string[] = [];
  const body = req.body ?? {};

  if (!isNonEmptyString(body.cancellationReasonCode)) {
    errors.push('cancellationReasonCode is required');
  }

  if (
    body.cancellationNote !== undefined &&
    body.cancellationNote !== null &&
    typeof body.cancellationNote !== 'string'
  ) {
    errors.push('cancellationNote must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDiscardPrescription(req: Request) {
  const errors: string[] = [];

  if (!isUuid(req.params.id)) {
    errors.push('id must be a valid UUID');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

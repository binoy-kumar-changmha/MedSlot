import { describe, it, expect } from 'vitest';
import { loadOpenApiSpec } from '../../src/config/swagger.js';

describe('OpenAPI 3.0 Specification (Self-Directed SE Tool)', () => {
  it('parses cleanly as OpenAPI 3.0.3 with bearerAuth and all 5 modules', () => {
    const spec = loadOpenApiSpec();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBe('MedSlot Clinic API');
    expect(spec.components?.securitySchemes?.bearerAuth?.type).toBe('http');

    const paths = Object.keys(spec.paths || {});
    expect(paths).toContain('/api/auth/login');
    expect(paths).toContain('/api/patients');
    expect(paths).toContain('/api/doctors');
    expect(paths).toContain('/api/appointments');
    expect(paths).toContain('/api/billing/invoices');
    expect(paths).toContain('/api/billing/invoices/{id}/pay');
  });
});

import { describe, it, expect } from 'vitest';
import { createNotificationService } from '../../src/services/notificationService.js';

describe('NotificationService', () => {
  it('records outbound appointment notices and returns a defensive log copy', () => {
    const svc = createNotificationService();
    const entry = svc.sendAppointmentNotice({
      event: 'BOOKED',
      appointment: { id: 42 },
    });

    expect(entry).toMatchObject({ event: 'BOOKED', appointmentId: 42 });
    expect(entry.timestamp).toBeTruthy();

    const log = svc.getLog();
    expect(log).toHaveLength(1);
    log.push({ fake: true });
    expect(svc.getLog()).toHaveLength(1);
  });
});

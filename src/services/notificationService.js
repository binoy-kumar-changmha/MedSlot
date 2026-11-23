/**
 * Outbound appointment notification adapter (isolated via mocking in unit tests).
 */
export function createNotificationService() {
  const sentLog = [];
  return {
    sendAppointmentNotice({ event, appointment }) {
      const entry = {
        event,
        appointmentId: appointment.id,
        timestamp: new Date().toISOString(),
      };
      sentLog.push(entry);
      return entry;
    },
    getLog() {
      return [...sentLog];
    },
  };
}

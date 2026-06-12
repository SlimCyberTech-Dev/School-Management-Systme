import { idleExpiresAtFrom, sessionInactivityMinutes } from "../../src/modules/auth/session.service.js";

describe("session.service", () => {
  it("defaults inactivity to 15 minutes in test env", () => {
    expect(sessionInactivityMinutes()).toBe(15);
  });

  it("computes idle expiry from last activity", () => {
    const last = new Date("2026-01-01T12:00:00Z");
    const expires = idleExpiresAtFrom(last, 15);
    expect(expires.toISOString()).toBe("2026-01-01T12:15:00.000Z");
  });
});

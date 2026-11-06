/**
 * Helpers for the legacy mobile + birthdate enrollment login.
 * This is transitional: mobile OTP should eventually replace DOB as proof of identity.
 */
export function normalizeIndianMobile(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.replace(/[\s().-]/g, "");
  if (/^[6-9]\d{9}$/.test(raw)) return raw;
  if (/^\+?91[6-9]\d{9}$/.test(raw)) return raw.slice(-10);
  return null;
}
export function validDateOfBirth(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    && date.getTime() < Date.now();
}
export function phoneCandidates(value: string): string[] {
  return [value, "91" + value, "+91" + value];
}
export function exactlyOneMatch(count: number): boolean {
  return count === 1;
}

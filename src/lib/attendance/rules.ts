export const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "HALF DAY",
  "LEAVE",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export const ATTENDANCE_ZONE = "Asia/Kolkata";

export class AttendanceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function indiaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ATTENDANCE_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function indiaDateTime(value: Date | string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: ATTENDANCE_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${indiaDate(date)}T${time}`;
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !validDate(`${month}-01`))
    throw new AttendanceError("Choose a valid month.");
  const [year, number] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${days}` };
}
export function positiveId(value: unknown, label: string) {
  const id =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1)
    throw new AttendanceError(`${label} is invalid.`);
  return id;
}
export function demoStaff(member: { employeeId: string; name: string }) {
  return (
    /^DEMO(?:-|\b)/i.test(member.employeeId) || /^DEMO\b/i.test(member.name)
  );
}
function localInstant(value: unknown, label: string, now: Date) {
  if (value === null || value === undefined || value === "") return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value) ||
    !validDate(value.slice(0, 10))
  )
    throw new AttendanceError(
      `${label} must be a valid local date and time in Asia/Kolkata.`,
    );
  const date = new Date(`${value}+05:30`);
  if (date > now)
    throw new AttendanceError(`${label} cannot be in the future.`);
  return date;
}
export type AttendanceInput = {
  staffId?: unknown;
  attendanceDate?: unknown;
  leaveStatus?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
  shiftStart?: unknown;
  notes?: unknown;
  id?: unknown;
  version?: unknown;
};
export function attendanceValues(input: AttendanceInput, now = new Date()) {
  const staffId = positiveId(input.staffId, "Employee");
  if (!validDate(input.attendanceDate) || input.attendanceDate > indiaDate(now))
    throw new AttendanceError(
      "Attendance date must be a valid date on or before today in India.",
    );
  const attendanceDate = input.attendanceDate;
  const leaveStatus =
    input.leaveStatus === "HALF_DAY" ? "HALF DAY" : input.leaveStatus;
  if (!ATTENDANCE_STATUSES.includes(leaveStatus as AttendanceStatus))
    throw new AttendanceError("Choose Present, Absent, Half Day or Leave.");
  const shiftStart =
    input.shiftStart == null || input.shiftStart === ""
      ? null
      : String(input.shiftStart);
  if (shiftStart && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(shiftStart))
    throw new AttendanceError("Scheduled start must be a valid time.");
  const checkIn = localInstant(input.checkIn, "Check-in", now);
  const checkOut = localInstant(input.checkOut, "Check-out", now);
  if (
    (leaveStatus === "ABSENT" || leaveStatus === "LEAVE") &&
    (checkIn || checkOut)
  )
    throw new AttendanceError(
      "Absent and Leave records cannot contain check-in or check-out times.",
    );
  if (checkOut && !checkIn)
    throw new AttendanceError("Check in before recording a check-out.");
  if (checkIn && indiaDate(checkIn) !== attendanceDate)
    throw new AttendanceError(
      "Check-in must fall on the attendance date in India.",
    );
  if (checkIn && !shiftStart)
    throw new AttendanceError(
      "Set the scheduled start time to calculate lateness.",
    );
  const duration =
    checkIn && checkOut ? checkOut.getTime() - checkIn.getTime() : null;
  if (duration !== null && (duration <= 0 || duration > 86_400_000))
    throw new AttendanceError(
      "Check-out must follow check-in by no more than 24 hours.",
    );
  const workingHours =
    duration === null ? null : (Math.round(duration / 36_000) / 100).toFixed(2);
  const shift = shiftStart
    ? new Date(`${attendanceDate}T${shiftStart}:00+05:30`)
    : null;
  const lateMinutes =
    checkIn && shift
      ? Math.max(0, Math.floor((checkIn.getTime() - shift.getTime()) / 60_000))
      : 0;
  const notes = input.notes == null ? null : String(input.notes).trim() || null;
  if (notes && notes.length > 1000)
    throw new AttendanceError("Notes must be at most 1,000 characters.");
  return {
    staffId,
    attendanceDate,
    leaveStatus: leaveStatus as AttendanceStatus,
    shiftStart,
    checkIn,
    checkOut,
    workingHours,
    lateMinutes,
    notes,
  };
}
export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  return `"${(/^(?:\s*[=+\-@]|[\t\r])/.test(raw) ? "'" : "") + raw.replace(/"/g, '""')}"`;
}

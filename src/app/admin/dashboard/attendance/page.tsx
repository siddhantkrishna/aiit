import StaffAttendance from "@/components/StaffAttendance";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          People
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Staff Attendance
        </h1>
        <p className="mt-2 text-slate-500">
          Mark daily attendance, record working time, and review staff history.
        </p>
      </header>
      <StaffAttendance />
    </div>
  );
}

export const dynamic = "force-dynamic";

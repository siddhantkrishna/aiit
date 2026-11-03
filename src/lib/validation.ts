import { z } from "zod";

export const id = z.coerce.number().int().positive().safe();
const optionalId = z.preprocess(v => v === "" || v == null ? null : v, id.nullable());
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Invalid date");
const optionalDate = z.preprocess(v => v === "" || v == null ? null : v, date.nullable());
const optionalTime = z.preprocess(v => v === "" || v == null ? null : v, z.coerce.date().nullable());
const text = (max = 255) => z.string().trim().max(max);
const optionalText = (max = 255) => text(max).nullish();
export const mobile = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
export const money = z.coerce.string().regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a non-negative amount with at most two decimal places");
const positiveMoney = money.refine(v => Number(v) > 0, "Amount must be positive");
const optionalEmail = z.union([z.literal(""), z.email().max(255)]).nullish();
export const applicationSchema = z.object({
  courseId: id, universityId: optionalId, centreId: id, studyMode: text(100).min(1),
  firstName: text().min(1), lastName: text().default(""), fatherName: text().min(1), motherName: text().min(1),
  dob: date.refine(v => v < new Date().toISOString().slice(0, 10), "Date of birth must be in the past"),
  gender: z.enum(["Male", "Female", "Other"]), mobile, email: optionalEmail,
  address: text(2000).min(1), city: text(100).min(1), state: text(100).min(1), pinCode: text(10).regex(/^\d{6}$/),
  qualification: z.enum(["10th", "12th", "Diploma", "Graduate", "Postgraduate", "Other"]),
  tenthBoard: optionalText(), tenthYear: optionalText(10), tenthPercentage: optionalText(10),
  twelfthBoard: optionalText(), twelfthYear: optionalText(10), twelfthPercentage: optionalText(10),
  gradUniversity: optionalText(), gradYear: optionalText(10), gradPercentage: optionalText(10),
  declaration: z.union([z.literal(true), z.literal("true")]).transform(() => true),
});
export const leadSchema = z.object({
  name: text().min(1), mobile, whatsapp: optionalText(30), email: optionalEmail, location: optionalText(), qualification: optionalText(2000),
  interestedCourseId: optionalId, preferredUniversityId: optionalId, source: optionalText(100), centreId: optionalId, assignedTo: optionalId,
  status: z.enum(["NEW", "CONTACTED", "INTERESTED", "FOLLOW_UP", "APPLIED", "ADMITTED", "CLOSED", "CONVERTED", "LOST"]).default("NEW"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"), nextFollowUpAt: optionalTime,
  nextAction: optionalText(2000), expectedAdmissionDate: optionalDate, notes: optionalText(4000),
});
export const taskSchema = z.object({
  taskName: text().min(1), description: optionalText(4000), staffId: optionalId, assignedTo: id, centreId: optionalId,
  taskDate: optionalDate, deadline: optionalTime, dueDate: date,
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"), remarks: optionalText(4000),
});
export const staffSchema = z.object({
  name: text().min(1), role: optionalText(100), department: optionalText(100), centreId: optionalId, joiningDate: optionalDate,
  employmentType: optionalText(100), salary: z.preprocess(v => v === "" || v == null ? null : v, money.nullable()), managerId: optionalId,
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "ON LEAVE", "TERMINATED"]).default("ACTIVE"), email: optionalEmail, mobile: optionalText(30), responsibilities: optionalText(4000),
});
export const attendanceSchema = z.object({
  staffId: id, centreId: optionalId, attendanceDate: date, checkIn: optionalTime, checkOut: optionalTime,
  lateMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  leaveStatus: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE", "HALF_DAY", "HALF DAY"]).default("PRESENT"),
}).refine(v => !v.checkOut || !!v.checkIn && v.checkOut >= v.checkIn, "Check-out must follow check-in");
export const serviceSchema = z.object({
  studentId: id, serviceType: text(100).min(1), status: z.enum(["PENDING", "IN_PROGRESS", "IN PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"), requestedAt: z.coerce.date().optional(), dueDate: optionalDate,
  completedAt: optionalTime, ownerId: optionalId, assignedTo: optionalId, requestedBy: optionalId, referenceNumber: optionalText(), notes: optionalText(4000), remarks: optionalText(4000),
});
export const paymentSchema = z.object({
  studentId: optionalId, applicationId: optionalId, centreId: optionalId, paymentDate: date, amount: positiveMoney,
  paymentType: text(100).min(1), paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"]),
  referenceNumber: optionalText(), notes: optionalText(4000),
}).refine(v => !!v.studentId || !!v.applicationId, "Select a student or application").refine(v => v.paymentMode === "CASH" || !!v.referenceNumber, "Transaction reference is required");
export const accountingSchema = z.object({
  transactionDate: date, centreId: optionalId, transactionType: z.enum(["INCOME", "EXPENSE"]), category: text(100).min(1),
  description: optionalText(4000), amount: positiveMoney, paymentMode: optionalText(50), referenceNumber: optionalText(),
  relatedStudentId: optionalId, relatedExpenseId: optionalId, status: z.enum(["POSTED", "VOID"]).default("POSTED"), notes: optionalText(4000),
});
export const studentUpdateSchema = z.object({
  firstName: optionalText(), lastName: optionalText(), fatherName: optionalText(), motherName: optionalText(), mobile: mobile.optional(), email: optionalEmail,
  centreId: optionalId, universityId: optionalId, studyMode: optionalText(100), enrollmentNumber: optionalText(100),
  studentStatus: z.enum(["ACTIVE", "INACTIVE", "COMPLETED", "DROPPED"]).optional(), totalFee: money.optional(),
  documentStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(), applicationStatus: optionalText(50),
  universityStatus: z.enum(["PENDING", "DOCUMENTS PENDING", "SUBMITTED", "ENROLLED", "ACTION REQUIRED", "COMPLETED"]).optional(),
  universitySubmittedAt: optionalDate, universityNextAction: optionalText(2000), requiredDocuments: optionalText(2000),
  examStatus: optionalText(50), admitCardPath: optionalText(2000), resultStatus: optionalText(50), certificateStatus: optionalText(50), remarks: optionalText(4000),
});
export const courseSchema = z.object({
  name: text().min(1), fullName: optionalText(500), duration: optionalText(100), eligibility: optionalText(2000), universityId: optionalId,
  studyMode: optionalText(100), category: optionalText(100), fee: optionalText(100), enabled: z.boolean().default(true),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
});
export const universitySchema = z.object({
  name: text().min(1), shortName: optionalText(50), location: optionalText(), description: optionalText(4000),
  website: z.union([z.literal(""), z.url().refine(v => /^https?:/.test(v))]).nullish(), enabled: z.boolean().default(true),
  authorizationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
});

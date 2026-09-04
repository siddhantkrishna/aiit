import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  bigint,
  numeric,
  date,
  jsonb,
} from "drizzle-orm/pg-core";

/* =========================================================
   UNIVERSITIES
========================================================= */

export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 50 }),

  location: varchar("location", { length: 255 }),
  logo: text("logo"),
  description: text("description"),
  website: varchar("website", { length: 255 }),

  universityCode: varchar("university_code", { length: 100 }),
  city: varchar("city", { length: 100 }),
  district: varchar("district", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("India"),

  officialContact: varchar("official_contact", { length: 255 }),
  relationshipType: varchar("relationship_type", { length: 100 }),

  authorizationStatus: varchar("authorization_status", {
    length: 50,
  }).default("PENDING"),

  admissionStatus: varchar("admission_status", {
    length: 50,
  }).default("UNDER REVIEW"),

  lastVerifiedAt: timestamp("last_verified_at"),
  notes: text("notes"),

  enabled: boolean("enabled").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================
   COURSES
========================================================= */

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 500 }),

  courseCode: varchar("course_code", { length: 100 }),
  courseFamily: varchar("course_family", { length: 100 }),
  department: varchar("department", { length: 100 }),

  providerName: varchar("provider_name", { length: 255 }),
  providerType: varchar("provider_type", {
    length: 50,
  }).default("UNIVERSITY"),

  duration: varchar("duration", { length: 100 }),
  durationYears: numeric("duration_years"),
  durationMonths: numeric("duration_months"),
  semesters: integer("semesters"),

  eligibility: text("eligibility"),

  universityId: integer("university_id"),

  studyMode: varchar("study_mode", { length: 100 }),
  category: varchar("category", { length: 100 }),

  fee: varchar("fee", { length: 100 }),
  sourceFee: numeric("source_fee"),
  aiitFee: numeric("aiit_fee"),
  aiitCommission: numeric("aiit_commission"),

  priority: varchar("priority", {
    length: 20,
  }).default("STANDARD"),

  verificationStatus: varchar("verification_status", {
    length: 50,
  }).default("PENDING"),

  lastVerifiedAt: timestamp("last_verified_at"),
  notes: text("notes"),

  enabled: boolean("enabled").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   CENTRES
========================================================= */

export const centres = pgTable("centres", {
  id: serial("id").primaryKey(),

  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull().unique(),

  type: varchar("type", { length: 50 }),

  address: text("address"),
  city: varchar("city", { length: 100 }),
  district: varchar("district", { length: 100 }),
  state: varchar("state", { length: 100 }),

  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),

  operatingHours: varchar("operating_hours", { length: 100 }),

  status: varchar("status", { length: 50 })
    .default("ACTIVE")
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* =========================================================
   LEADS
========================================================= */

export const leads = pgTable("leads", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  leadId: varchar("lead_id", { length: 100 }).notNull().unique(),

  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 255 }),

  location: varchar("location", { length: 255 }),
  qualification: text("qualification"),

  interestedCourseId: integer("interested_course_id"),
  preferredUniversityId: integer("preferred_university_id"),

  source: varchar("source", { length: 100 }),

  centreId: integer("centre_id"),
  assignedTo: bigint("assigned_to", { mode: "number" }),

  status: varchar("status", { length: 50 })
    .default("NEW")
    .notNull(),

  priority: varchar("priority", { length: 30 })
    .default("NORMAL")
    .notNull(),

  lastContactedAt: timestamp("last_contacted_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),

  nextAction: text("next_action"),
  followUpResult: text("follow_up_result"),

  expectedAdmissionDate: date("expected_admission_date"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   LEAD FOLLOW UPS
========================================================= */

export const leadFollowUps = pgTable("lead_follow_ups", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  leadId: bigint("lead_id", { mode: "number" }).notNull(),

  followUpAt: timestamp("follow_up_at").notNull(),

  result: text("result"),
  notes: text("notes"),

  createdBy: bigint("created_by", { mode: "number" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================
   UNIVERSITY PROGRAMS
========================================================= */

export const universityPrograms = pgTable("university_programs", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  universityId: integer("university_id").notNull(),

  programCode: varchar("program_code", { length: 100 }),
  programName: varchar("program_name", { length: 255 }).notNull(),

  programLevel: varchar("program_level", { length: 100 }),
  category: varchar("category", { length: 100 }),

  durationYears: numeric("duration_years"),
  durationSemesters: integer("duration_semesters"),

  eligibility: text("eligibility"),
  studyMode: varchar("study_mode", { length: 100 }),

  sourceFee: numeric("source_fee"),
  aiitFee: numeric("aiit_fee"),
  aiitCommission: numeric("aiit_commission"),

  admissionStatus: varchar("admission_status", {
    length: 50,
  })
    .default("UNDER REVIEW")
    .notNull(),

  verificationStatus: varchar("verification_status", {
    length: 50,
  })
    .default("PENDING")
    .notNull(),

  admissionStart: date("admission_start"),
  admissionEnd: date("admission_end"),

  applicationProcess: text("application_process"),
  requiredDocuments: text("required_documents"),
  examProcess: text("exam_process"),
  resultProcess: text("result_process"),

  lastVerifiedAt: timestamp("last_verified_at"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* =========================================================
   APPLICATIONS
========================================================= */

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),

  applicationId: varchar("application_id", {
    length: 50,
  })
    .notNull()
    .unique(),

  courseId: integer("course_id").notNull(),
  universityId: integer("university_id"),

  centreId: integer("centre_id"),
  leadId: bigint("lead_id", { mode: "number" }),
  assignedTo: bigint("assigned_to", { mode: "number" }),

  studyMode: varchar("study_mode", { length: 100 }),

  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),

  fatherName: varchar("father_name", { length: 255 }).notNull(),
  motherName: varchar("mother_name", { length: 255 }).notNull(),

  dob: varchar("dob", { length: 20 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),

  mobile: varchar("mobile", { length: 15 }).notNull(),
  email: varchar("email", { length: 255 }),

  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pinCode: varchar("pin_code", { length: 10 }).notNull(),

  tenthBoard: varchar("tenth_board", { length: 255 }),
  tenthYear: varchar("tenth_year", { length: 10 }),
  tenthPercentage: varchar("tenth_percentage", { length: 10 }),

  twelfthBoard: varchar("twelfth_board", { length: 255 }),
  twelfthYear: varchar("twelfth_year", { length: 10 }),
  twelfthPercentage: varchar("twelfth_percentage", {
    length: 10,
  }),

  gradUniversity: varchar("grad_university", {
    length: 255,
  }),
  gradYear: varchar("grad_year", { length: 10 }),
  gradPercentage: varchar("grad_percentage", {
    length: 10,
  }),

  paymentScreenshotPath: text("payment_screenshot_path"),
  paymentScreenshotUploadedAt: timestamp(
    "payment_screenshot_uploaded_at",
  ),

  status: varchar("status", { length: 20 })
    .default("pending")
    .notNull(),

  applicationStatus: varchar("application_status", {
    length: 50,
  }).default("RECEIVED"),

  documentStatus: varchar("document_status", {
    length: 30,
  }).default("PENDING"),

  verificationStatus: varchar("verification_status", {
    length: 30,
  }).default("PENDING"),

  nextAction: text("next_action"),
  dueDate: date("due_date"),

  admissionSource: text("admission_source"),
  remarks: text("remarks"),

  declaration: boolean("declaration")
    .default(false)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* =========================================================
   APPLICATION STATUS HISTORY
========================================================= */

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    applicationId: integer("application_id").notNull(),

    oldStatus: text("old_status"),
    newStatus: text("new_status").notNull(),

    changedBy: bigint("changed_by", { mode: "number" }),

    changedAt: timestamp("changed_at")
      .defaultNow()
      .notNull(),

    notes: text("notes"),
  },
);

/* =========================================================
   DOCUMENTS
========================================================= */

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),

  applicationId: varchar("application_id", {
    length: 50,
  }).notNull(),

  docType: varchar("doc_type", {
    length: 100,
  }).notNull(),

  fileName: varchar("file_name", {
    length: 500,
  }).notNull(),

  filePath: text("file_path").notNull(),

  fileSize: integer("file_size"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

/* =========================================================
   STUDENTS
========================================================= */

export const students = pgTable("students", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  studentId: varchar("student_id", { length: 100 })
    .notNull()
    .unique(),

  leadId: bigint("lead_id", { mode: "number" }),
  applicationId: integer("application_id"),

  centreId: integer("centre_id"),

  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),

  dob: date("dob"),
  gender: varchar("gender", { length: 30 }),

  mobile: varchar("mobile", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 255 }),

  address: text("address"),
  village: varchar("village", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pinCode: varchar("pin_code", { length: 20 }),

  qualification: text("qualification"),

  courseId: integer("course_id"),
  universityId: integer("university_id"),

  programName: varchar("program_name", { length: 255 }),
  studyMode: varchar("study_mode", { length: 100 }),

  admissionDate: date("admission_date"),

  studentStatus: varchar("student_status", {
    length: 50,
  }).default("ACTIVE"),

  totalFee: numeric("total_fee").default("0"),
  amountPaid: numeric("amount_paid").default("0"),
  amountPending: numeric("amount_pending").default("0"),

  paymentStatus: varchar("payment_status", {
    length: 50,
  }).default("PENDING"),

  documentStatus: varchar("document_status", {
    length: 50,
  }).default("PENDING"),

  applicationStatus: varchar("application_status", {
    length: 50,
  }),

  enrollmentNumber: varchar("enrollment_number", {
    length: 100,
  }),

  examStatus: varchar("exam_status", { length: 50 }),
  resultStatus: varchar("result_status", { length: 50 }),
  certificateStatus: varchar("certificate_status", {
    length: 50,
  }),

  assignedStaffId: bigint("assigned_staff_id", {
    mode: "number",
  }),

  emergencyContactName: varchar(
    "emergency_contact_name",
    { length: 255 },
  ),

  emergencyContactMobile: varchar(
    "emergency_contact_mobile",
    { length: 30 },
  ),

  bloodGroup: varchar("blood_group", { length: 20 }),

  admissionSource: text("admission_source"),

  completionDate: date("completion_date"),

  remarks: text("remarks"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* =========================================================
   STUDENT DOCUMENTS
========================================================= */

export const studentDocuments = pgTable(
  "student_documents",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    documentId: varchar("document_id", {
      length: 100,
    })
      .notNull()
      .unique(),

    studentId: bigint("student_id", {
      mode: "number",
    }).notNull(),

    documentType: varchar("document_type", {
      length: 100,
    }).notNull(),

    documentCategory: varchar("document_category", {
      length: 100,
    }),

    fileName: varchar("file_name", {
      length: 500,
    }),

    storagePath: text("storage_path"),

    isMandatory: boolean("is_mandatory").default(false),

    uploadedAt: timestamp("uploaded_at"),
    uploadedBy: bigint("uploaded_by", {
      mode: "number",
    }),

    verificationStatus: varchar(
      "verification_status",
      { length: 50 },
    ).default("PENDING"),

    verifiedBy: bigint("verified_by", {
      mode: "number",
    }),

    verifiedAt: timestamp("verified_at"),

    rejectionReason: text("rejection_reason"),
    expiryDate: date("expiry_date"),
    remarks: text("remarks"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   PAYMENTS
========================================================= */

export const payments = pgTable("payments", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  receiptId: varchar("receipt_id", {
    length: 100,
  })
    .notNull()
    .unique(),

  studentId: bigint("student_id", {
    mode: "number",
  }),

  applicationId: integer("application_id"),

  centreId: integer("centre_id"),

  paymentDate: date("payment_date").notNull(),

  amount: numeric("amount").notNull(),

  paymentType: varchar("payment_type", {
    length: 100,
  }),

  paymentMode: varchar("payment_mode", {
    length: 50,
  }),

  referenceNumber: varchar("reference_number", {
    length: 255,
  }),

  receivedBy: bigint("received_by", {
    mode: "number",
  }),

  proofPath: text("proof_path"),

  paymentStatus: varchar("payment_status", {
    length: 50,
  }).default("RECEIVED"),

  receiptNumber: varchar("receipt_number", {
    length: 100,
  }),

  verifiedBy: bigint("verified_by", {
    mode: "number",
  }),

  verifiedAt: timestamp("verified_at"),

  notes: text("notes"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

/* =========================================================
   STUDENT SERVICES
========================================================= */

export const studentServices = pgTable(
  "student_services",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    studentId: bigint("student_id", {
      mode: "number",
    }).notNull(),

    serviceType: varchar("service_type", {
      length: 100,
    }).notNull(),

    status: varchar("status", {
      length: 50,
    }).default("PENDING"),

    priority: varchar("priority", {
      length: 30,
    }).default("NORMAL"),

    requestedAt: timestamp("requested_at")
      .defaultNow()
      .notNull(),

    dueDate: date("due_date"),

    completedAt: timestamp("completed_at"),

    ownerId: bigint("owner_id", {
      mode: "number",
    }),

    assignedTo: bigint("assigned_to", {
      mode: "number",
    }),

    requestedBy: bigint("requested_by", {
      mode: "number",
    }),

    referenceNumber: varchar(
      "reference_number",
      { length: 255 },
    ),

    notes: text("notes"),
    remarks: text("remarks"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   STAFF
========================================================= */

export const staff = pgTable("staff", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  employeeId: varchar("employee_id", {
    length: 100,
  })
    .notNull()
    .unique(),

  name: varchar("name", { length: 255 }).notNull(),

  role: varchar("role", { length: 100 }),
  department: varchar("department", {
    length: 100,
  }),

  centreId: integer("centre_id"),

  joiningDate: date("joining_date"),

  employmentType: varchar("employment_type", {
    length: 100,
  }),

  salary: numeric("salary"),

  managerId: bigint("manager_id", {
    mode: "number",
  }),

  status: varchar("status", {
    length: 50,
  }).default("ACTIVE"),

  email: varchar("email", { length: 255 }),
  mobile: varchar("mobile", { length: 30 }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   STAFF TASKS
========================================================= */

export const staffTasks = pgTable("staff_tasks", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  taskId: varchar("task_id", { length: 100 }),

  staffId: bigint("staff_id", {
    mode: "number",
  }),

  centreId: integer("centre_id"),

  taskDate: date("task_date"),

  taskName: varchar("task_name", {
    length: 255,
  }).notNull(),

  description: text("description"),

  deadline: timestamp("deadline"),

  assignedTo: bigint("assigned_to", {
    mode: "number",
  }),

  priority: varchar("priority", {
    length: 30,
  }).default("NORMAL"),

  dueDate: date("due_date"),

  status: varchar("status", {
    length: 50,
  }).default("PENDING"),

  qualityScore: numeric("quality_score"),

  completedAt: timestamp("completed_at"),

  completionNotes: text("completion_notes"),

  remarks: text("remarks"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   STAFF ATTENDANCE
========================================================= */

export const staffAttendance = pgTable(
  "staff_attendance",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    staffId: bigint("staff_id", {
      mode: "number",
    }).notNull(),

    centreId: integer("centre_id"),

    attendanceDate: date("attendance_date")
      .notNull(),

    checkIn: timestamp("check_in"),
    checkOut: timestamp("check_out"),

    workingHours: numeric("working_hours"),

    lateMinutes: integer("late_minutes"),

    leaveStatus: varchar("leave_status", {
      length: 50,
    }),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   STAFF ROLES
========================================================= */

export const staffRoles = pgTable("staff_roles", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  roleCode: varchar("role_code", {
    length: 100,
  }).notNull(),

  roleName: varchar("role_name", {
    length: 255,
  }).notNull(),

  department: varchar("department", {
    length: 100,
  }),

  description: text("description"),
  responsibilities: text("responsibilities"),
  kpis: text("kpis"),

  reportingToRole: varchar("reporting_to_role", {
    length: 255,
  }),

  approvalLevel: varchar("approval_level", {
    length: 100,
  }),

  status: varchar("status", {
    length: 50,
  }).default("ACTIVE"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   STAFF SOPs
========================================================= */

export const staffSops = pgTable("staff_sops", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  sopCode: varchar("sop_code", {
    length: 100,
  }).notNull(),

  sopName: varchar("sop_name", {
    length: 255,
  }).notNull(),

  department: varchar("department", {
    length: 100,
  }),

  applicableRole: varchar("applicable_role", {
    length: 255,
  }),

  processArea: varchar("process_area", {
    length: 255,
  }),

  steps: text("steps").notNull(),
  checklist: text("checklist"),

  slaHours: integer("sla_hours"),

  escalationRule: text("escalation_rule"),

  approvalRequired: boolean("approval_required")
    .default(false)
    .notNull(),

  status: varchar("status", {
    length: 50,
  }).default("ACTIVE"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   TRAINING PROGRAMS
========================================================= */

export const staffTrainingPrograms = pgTable(
  "staff_training_programs",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    trainingCode: varchar("training_code", {
      length: 100,
    }).notNull(),

    trainingName: varchar("training_name", {
      length: 255,
    }).notNull(),

    department: varchar("department", {
      length: 100,
    }),

    applicableRole: varchar("applicable_role", {
      length: 255,
    }),

    trainingType: varchar("training_type", {
      length: 100,
    }),

    description: text("description"),

    durationHours: numeric("duration_hours"),

    trainer: varchar("trainer", {
      length: 255,
    }),

    materialsUrl: text("materials_url"),

    assessmentRequired: boolean(
      "assessment_required",
    )
      .default(false)
      .notNull(),

    status: varchar("status", {
      length: 50,
    }).default("ACTIVE"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   TRAINING RECORDS
========================================================= */

export const staffTrainingRecords = pgTable(
  "staff_training_records",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    staffId: bigint("staff_id", {
      mode: "number",
    }).notNull(),

    trainingProgramId: bigint("training_program_id", {
      mode: "number",
    }).notNull(),

    assignedDate: date("assigned_date")
      .defaultNow()
      .notNull(),

    startDate: date("start_date"),
    completionDate: date("completion_date"),

    status: varchar("status", {
      length: 50,
    }).default("ASSIGNED"),

    score: numeric("score"),

    trainerFeedback: text("trainer_feedback"),

    certificatePath: text("certificate_path"),

    remarks: text("remarks"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   PERFORMANCE REVIEWS
========================================================= */

export const performanceReviews = pgTable(
  "performance_reviews",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    staffId: bigint("staff_id", {
      mode: "number",
    }).notNull(),

    centreId: integer("centre_id"),

    reviewerId: bigint("reviewer_id", {
      mode: "number",
    }),

    reviewPeriodStart: date("review_period_start"),
    reviewPeriodEnd: date("review_period_end"),

    attendanceScore: numeric("attendance_score"),
    taskCompletionScore: numeric(
      "task_completion_score",
    ),
    qualityScore: numeric("quality_score"),
    targetScore: numeric("target_score"),
    overallScore: numeric("overall_score"),

    strengths: text("strengths"),
    improvementAreas: text("improvement_areas"),
    actionPlan: text("action_plan"),

    nextReviewDate: date("next_review_date"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   INCENTIVE RULES
========================================================= */

export const incentiveRules = pgTable(
  "incentive_rules",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    ruleCode: varchar("rule_code", {
      length: 100,
    }).notNull(),

    ruleName: varchar("rule_name", {
      length: 255,
    }).notNull(),

    department: varchar("department", {
      length: 100,
    }),

    applicableRole: varchar("applicable_role", {
      length: 255,
    }),

    metric: varchar("metric", {
      length: 100,
    }).notNull(),

    thresholdValue: numeric("threshold_value"),

    incentiveType: varchar("incentive_type", {
      length: 50,
    }).notNull(),

    incentiveValue: numeric("incentive_value")
      .default("0")
      .notNull(),

    frequency: varchar("frequency", {
      length: 50,
    })
      .default("MONTHLY")
      .notNull(),

    approvalRequired: boolean(
      "approval_required",
    )
      .default(true)
      .notNull(),

    status: varchar("status", {
      length: 50,
    }).default("ACTIVE"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   STAFF INCENTIVES
========================================================= */

export const staffIncentives = pgTable(
  "staff_incentives",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    staffId: bigint("staff_id", {
      mode: "number",
    }).notNull(),

    incentiveRuleId: bigint(
      "incentive_rule_id",
      { mode: "number" },
    ),

    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),

    metricValue: numeric("metric_value"),

    calculatedAmount: numeric(
      "calculated_amount",
    )
      .default("0")
      .notNull(),

    status: varchar("status", {
      length: 50,
    }).default("PENDING"),

    approvedBy: bigint("approved_by", {
      mode: "number",
    }),

    approvedAt: timestamp("approved_at"),

    paidAt: timestamp("paid_at"),

    paymentReference: varchar(
      "payment_reference",
      { length: 255 },
    ),

    remarks: text("remarks"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   MARKETING CAMPAIGNS
========================================================= */

export const marketingCampaigns = pgTable(
  "marketing_campaigns",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    campaignCode: varchar("campaign_code", {
      length: 100,
    }).notNull(),

    campaignName: varchar("campaign_name", {
      length: 255,
    }).notNull(),

    campaignType: varchar("campaign_type", {
      length: 100,
    }),

    centreId: integer("centre_id"),

    objective: text("objective"),
    targetAudience: text("target_audience"),

    startDate: date("start_date"),
    endDate: date("end_date"),

    budget: numeric("budget").default("0"),

    status: varchar("status", {
      length: 50,
    }).default("PLANNED"),

    leadsGenerated: integer("leads_generated")
      .default(0),

    applicationsGenerated: integer(
      "applications_generated",
    ).default(0),

    admissionsGenerated: integer(
      "admissions_generated",
    ).default(0),

    revenueGenerated: numeric(
      "revenue_generated",
    ).default("0"),

    notes: text("notes"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   MARKETING ACTIVITIES
========================================================= */

export const marketingActivities = pgTable(
  "marketing_activities",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    campaignId: bigint("campaign_id", {
      mode: "number",
    }),

    activityDate: date("activity_date")
      .defaultNow()
      .notNull(),

    activityType: varchar(
      "activity_type",
      { length: 100 },
    ).notNull(),

    platform: varchar("platform", {
      length: 100,
    }),

    contentTitle: varchar("content_title", {
      length: 255,
    }),

    targetCourseId: integer("target_course_id"),
    targetCentreId: integer("target_centre_id"),

    spend: numeric("spend").default("0"),

    reach: integer("reach").default(0),
    enquiries: integer("enquiries").default(0),
    applications: integer("applications").default(0),
    admissions: integer("admissions").default(0),

    notes: text("notes"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   SALES TARGETS
========================================================= */

export const salesTargets = pgTable("sales_targets", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  targetCode: varchar("target_code", {
    length: 100,
  }).notNull(),

  centreId: integer("centre_id"),

  staffId: bigint("staff_id", {
    mode: "number",
  }),

  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),

  targetType: varchar("target_type", {
    length: 100,
  }).notNull(),

  targetValue: numeric("target_value")
    .default("0")
    .notNull(),

  achievedValue: numeric("achieved_value")
    .default("0")
    .notNull(),

  status: varchar("status", {
    length: 50,
  }).default("ACTIVE"),

  notes: text("notes"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   ACCOUNTING TRANSACTIONS
========================================================= */

export const accountingTransactions = pgTable(
  "accounting_transactions",
  {
    id: bigint("id", { mode: "number" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    transactionCode: varchar(
      "transaction_code",
      { length: 100 },
    ).notNull(),

    transactionDate: date(
      "transaction_date",
    )
      .defaultNow()
      .notNull(),

    centreId: integer("centre_id"),

    transactionType: varchar(
      "transaction_type",
      { length: 50 },
    ).notNull(),

    category: varchar("category", {
      length: 100,
    }).notNull(),

    description: text("description"),

    amount: numeric("amount")
      .default("0")
      .notNull(),

    paymentMode: varchar("payment_mode", {
      length: 50,
    }),

    referenceNumber: varchar(
      "reference_number",
      { length: 255 },
    ),

    relatedStudentId: bigint(
      "related_student_id",
      { mode: "number" },
    ),

    relatedPaymentId: bigint(
      "related_payment_id",
      { mode: "number" },
    ),

    relatedExpenseId: bigint(
      "related_expense_id",
      { mode: "number" },
    ),

    recordedBy: bigint("recorded_by", {
      mode: "number",
    }),

    status: varchar("status", {
      length: 50,
    }).default("POSTED"),

    notes: text("notes"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   EXPENSES
========================================================= */

export const expenses = pgTable("expenses", {
  id: bigint("id", { mode: "number" }).primaryKey(),

  expenseDate: date("expense_date"),

  centreId: integer("centre_id"),

  category: varchar("category", {
    length: 100,
  }),

  description: text("description"),

  amount: numeric("amount"),

  paymentMode: varchar("payment_mode", {
    length: 50,
  }),

  referenceNumber: varchar(
    "reference_number",
    { length: 255 },
  ),

  status: varchar("status", {
    length: 50,
  }),

  notes: text("notes"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================================
   FINANCIAL CONTROLS
========================================================= */

export const financialControls = pgTable(
  "financial_controls",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    controlCode: varchar("control_code", {
      length: 100,
    }).notNull(),

    controlName: varchar("control_name", {
      length: 255,
    }).notNull(),

    controlType: varchar("control_type", {
      length: 100,
    }).notNull(),

    centreId: integer("centre_id"),

    thresholdAmount: numeric(
      "threshold_amount",
    ),

    approvalRequired: boolean(
      "approval_required",
    )
      .default(true)
      .notNull(),

    approverRole: varchar("approver_role", {
      length: 255,
    }),

    frequency: varchar("frequency", {
      length: 50,
    })
      .default("MONTHLY")
      .notNull(),

    status: varchar("status", {
      length: 50,
    }).default("ACTIVE"),

    notes: text("notes"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   FINANCIAL CONTROL LOGS
========================================================= */

export const financialControlLogs = pgTable(
  "financial_control_logs",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    controlId: bigint("control_id", {
      mode: "number",
    }).notNull(),

    transactionId: bigint(
      "transaction_id",
      { mode: "number" },
    ),

    requestedBy: bigint("requested_by", {
      mode: "number",
    }),

    approvedBy: bigint("approved_by", {
      mode: "number",
    }),

    requestedAmount: numeric(
      "requested_amount",
    ),

    approvedAmount: numeric(
      "approved_amount",
    ),

    status: varchar("status", {
      length: 50,
    }).default("PENDING"),

    requestedAt: timestamp("requested_at")
      .defaultNow()
      .notNull(),

    approvedAt: timestamp("approved_at"),

    rejectionReason: text("rejection_reason"),

    notes: text("notes"),
  },
);

/* =========================================================
   JOB OPENINGS
========================================================= */

export const jobOpenings = pgTable(
  "job_openings",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    jobCode: varchar("job_code", {
      length: 100,
    }).notNull(),

    jobTitle: varchar("job_title", {
      length: 255,
    }).notNull(),

    department: varchar("department", {
      length: 100,
    }),

    centreId: integer("centre_id"),

    employmentType: varchar(
      "employment_type",
      { length: 100 },
    ),

    vacancies: integer("vacancies")
      .default(1)
      .notNull(),

    salaryMin: numeric("salary_min"),
    salaryMax: numeric("salary_max"),

    experienceRequired: text(
      "experience_required",
    ),

    qualificationRequired: text(
      "qualification_required",
    ),

    responsibilities: text("responsibilities"),
    skillsRequired: text("skills_required"),

    applicationDeadline: date(
      "application_deadline",
    ),

    status: varchar("status", {
      length: 50,
    }).default("OPEN"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   JOB APPLICANTS
========================================================= */

export const jobApplicants = pgTable(
  "job_applicants",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    applicantCode: varchar(
      "applicant_code",
      { length: 100 },
    ).notNull(),

    jobOpeningId: bigint(
      "job_opening_id",
      { mode: "number" },
    ).notNull(),

    name: varchar("name", {
      length: 255,
    }).notNull(),

    mobile: varchar("mobile", {
      length: 30,
    }),

    email: varchar("email", {
      length: 255,
    }),

    location: varchar("location", {
      length: 255,
    }),

    qualification: text("qualification"),
    experience: text("experience"),

    resumePath: text("resume_path"),

    source: varchar("source", {
      length: 100,
    }),

    stage: varchar("stage", {
      length: 50,
    }).default("APPLIED"),

    interviewDate: timestamp(
      "interview_date",
    ),

    interviewNotes: text(
      "interview_notes",
    ),

    score: numeric("score"),

    decision: text("decision"),

    remarks: text("remarks"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   REPLICATION TEMPLATES
========================================================= */

export const replicationTemplates = pgTable(
  "replication_templates",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    templateCode: varchar(
      "template_code",
      { length: 100 },
    ).notNull(),

    templateName: varchar(
      "template_name",
      { length: 255 },
    ).notNull(),

    moduleName: varchar("module_name", {
      length: 255,
    }).notNull(),

    description: text("description"),

    configuration: jsonb("configuration")
      .default({}),

    version: varchar("version", {
      length: 50,
    })
      .default("1.0")
      .notNull(),

    status: varchar("status", {
      length: 50,
    }).default("ACTIVE"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   REPLICATION INSTANCES
========================================================= */

export const replicationInstances = pgTable(
  "replication_instances",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),

    instanceCode: varchar(
      "instance_code",
      { length: 100 },
    ).notNull(),

    instanceName: varchar(
      "instance_name",
      { length: 255 },
    ).notNull(),

    centreId: integer("centre_id"),

    templateId: bigint("template_id", {
      mode: "number",
    }),

    implementationStatus: varchar(
      "implementation_status",
      { length: 50 },
    ).default("PLANNED"),

    launchDate: date("launch_date"),

    configuration: jsonb("configuration")
      .default({}),

    ownerStaffId: bigint("owner_staff_id", {
      mode: "number",
    }),

    notes: text("notes"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

/* =========================================================
   VACANCIES
========================================================= */

export const vacancies = pgTable("vacancies", {
  id: serial("id").primaryKey(),

  title: varchar("title", {
    length: 255,
  }).notNull(),

  slug: varchar("slug", {
    length: 255,
  })
    .notNull()
    .unique(),

  department: varchar("department", {
    length: 100,
  }),

  employmentType: varchar(
    "employment_type",
    { length: 100 },
  ),

  location: varchar("location", {
    length: 255,
  }),

  openings: integer("openings")
    .default(1)
    .notNull(),

  description: text("description"),
  responsibilities: text("responsibilities"),
  qualifications: text("qualifications"),

  experience: varchar("experience", {
    length: 255,
  }),

  salary: varchar("salary", {
    length: 255,
  }),

  enabled: boolean("enabled")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* =========================================================
   VACANCY APPLICATIONS
========================================================= */

export const vacancyApplications = pgTable(
  "vacancy_applications",
  {
    id: serial("id").primaryKey(),

    applicationId: varchar(
      "application_id",
      { length: 50 },
    )
      .notNull()
      .unique(),

    vacancyId: integer("vacancy_id")
      .notNull(),

    firstName: varchar(
      "first_name",
      { length: 255 },
    ).notNull(),

    lastName: varchar(
      "last_name",
      { length: 255 },
    ),

    mobile: varchar("mobile", {
      length: 15,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }).notNull(),

    address: text("address"),
    city: varchar("city", {
      length: 100,
    }),

    state: varchar("state", {
      length: 100,
    }),

    qualification: text("qualification"),
    experience: text("experience"),

    resumePath: text("resume_path"),

    status: varchar("status", {
      length: 20,
    })
      .default("pending")
      .notNull(),

    declaration: boolean("declaration")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   ADMIN
========================================================= */

export const admin = pgTable("admin", {
  id: serial("id").primaryKey(),

  email: varchar("email", {
    length: 255,
  })
    .notNull()
    .unique(),

  password: text("password").notNull(),

  name: varchar("name", {
    length: 255,
  }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
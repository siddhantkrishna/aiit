export type UniversityFeeSource = {
  id: number;
  universityId: number;
  courseName: string;
  studyMode: string;
  feeBasis: string;
  listedAmountPaise: number;
  duration?: string | null;
  eligibility?: string | null;
};

export type ListedCourse = {
  id: number;
  name: string;
  fullName?: string | null;
  studyMode?: string | null;
  universityId?: number | null;
  enabled: boolean;
  category?: string | null;
  duration?: string | null;
  eligibility?: string | null;
};

export type ApprovedUniversityFee = {
  id: number;
  courseId: number;
  universityId: number;
  originalAmount: number;
  semesters: number;
  effectiveFrom: string;
};

export type UniversityCourseListing = {
  key: string;
  universityId: number;
  title: string;
  mode: string;
  duration: string | null;
  eligibility: string | null;
  courseId: number | null;
  amountPaise: number;
  maximumAmountPaise: number;
  status: "approved" | "reference" | "conflict";
  basis: "APPROVED_TOTAL" | "PER_YEAR" | "LISTED_COURSE_TOTAL" | "UNSPECIFIED_TOTAL";
};

// Display names are cleaned without changing the original uploaded fee sources.
const sourceTitles: Record<string, string> = {
  "B.COM": "B.Com",
  "B.LIB": "B.Lib",
  "BBA": "BBA",
  "BSC BIOLOGY": "B.Sc (Biology)",
  "BSC CS": "B.Sc (Computer Science)",
  "BSC MATHS": "B.Sc (Mathematics)",
  "DCA": "DCA",
  "MA ECONOMICS": "MA (Economics)",
  "MA ENGLISH": "MA (English)",
  "MA ENGLISH LIT": "MA (English Literature)",
  "MA ENGLISH EARLYBIRD": "MA (English — Early Bird)",
  "MA HINDI": "MA (Hindi)",
  "MA HISTORY": "MA (History)",
  "MA POLITICAL SCIENCE": "MA (Political Science)",
  "MA SANSKRIT": "MA (Sanskrit)",
  "MA SOSIOLOGY": "MA (Sociology)",
  "M.COM": "M.Com",
  "M.LIB": "M.Lib",
  "MSC CHEMISTRY": "M.Sc (Chemistry)",
  "M.SC CS": "M.Sc (Computer Science)",
  "M,SC IT": "M.Sc (Information Technology)",
  "M.SC MATHS": "M.Sc (Mathematics)",
  "M.SCPHYSICS": "M.Sc (Physics)",
  "MSW": "MSW",
  "PGD IN INVORMENT AND POLLUTION MANAGMANT": "PGD in Environment and Pollution Management",
  "MASTER OF JOUNRALISM AND MASS COMUNICATION": "Master of Journalism and Mass Communication",
  "MASTER OF LIBRARY AND INFORMATION SCIENCE": "Master of Library and Information Science",
  "HDCPA (HORORS DIPLOMA IN COMPUTER PROGRAMING AND APPLICATION)": "HDCPA (Honours Diploma in Computer Programming and Applications)",
  "ACCPA (ADVANCE CERTIFICATE IN COMPUTER PROGRAMING AND APPLICATION)": "ACCPA (Advanced Certificate in Computer Programming and Applications)",
  "CCA (CERTIFICATE IN COMPUTER APPLICATION)": "CCA (Certificate in Computer Applications)",
  "TALLY (CETIFICATE IN FINANCIAL ACCOUNTING)": "Tally (Certificate in Financial Accounting)",
  "TYPING (HINDI /ENGLISH)": "Typing (Hindi / English)",
  "C-ITJ (CERTIFICATE IN IT JIGYASHA)": "C-ITJ (Certificate in IT Jigyasha)",
  "AI PROMPT ENGI.": "AI Prompt Engineering",
  "CDEO (CERTIFICATE IN DATA ENTRY OPERATORE)": "CDEO (Certificate in Data Entry Operator)",
  "DDEO (DIPLOMA IN DATA ENTRY OPERATER)": "DDEO (Diploma in Data Entry Operator)",
};

function normalizeTitle(text: string): string {
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

function offeringKey(source: UniversityFeeSource): string {
  return [
    source.universityId,
    source.studyMode.trim().toUpperCase(),
    source.feeBasis,
    normalizeTitle(source.courseName),
  ].join(":");
}

export function readableSourceTitle(rawName: string): string {
  const normalized = normalizeTitle(rawName);
  const mapped = sourceTitles[normalized];
  if (mapped) return mapped;
  // Preserve unknown abbreviations instead of inventing course specialisations.
  return rawName.trim().replace(/\s+/g, " ").replace(/\b(sos iology|sosiology)\b/gi, "Sociology");
}

/**
 * Keep universities, modes and pricing bases separate. Repeated rows of the
 * same offering become a range when their source prices disagree.
 */
export function buildUniversityCourseListings(
  sources: readonly UniversityFeeSource[],
  approvedFees: readonly ApprovedUniversityFee[],
  courses: readonly ListedCourse[],
): UniversityCourseListing[] {
  const grouped = new Map<string, UniversityFeeSource[]>();
  for (const source of sources) {
    if (!Number.isSafeInteger(source.listedAmountPaise) || source.listedAmountPaise <= 0) continue;
    const key = offeringKey(source);
    grouped.set(key, [...(grouped.get(key) ?? []), source]);
  }

  const listings: UniversityCourseListing[] = [...grouped.entries()].map(([key, rows]) => {
    const amounts = [...new Set(rows.map(row => row.listedAmountPaise))].sort((a, b) => a - b);
    const first = rows[0];
    return {
      key: `source:${key}`,
      universityId: first.universityId,
      title: readableSourceTitle(first.courseName),
      mode: first.studyMode.trim().toUpperCase(),
      duration: first.duration?.trim() || null,
      eligibility: first.eligibility?.trim() || null,
      courseId: null,
      amountPaise: amounts[0],
      maximumAmountPaise: amounts[amounts.length - 1],
      status: amounts.length > 1 ? "conflict" : "reference",
      basis: first.feeBasis === "PER_YEAR" || first.feeBasis === "LISTED_COURSE_TOTAL"
        ? first.feeBasis
        : "UNSPECIFIED_TOTAL",
    };
  });

  const latest = new Map<string, ApprovedUniversityFee>();
  for (const fee of [...approvedFees].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.id - a.id)) {
    const key = `${fee.universityId}:${fee.courseId}`;
    if (!latest.has(key) && fee.originalAmount > 0) latest.set(key, fee);
  }

  for (const fee of latest.values()) {
    const course = courses.find(c => c.id === fee.courseId && c.enabled);
    if (!course || (course.universityId != null && course.universityId !== fee.universityId)) continue;
    const matches = listings.filter(item => item.universityId === fee.universityId &&
      normalizeTitle(item.title).replace(/[^A-Z0-9]/g, "") ===
        normalizeTitle(course.name).replace(/[^A-Z0-9]/g, ""));
    const exactMode = matches.filter(item => item.mode === (course.studyMode ?? "").trim().toUpperCase());
    // A single certificate price row for DCA can be matched to the approved
    // general DCA course; multiple variants must never be guessed.
    const match = exactMode.length === 1 ? exactMode[0] : matches.length === 1 ? matches[0] : null;
    if (match) {
      match.status = "approved";
      match.basis = "APPROVED_TOTAL";
      match.amountPaise = fee.originalAmount;
      match.maximumAmountPaise = fee.originalAmount;
      match.courseId = course.id;
      match.duration = course.duration?.trim() || match.duration;
      match.eligibility = course.eligibility?.trim() || match.eligibility;
    } else {
      listings.push({
        key: `approved:${fee.universityId}:${fee.courseId}`,
        universityId: fee.universityId,
        title: course.name,
        mode: (course.studyMode ?? "Regular").toUpperCase(),
        duration: course.duration?.trim() || null,
        eligibility: course.eligibility?.trim() || null,
        courseId: course.id,
        amountPaise: fee.originalAmount,
        maximumAmountPaise: fee.originalAmount,
        status: "approved",
        basis: "APPROVED_TOTAL",
      });
    }
  }

  return listings.sort((a, b) =>
    a.universityId - b.universityId ||
    a.title.localeCompare(b.title, "en") ||
    a.mode.localeCompare(b.mode) ||
    a.basis.localeCompare(b.basis));
}

import { db } from "./index";
import { universities, courses, admin, vacancies } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  // Seed universities
  const existingUnis = await db.select().from(universities);
  if (existingUnis.length === 0) {
    await db.insert(universities).values([
      {
        name: "Dr. C.V. Raman University",
        shortName: "CVRU",
        location: "Bilaspur, Chhattisgarh",
        description: "UGC recognized university offering diverse programs in science, technology, and humanities.",
        website: "https://cvru.ac.in",
        enabled: true,
      },
      {
        name: "AISECT University",
        shortName: "AISECT",
        location: "Bhopal, Madhya Pradesh",
        description: "Leading university in technology, management, and professional education.",
        website: "https://aisectuniversity.ac.in",
        enabled: true,
      },
      {
        name: "Rabindranath Tagore University",
        shortName: "RNTU",
        location: "Bhopal, Madhya Pradesh",
        description: "University for holistic education in arts, science, and technology.",
        website: "https://rntu.ac.in",
        enabled: true,
      },
    ]);
  }

  // Seed courses
  const existingCourses = await db.select().from(courses);
  if (existingCourses.length === 0) {
    const courseData = [
      { name: "DCA", fullName: "Diploma in Computer Application", duration: "1 Year", eligibility: "10th / 12th Pass", studyMode: "Regular", category: "Computer" },
      { name: "PGDCA", fullName: "Post Graduate Diploma in Computer Application", duration: "1 Year", eligibility: "Graduation", studyMode: "Regular", category: "Computer" },
      { name: "BCA", fullName: "Bachelor of Computer Application", duration: "3 Years", eligibility: "12th Pass", studyMode: "Regular", category: "University" },
      { name: "MCA", fullName: "Master of Computer Application", duration: "2 Years", eligibility: "BCA / B.Sc (CS)", studyMode: "Regular", category: "University" },
      { name: "B.Sc (CS)", fullName: "Bachelor of Science in Computer Science", duration: "3 Years", eligibility: "12th Pass (Science)", studyMode: "Regular", category: "University" },
      { name: "M.Sc (CS)", fullName: "Master of Science in Computer Science", duration: "2 Years", eligibility: "B.Sc / BCA", studyMode: "Regular", category: "University" },
      { name: "B.Sc (IT)", fullName: "Bachelor of Science in Information Technology", duration: "3 Years", eligibility: "12th Pass (Science)", studyMode: "Regular", category: "University" },
      { name: "M.Sc (IT)", fullName: "Master of Science in Information Technology", duration: "2 Years", eligibility: "B.Sc / BCA", studyMode: "Regular", category: "University" },
      { name: "B.Com", fullName: "Bachelor of Commerce", duration: "3 Years", eligibility: "12th Pass", studyMode: "Distance", category: "University" },
      { name: "M.Com", fullName: "Master of Commerce", duration: "2 Years", eligibility: "B.Com", studyMode: "Distance", category: "University" },
      { name: "BA", fullName: "Bachelor of Arts", duration: "3 Years", eligibility: "12th Pass", studyMode: "Distance", category: "University" },
      { name: "MA", fullName: "Master of Arts", duration: "2 Years", eligibility: "BA", studyMode: "Distance", category: "University" },
      { name: "MBA", fullName: "Master of Business Administration", duration: "2 Years", eligibility: "Graduation", studyMode: "Regular", category: "University" },
      { name: "MSW", fullName: "Master of Social Work", duration: "2 Years", eligibility: "Graduation", studyMode: "Distance", category: "University" },
      { name: "B.Lib", fullName: "Bachelor of Library Science", duration: "1 Year", eligibility: "Graduation", studyMode: "Distance", category: "University" },
      { name: "BJMC", fullName: "Bachelor of Journalism & Mass Communication", duration: "3 Years", eligibility: "12th Pass", studyMode: "Regular", category: "University" },
      { name: "MJMC", fullName: "Master of Journalism & Mass Communication", duration: "2 Years", eligibility: "Graduation", studyMode: "Regular", category: "University" },
      { name: "B.Ed", fullName: "Bachelor of Education", duration: "2 Years", eligibility: "Graduation (50%)", studyMode: "Regular", category: "Education" },
      { name: "D.El.Ed", fullName: "Diploma in Elementary Education", duration: "2 Years", eligibility: "12th Pass (50%)", studyMode: "Regular", category: "Education" },
      { name: "NTT", fullName: "Nursery Teacher Training", duration: "1 Year", eligibility: "12th Pass", studyMode: "Regular", category: "Education" },
      { name: "CTT", fullName: "Computer Teacher Training", duration: "1 Year", eligibility: "12th Pass", studyMode: "Regular", category: "Education" },
      { name: "B.Pharma", fullName: "Bachelor of Pharmacy", duration: "4 Years", eligibility: "12th Pass (PCB/PCM)", studyMode: "Regular", category: "Medical" },
      { name: "D.Pharma", fullName: "Diploma in Pharmacy", duration: "2 Years", eligibility: "12th Pass (PCB/PCM)", studyMode: "Regular", category: "Medical" },
      { name: "GNM Nursing", fullName: "General Nursing and Midwifery", duration: "3 Years", eligibility: "12th Pass (Science)", studyMode: "Regular", category: "Medical" },
      { name: "ANM Nursing", fullName: "Auxiliary Nurse Midwifery", duration: "2 Years", eligibility: "12th Pass", studyMode: "Regular", category: "Medical" },
      { name: "Computer Hardware", fullName: "Computer Hardware & Networking", duration: "6 Months", eligibility: "10th Pass", studyMode: "Regular", category: "Computer" },
      { name: "English Typing", fullName: "English Typing Course", duration: "3 Months", eligibility: "8th Pass", studyMode: "Regular", category: "Computer" },
      { name: "Hindi Typing", fullName: "Hindi Typing Course", duration: "3 Months", eligibility: "8th Pass", studyMode: "Regular", category: "Computer" },
      { name: "Tally", fullName: "Tally ERP / Tally Prime", duration: "3 Months", eligibility: "10th Pass", studyMode: "Regular", category: "Computer" },
      { name: "Tally with GST", fullName: "Tally with GST Certification", duration: "6 Months", eligibility: "12th Pass", studyMode: "Regular", category: "Computer" },
      { name: "CCC", fullName: "Course on Computer Concepts", duration: "3 Months", eligibility: "10th Pass", studyMode: "Regular", category: "Computer" },
      { name: "O Level", fullName: "NIELIT O Level", duration: "1 Year", eligibility: "12th Pass", studyMode: "Regular", category: "Professional" },
      { name: "A Level", fullName: "NIELIT A Level", duration: "1 Year", eligibility: "O Level / Graduation", studyMode: "Regular", category: "Professional" },
      { name: "ADCA", fullName: "Advanced Diploma in Computer Application", duration: "1 Year", eligibility: "12th Pass", studyMode: "Regular", category: "Computer" },
      { name: "Web Development", fullName: "Web Design & Development", duration: "6 Months", eligibility: "12th Pass", studyMode: "Regular", category: "Professional" },
      { name: "Graphic Design", fullName: "Graphic Design & Multimedia", duration: "6 Months", eligibility: "12th Pass", studyMode: "Regular", category: "Professional" },
    ];
    await db.insert(courses).values(courseData.map(c => ({ ...c, enabled: true })));
  }

  // Seed vacancies
  const defaultVacancies = [
    { title: "Computer Teacher", slug: "computer-teacher", department: "Academic", employmentType: "Full-time", location: "AIIT College", openings: 1, description: "Teach computer subjects and support practical learning at AIIT College.", responsibilities: "Plan and deliver computer classes, conduct practical sessions, evaluate students, maintain academic records, and support college activities.", qualifications: "BCA, MCA, B.Sc IT, B.Tech, or equivalent computer qualification. Teaching qualification preferred.", experience: "1+ years preferred", salary: "As per qualification and institution norms", enabled: true },
    { title: "Office Boy", slug: "office-boy", department: "Administration & Support", employmentType: "Full-time", location: "AIIT College", openings: 1, description: "Support routine office and campus operations.", responsibilities: "Office support, document movement, campus assistance, basic errands, and general support duties.", qualifications: "Minimum 8th pass; responsible and reliable.", experience: "Freshers may apply", salary: "As per institution norms", enabled: true },
    { title: "Advisor", slug: "advisor", department: "Admissions", employmentType: "Full-time", location: "AIIT College", openings: 1, description: "Guide students and parents through course selection and the admission process.", responsibilities: "Handle counselling enquiries, explain courses, maintain lead follow-ups, coordinate applications, and support admissions targets.", qualifications: "Graduate degree with good communication and counselling skills.", experience: "1+ years preferred", salary: "As per experience and institution norms", enabled: true },
    { title: "Marketing Head", slug: "marketing-head", department: "Marketing", employmentType: "Full-time", location: "AIIT College", openings: 1, description: "Lead student acquisition and brand marketing initiatives for AIIT College.", responsibilities: "Plan campaigns, manage marketing channels, coordinate the marketing team, track leads, optimize acquisition, and report performance.", qualifications: "Graduate degree with strong marketing, communication, and team-management skills.", experience: "2+ years preferred", salary: "As per experience and institution norms", enabled: true },
    { title: "Manager", slug: "manager", department: "Administration", employmentType: "Full-time", location: "AIIT College", openings: 1, description: "Coordinate administrative operations and ensure efficient day-to-day functioning of the institution.", responsibilities: "Supervise operations, coordinate staff, manage records, support admissions and administration, and report to management.", qualifications: "Graduate degree; management or administrative experience preferred.", experience: "2+ years preferred", salary: "As per experience and institution norms", enabled: true },
  ];

  const existingVacancies = await db.select().from(vacancies);
  const existingSlugs = new Set(existingVacancies.map((vacancy) => vacancy.slug));
  const missingVacancies = defaultVacancies.filter((vacancy) => !existingSlugs.has(vacancy.slug));

  if (missingVacancies.length > 0) {
    await db.insert(vacancies).values(missingVacancies);
  }

  // Seed admin
  const hashedPassword = await bcrypt.hash("AIITRSYJKM", 10);
  const existingAdmin = await db.select().from(admin).where(eq(admin.email, "dr.radhesir@gmail.com"));

  if (existingAdmin.length === 0) {
    await db.insert(admin).values({
      email: "dr.radhesir@gmail.com",
      password: hashedPassword,
      name: "Admin",
    });
  } else {
    await db.update(admin)
      .set({ password: hashedPassword })
      .where(eq(admin.email, "dr.radhesir@gmail.com"));
  }
}

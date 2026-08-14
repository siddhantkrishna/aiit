import { db } from "./index";
import { universities, courses, admin } from "./schema";
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

  // Seed admin
  const existingAdmin = await db.select().from(admin).where(eq(admin.email, "dr.radhesir@gmail.com"));
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("AIITRSYJKM", 10);
    await db.insert(admin).values({
      email: "dr.radhesir@gmail.com",
      password: hashedPassword,
      name: "Admin",
    });
  }
}

export type SearchableCourse = {
  id: number;
  name: string;
  fullName?: string | null;
  studyMode?: string | null;
  universityId?: number | null;
};

export function courseDisplayName(course: SearchableCourse): string {
  const name = course.name.trim();
  const fullName = course.fullName?.trim();
  const label = fullName && fullName.toLocaleLowerCase() !== name.toLocaleLowerCase()
    ? `${name} — ${fullName}`
    : name;
  return course.studyMode ? `${label} (${course.studyMode})` : label;
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function universityCourses<T extends SearchableCourse>(
  courses: readonly T[],
  universityId: number,
): T[] {
  if (!Number.isSafeInteger(universityId) || universityId < 1) return [];
  return courses.filter(course => course.universityId == null || course.universityId === universityId);
}

export function matchingCourses<T extends SearchableCourse>(
  courses: readonly T[],
  input: string,
): T[] {
  const query = normalize(input);
  if (!query) return [...courses];
  return courses.filter(course =>
    [course.name, course.fullName ?? "", course.studyMode ?? "", courseDisplayName(course)]
      .some(value => normalize(value).includes(query)),
  );
}

/**
 * Do not silently choose the first result when several different courses match.
 * Only an exact or unique match is safe for automatic selection.
 */
export function resolveTypedCourse<T extends SearchableCourse>(
  courses: readonly T[],
  input: string,
): T | undefined {
  const query = normalize(input);
  if (!query) return undefined;
  const exactMatches = courses.filter(course =>
    [courseDisplayName(course), course.name, course.fullName ?? ""]
      .some(value => normalize(value) === query),
  );
  if (exactMatches.length === 1) return exactMatches[0];
  if (exactMatches.length > 1 || query.length < 2) return undefined;
  const matches = matchingCourses(courses, query);
  return matches.length === 1 ? matches[0] : undefined;
}


/**
 * An offering is unique within its university and delivery mode.
 * Different specialisations, study modes and universities stay distinct.
 * Inactive/archived rows do not prevent new active offerings.
 */
function courseIdentity(course: SearchableCourse): string {
  const title = (course.fullName?.trim() || course.name.trim())
    .toLocaleLowerCase()
    .replace(/\bapplications\b/g, "application")
    .replace(/\btechnologies\b/g, "technology")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9]/g, "");
  const mode = normalize(course.studyMode ?? "");
  return [title, mode, course.universityId ?? "general"].join(":");
}

export function findDuplicateCourse<T extends SearchableCourse & { enabled?: boolean }>(
  catalog: readonly T[],
  candidate: SearchableCourse,
  excludeId?: number,
): T | undefined {
  const identity = courseIdentity(candidate);
  return catalog.find(course =>
    course.id !== excludeId &&
    course.enabled !== false &&
    courseIdentity(course) === identity,
  );
}

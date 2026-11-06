/**
 * University fee resolution is intentionally exact: never cross a university
 * boundary and never fall back to an institution-wide fee.
 * Input is already ordered newest-first by effective date.
 */
export function feeForUniversity<T extends { universityId: number | null }>(
  configurations: readonly T[],
  universityId: number | null | undefined,
): T | undefined {
  if (!Number.isSafeInteger(universityId) || !universityId || universityId <= 0) return undefined;
  return configurations.find(row => row.universityId === universityId);
}

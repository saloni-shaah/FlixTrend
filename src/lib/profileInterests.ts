export function normalizeProfileInterests(value: unknown): string[] {
  const interests = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return Array.from(
    new Set(
      interests
        .filter((interest): interest is string => typeof interest === 'string')
        .map((interest) => interest.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

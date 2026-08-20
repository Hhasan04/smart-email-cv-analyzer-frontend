export function scoreBadgeClasses(score: number | null): string {
  if (score === null) {
    return 'bg-gray-100 text-gray-600';
  }
  if (score >= 80) {
    return 'bg-green-100 text-green-800';
  }
  if (score >= 50) {
    return 'bg-yellow-100 text-yellow-800';
  }
  return 'bg-red-100 text-red-800';
}

export function latestAnalysis<T extends { createdAt: string }>(analyses: T[]): T | null {
  if (analyses.length === 0) {
    return null;
  }
  return [...analyses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

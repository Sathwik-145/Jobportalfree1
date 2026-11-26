export function bulkTestStatus<T extends { status: string; startedAt?: string; endedAt?: string; scheduledAt?: string }>(exams: T[], action: 'start' | 'end', at: string) {
  return exams.map(exam => action === 'start'
    ? { ...exam, status: 'active', startedAt: at, scheduledAt: undefined, endedAt: undefined }
    : { ...exam, status: 'ended', endedAt: at });
}
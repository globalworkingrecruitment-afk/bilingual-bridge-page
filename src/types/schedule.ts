export interface ScheduleRequestLog {
  id: string;
  employerId: string;
  employerUsername: string;
  employerEmail: string;
  employerName?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  availability: string;
  requestedAt: string;
}

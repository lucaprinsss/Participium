/**
 * Stati possibili di una segnalazione
 */
export enum ReportStatus {
  PENDING_APPROVAL = 'Pending Approval',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  SUSPENDED = 'Suspended',
  REJECTED = 'Rejected',
  RESOLVED = 'Resolved'
}
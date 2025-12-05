/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateReportStatusRequest:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [Assigned, Rejected, Resolved]
 *           description: New status for the report
 *         reason:
 *           type: string
 *           description: Reason for rejection (required if status is "Rejected")
 *         externalAssigneeId:
 *           type: number
 *           description: ID of external maintainer to assign (optional, for Assigned status)
 *       required:
 *         - status
 */
export interface UpdateReportStatusRequest {
  status: string;
  reason?: string;
  externalAssigneeId?: number;
}
/**
 * @swagger
 * components:
 *   schemas:
 *     RejectReportRequest:
 *       type: object
 *       required:
 *         - rejectionReason
 *       properties:
 *         rejectionReason:
 *           type: string
 *           minLength: 10
 *           maxLength: 500
 *           description: Detailed explanation for why the report is being rejected
 *           example: "The report does not contain sufficient information to identify the exact location of the problem. Please provide a more specific address or reference point."
 */

export interface RejectReportRequest {
  rejectionReason: string;
}

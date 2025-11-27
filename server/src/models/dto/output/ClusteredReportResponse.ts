import { Location } from '../Location';

/**
 * @swagger
 * components:
 *   schemas:
 *     ClusteredReportResponse:
 *       type: object
 *       properties:
 *         clusterId:
 *           type: string
 *           description: Unique identifier for the cluster (e.g., "cluster_45.464_9.190")
 *           example: "cluster_45.464_9.190"
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         reportCount:
 *           type: integer
 *           description: Total number of reports in this cluster
 *           example: 15
 *         reportIds:
 *           type: array
 *           description: Array of report IDs included in this cluster
 *           items:
 *             type: integer
 *           example: [1, 5, 12, 23, 34]
 *       description: Clustered reports for map visualization when zoomed out
 */

export interface ClusteredReportResponse {
  clusterId: string;
  location: Location; // Center point of the cluster
  reportCount: number;
  reportIds: number[];
}

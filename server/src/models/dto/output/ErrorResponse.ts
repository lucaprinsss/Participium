/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           description: Error message describing what went wrong
 *       example:
 *         error: An error occurred
 */
export interface ErrorResponse {
    error: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     Status:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         description:
 *           type: string
 *           example: Available
 */


/**
 * @openapi
 * components:
 *   schemas:
 *     StatusBody:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           example: Available
 */


/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *        error:
 *          type: boolean
 *          example: true
 *        message:
 *          type: string
 *          example: "Some error message"
 *
 */


/**
 * @openapi
 * components:
 *   schemas:
 *     Create:
 *      type: object
 *      properties:
 *       error:
 *         type: boolean
 *         example: false
 *       message:
 *         type: string
 *         example: "Item created successfully"
 *
 */


/**
 * @openapi
 * components:
 *   schemas:
 *     Update:
 *      type: object
 *      properties:
 *       error:
 *         type: boolean
 *         example: false
 *       message:
 *         type: string
 *         example: "Item updated successfully"
 *
 */


/**
 * @openapi
 * components:
 *   schemas:
 *     Delete:
 *      type: object
 *      properties:
 *       error:
 *         type: boolean
 *         example: false
 *       message:
 *         type: string
 *         example: "Item deleted successfully"
 *
 */
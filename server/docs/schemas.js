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
 *     News:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         description:
 *           type: string
 *           example: NEWS description
 *         document:
 *           type: string
 *           example: https://res.cloudinary.com/dizfi5qoy/image/upload/v1714082489/xxugyy1gdfdkqazohbr1yo.png
 *         statusId:
 *          type: number
 *          example: 1
 *         createdBy:
 *          type: number
 *          example: 1
 *         createdAt:
 *          type: date
 *          example: 2020-04-04
 *         closedAt:
 *          type: date
 *          example: 2024-02-20
 */


/**
 * @openapi
 * components:
 *   schemas:
 *     NewsBody:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           example: NEWS description
 *         document:
 *           type: string
 *           format: binary
 *         statusId:
 *          type: number
 *          example: 1
 *         createdBy:
 *          type: number
 *          example: 1
 *         createdAt:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2020-04-04
 *         closedAt:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2024-09-09
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
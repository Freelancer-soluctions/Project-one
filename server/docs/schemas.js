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
 *        statusCode:
 *          type: number
 *          example: 500
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
 *       statusCode:
 *         type: number
 *         example: 200
 *       message:
 *         type: string
 *         example: "Some success message"
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
 *         code:
 *           type: string
 *           example: C01
 *         description:
 *           type: string
 *           example: Active
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         code:
 *           type: string
 *           example: C01
 *         description:
 *           type: string
 *           example: ADMIN
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         description:
 *           type: string
 *           example: Question 1
 *         answer:
 *          type: boolean
 *          example: true
 *         newsId:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Auth:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsImlhdCI6MTcxNDQwOTk4MCwiZXhwIjoxNzE0NDk2MzgwfQ.tD74QpcBcOT4Ti17pgMMUy3h0mHXPNimyxblA7HnNn4
 *         user:
 *           type: object
 *           example:  { "name": "UserName", "picture": null}
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
 *         closedBy:
 *          type: number
 *          example: 1
 *         createdOn:
 *          type: date
 *          example: 2020-04-04
 *         closedOn:
 *          type: date
 *          example: 2024-02-20
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     NewsStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         description:
 *           type: string
 *           example: NEWS status description
 *         code:
 *          type: string
 *          example: C01, C02, C03 etc...
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         note:
 *           type: string
 *           example: Note description
 *         document:
 *           type: string
 *           example: https://res.cloudinary.com/dizfi5qoy/image/upload/v1714082489/xxugyy1gdfdkqazohbr1yo.png
 *         statusId:
 *          type: number
 *          example: 1
 *         createdBy:
 *          type: number
 *          example: 1
 *         closedBy:
 *          type: number
 *          example: 1
 *         createdOn:
 *          type: date
 *          example: 2020-04-04
 *         closedOn:
 *          type: date
 *          example: 2024-02-20
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     NoteBody:
 *       type: object
 *       properties:
 *         note:
 *           type: string
 *           example: Note description
 *         document:
 *           type: string
 *           format: binary
 *         statusId:
 *          type: number
 *          example: 1
 *         createdBy:
 *          type: number
 *          example: 1
 *         closedBy:
 *          type: number
 *          example: 1
 *         createdOn:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2020-04-04
 *         closedOn:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2024-09-09
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
 *         closedBy:
 *          type: number
 *          example: 1
 *         createdOn:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2020-04-04
 *         closedOn:
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
 *         code:
 *           type: string
 *           example: CO1
 *         description:
 *           type: string
 *           example: Active
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     RoleBody:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: CO1
 *         description:
 *           type: string
 *           example: ADMIN
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     AuthBodySignUp:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         name:
 *           type: string
 *         lastName:
 *           type: string
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     AuthBody:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "userName"
 *         picture:
 *           type: string
 *           example:  https://res.cloudinary.com/dizfi5qoy/image/upload/v1714082489/xxugyy1gdfdkqazohbr1yo.png
 *         role:
 *           type: boolean
 *           example: true
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     RefreshToken:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "userName"
 *         picture:
 *           type: string
 *           example:  https://res.cloudinary.com/dizfi5qoy/image/upload/v1714082489/xxugyy1gdfdkqazohbr1yo.png
 *         role:
 *           type: boolean
 *           example: true
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     QuestionBody:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           example: Question 1
 *         answer:
 *          type: boolean
 *          example: true
 *         newsId:
 *           type: integer
 *           example: 1
 *
 */

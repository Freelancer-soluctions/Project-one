/** --------------------------------------
 * Sección Global
 * -------------------------------------- */
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
 *     Unauthorized:
 *       type: object
 *       properties:
 *        message:
 *          type: string
 *          example: "Unauthorized"
 *
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Delete:
 *       type: object
 *       properties:
 *         error:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: integer
 *           example: 200
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Item deleted successfully"
 */

/** --------------------------------------
 * Sección de Autenticación
 * -------------------------------------- */
/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/** --------------------------------------
 * Sección de Events
 * -------------------------------------- */

/**
 * @openapi
 * components:
 *   schemas:
 *     ResponseCreateUpdate:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             title:
 *               type: string
 *               maxLength: 50
 *               example: "Conference on AI"
 *             description:
 *               type: string
 *               maxLength: 200
 *               example: "A detailed discussion on the future of AI"
 *             speaker:
 *               type: string
 *               maxLength: 20
 *               nullable: true
 *               example: "John Doe"
 *             startTime:
 *               type: string
 *               maxLength: 5
 *               example: "09:00"
 *             endTime:
 *               type: string
 *               maxLength: 5
 *               example: "11:00"
 *             eventDate:
 *               type: string
 *               format: date-time
 *               example: "2025-06-15T00:00:00Z"
 *             createdBy:
 *               type: integer
 *               example: 5
 *             createdOn:
 *               type: string
 *               format: date-time
 *               example: "2025-03-10T14:30:00Z"
 *             updatedOn:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               example: "2025-03-15T18:00:00Z"
 *             eventTypeId:
 *               type: integer
 *               example: 2
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     GetEventsTypes:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         description:
 *           type: string
 *           example: "Event type description"
 *         code:
 *           type: string
 *           example: "C01"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ResponseGetEvents:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Tech Conference 2025"
 *         description:
 *           type: string
 *           example: "An annual conference about emerging technologies."
 *         speaker:
 *           type: string
 *           nullable: true
 *           example: "John Doe"
 *         startTime:
 *           type: string
 *           example: "10:00"
 *         endTime:
 *           type: string
 *           example: "12:00"
 *         eventDate:
 *           type: string
 *           format: date-time
 *           example: "2025-06-15T00:00:00Z"
 *         createdBy:
 *           type: integer
 *           example: 123
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T08:00:00Z"
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-02-01T10:30:00Z"
 *         eventTypeId:
 *           type: integer
 *           example: 2
 *         eventTypeCode:
 *           type: string
 *           example: "TECH"
 *         eventTypeDescription:
 *           type: string
 *           example: "Eventos relacionados con tecnología"
 *         userEventCreatedName:
 *           type: string
 *           example: "Admin"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     BodyEventCreateUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 50
 *           example: "Tech Conference 2025"
 *         description:
 *           type: string
 *           maxLength: 200
 *           example: "An annual conference about emerging technologies."
 *         speaker:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           example: "John Doe"
 *         startTime:
 *           type: string
 *           maxLength: 5
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           maxLength: 5
 *           example: "17:00"
 *         eventDate:
 *           type: string
 *           format: date-time
 *           example: "2025-06-15T14:30:00Z"
 *           description: "Expected ISO-8601 DateTime (YYYY-MM-DDTHH:MM:SSZ)."
 *         type:
 *           type: integer
 *           format: int32
 *           example: 1
 */

/** --------------------------------------
 * Sección de News
 * -------------------------------------- */

/**
 * @openapi
 * components:
 *   schemas:
 *     NewsFilters:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 30
 *           nullable: true
 *           example: "test1"
 *         statusCode:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           nullable: true
 *           example: "C01"
 *         fromDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-08-05T00:00:00Z"
 *         toDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-08-05T00:00:00Z"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ResponseGetNews:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         closedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-08-05T00:19:58.867Z"
 *         pendingOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         description:
 *           type: string
 *           example: "test1"
 *         document:
 *           type: string
 *           example: ""
 *         documentId:
 *           type: string
 *           nullable: true
 *           example: null
 *         statusId:
 *           type: integer
 *           example: 1
 *         closedBy:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         pendingBy:
 *           type: integer
 *           nullable: true
 *           example: null
 *         createdBy:
 *           type: integer
 *           example: 1
 *         status:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             code:
 *               type: string
 *               example: "C01"
 *             description:
 *               type: string
 *               example: "ACTIVE"
 *         userNewsCreated:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Admin"
 *         userNewsClosed:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Admin"
 *         userNewsPending:
 *           type: object
 *           nullable: true
 *           example: null
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     BodyNewsCreate:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 400
 *           example: "Noticia de última hora"
 *         statusId:
 *           type: integer
 *           example: 1
 *         statusCode:
 *           type: string
 *           maxLength: 3
 *           example: "ACTIVE"
 *         document:
 *           type: string
 *           nullable: true
 *           example: "Base 64"
 *       required:
 *         - description
 *         - statusId
 *         - statusCode
 *
 *     ResponseNewsCreate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 123
 *         description:
 *           type: string
 *           example: "Noticia creada exitosamente"
 *         createdBy:
 *           type: integer
 *           example: 1
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2025-03-09T12:00:00Z"
 *         document:
 *           type: string
 *           nullable: true
 *           example: "URL del documento"
 *         statusId:
 *           type: integer
 *           example: 1
 *         closedBy:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         closedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example:  "2025-03-09T12:00:00Z"
 *         pendingBy:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         pendingOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example:  "2025-03-09T12:00:00Z"
 *         documentId:
 *           type: string
 *           nullable: true
 *           example: null
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
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "C01"
 *         description:
 *           type: string
 *           maxLength: 10
 *           example: "ACTIVE"
 *     NewsStatusArray:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/NewsStatus"
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
 *     Save:
 *      type: object
 *      properties:
 *       error:
 *         type: boolean
 *         example: false
 *       message:
 *         type: string
 *         example: "Item save successfully"
 *
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     getStatus:
 *       type: object
 *       properties:
 *         error:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: number
 *           example: 200
 *         message:
 *           type: string
 *           example: "Some success message"
 *         data:
 *           $ref: "#/components/schemas/EventsTypes"
 */

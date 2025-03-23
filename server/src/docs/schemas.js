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
 *     ResponseEventCreateUpdate:
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
 *     ResponseNewsCreateUpdate:
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
 *           example: "Documento adjunto en base64"
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
 *     NewsUpdate:
 *       type: object
 *       required:
 *         - description
 *         - statusId
 *         - statusCode
 *       properties:
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 400
 *           example: "Noticia creada exitosamente"
 *         statusId:
 *           type: integer
 *           example: 1
 *         statusCode:
 *           type: string
 *           maxLength: 3
 *           example: "C01"
 *         document:
 *           type: string
 *           nullable: true
 *           example: "Documento adjunto en base64"
 */

/** --------------------------------------
 * Sección de Providers
 * -------------------------------------- */
/**
 * @openapi
 * components:
 *   schemas:
 *     ProvidersFilters:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 80
 *           nullable: true
 *           example: "Proveedor ABC"
 *         status:
 *           type: boolean
 *           nullable: true
 *           example: true
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ResponseGetProductProvider:
 *       type: object
 *       required:
 *         - id
 *         - code
 *         - name
 *         - createdOn
 *         - createdBy
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "P01"
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Proveedor ABC"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-08-05T00:19:58.867Z"
 *         createdBy:
 *           type: integer
 *           example: 5
 *         updatedBy:
 *           type: integer
 *           nullable: true
 *           example: null
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         status:
 *           type: boolean
 *           example: true
 *         contactName:
 *           type: string
 *           maxLength: 60
 *           nullable: true
 *           example: "Juan Pérez"
 *         contactEmail:
 *           type: string
 *           format: email
 *           maxLength: 80
 *           nullable: true
 *           example: "contacto@proveedor.com"
 *         contactPhone:
 *           type: string
 *           maxLength: 15
 *           nullable: true
 *           example: "+123456789"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Av. Principal 123, Ciudad"
 *         userProductCreatedName:
 *           type: string
 *           nullable: true
 *           example: "Admin"
 *         userProductUpdatedName:
 *           type: string
 *           nullable: true
 *           example: "Editor"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     BodyProviderCreateUpdate:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - status
 *       properties:
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "C01"
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Proveedor ABC"
 *         status:
 *           type: boolean
 *           example: true
 *         contactName:
 *           type: string
 *           maxLength: 60
 *           nullable: true
 *           example: "Juan Pérez"
 *         contactEmail:
 *           type: string
 *           maxLength: 80
 *           nullable: true
 *           example: "contacto@proveedor.com"
 *         contactPhone:
 *           type: string
 *           maxLength: 15
 *           nullable: true
 *           example: "+123456789"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Av. Principal 123, Ciudad"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ResponseProviderCreateUpdate:
 *       type: object
 *       required:
 *         - id
 *         - code
 *         - name
 *         - createdOn
 *         - createdBy
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "P01"
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Proveedor ABC"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-08-05T00:19:58.867Z"
 *         createdBy:
 *           type: integer
 *           example: 5
 *         updatedBy:
 *           type: integer
 *           nullable: true
 *           example: null
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         status:
 *           type: boolean
 *           example: true
 *         contactName:
 *           type: string
 *           maxLength: 60
 *           nullable: true
 *           example: "Juan Pérez"
 *         contactEmail:
 *           type: string
 *           format: email
 *           maxLength: 80
 *           nullable: true
 *           example: "contacto@proveedor.com"
 *         contactPhone:
 *           type: string
 *           maxLength: 15
 *           nullable: true
 *           example: "+123456789"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Av. Principal 123, Ciudad"
 *         products:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Product"
 */

/** --------------------------------------
 * Sección de settings
 * -------------------------------------- */

/**
 * @swagger
 * components:
 *   schemas:
 *     BodyProductCategoryCreate:
 *       type: object
 *       required:
 *         - description
 *         - code
 *       properties:
 *         description:
 *           type: string
 *           maxLength: 50
 *           description: Description of the product category
 *         code:
 *           type: string
 *           maxLength: 3
 *           description: Code of the product category
 *
 *     BodyProductCategoryUpdate:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           maxLength: 50
 *           description: Description of the product category
 *         code:
 *           type: string
 *           maxLength: 3
 *           description: Code of the product category
 *
 *     ProductCategoryFilters:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           maxLength: 50
 *           nullable: true
 *           description: Name to filter categories by
 *         code:
 *           type: string
 *           maxLength: 3
 *           nullable: true
 *           description: Code to filter categories by

 *
 *     ResponseGetProductCategories:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Category ID
 *         code:
 *           type: string
 *           maxLength: 3
 *           description: Category unique code
 *         description:
 *           type: string
 *           maxLength: 50
 *           description: Category description
 *         createdOn:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           description: Last update date

 *
 *     ResponseProductCategoryCreateUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Category ID
 *         code:
 *           type: string
 *           maxLength: 3
 *           description: Category unique code
 *         description:
 *           type: string
 *           maxLength: 50
 *           description: Category description
 *         status:
 *           type: boolean
 *           description: Category status
 *         createdOn:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           description: Last update date
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Settings:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *           description: Unique identifier for the settings
 *         displayEvents:
 *           type: boolean
 *           default: false
 *           description: Toggle for events display
 *         displayNotes:
 *           type: boolean
 *           default: false
 *           description: Toggle for notes display
 *         displayNews:
 *           type: boolean
 *           default: false
 *           description: Toggle for news display
 *         displayProfile:
 *           type: boolean
 *           default: false
 *           description: Toggle for profile display
 *         displayLanguage:
 *           type: boolean
 *           default: false
 *           description: Toggle for language display
 *         displayReports:
 *           type: boolean
 *           default: false
 *           description: Toggle for reports display
 *         displayPayroll:
 *           type: boolean
 *           default: false
 *           description: Toggle for payroll display
 *         displayStock:
 *           type: boolean
 *           default: false
 *           description: Toggle for stock display
 *         language:
 *           type: string
 *           maxLength: 2
 *           example: "en"
 *           description: Language code (e.g., en, es)
 *         userId:
 *           type: integer
 *           description: ID of the user who owns these settings
 *         createdOn:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Last update timestamp
 *
 *     SettingsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           $ref: "#/components/schemas/Settings"
 *
 *     SettingsUpdate:
 *       type: object
 *       required:
 *         - language
 *       properties:
 *         displayEvents:
 *           type: boolean
 *         displayNotes:
 *           type: boolean
 *         displayNews:
 *           type: boolean
 *         displayProfile:
 *           type: boolean
 *         displayLanguage:
 *           type: boolean
 *         displayReports:
 *           type: boolean
 *         displayPayroll:
 *           type: boolean
 *         language:
 *           type: string
 *           maxLength: 2
 *           example: "en"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SettingsLanguage:
 *       type: object
 *       required:
 *         - language
 *       properties:
 *         language:
 *           type: string
 *           maxLength: 2
 *           example: "en"
 *         id:
 *           type: integer
 *           example: 1
 *           description: Unique identifier for the settings
 *
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SettingsDisplay:
 *       type: object
 *       required:
 *         - displayEvents
 *         - displayNotes
 *         - displayNews
 *         - displayProfile
 *         - displayLanguage
 *         - displayReports
 *         - displayPayroll
 *         - displayStock
 *       properties:
 *         displayEvents:
 *           type: boolean
 *         displayNotes:
 *           type: boolean
 *         displayNews:
 *           type: boolean
 *         displayProfile:
 *           type: boolean
 *         displayLanguage:
 *           type: boolean
 *         displayReports:
 *           type: boolean
 *         displayPayroll:
 *           type: boolean
 *         displayStock:
 *           type: boolean
 *         id:
 *           type: integer
 *           example: 1
 *           description: Unique identifier for the settings
 */

/** --------------------------------------
 * Sección de Warehouse
 * -------------------------------------- */

/**
 * @swagger
 * components:
 *   schemas:
 *     WarehouseFilters:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 50
 *           nullable: true
 *           example: "Main Warehouse"
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *           nullable: true
 *           example: "ACTIVE"
 *
 *     ResponseGetWarehouse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           maxLength: 50
 *           example: "Main Warehouse"
 *         description:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Main storage facility"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "123 Storage St."
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *           example: "ACTIVE"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-03-15T10:30:00Z"
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-03-17T10:30:00Z"
 *
 *     BodyWarehouseCreate:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 50
 *           example: "Main Warehouse"
 *         description:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Main storage facility"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "123 Storage St."
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *           example: "ACTIVE"
 *
 *     BodyWarehouseUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 50
 *           example: "Main Warehouse"
 *         description:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Main storage facility"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "123 Storage St."
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *           example: "ACTIVE"
 *
 *     ResponseWarehouseCreate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           maxLength: 50
 *           example: "Main Warehouse"
 *         description:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Main storage facility"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "123 Storage St."
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *           example: "ACTIVE"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-03-15T10:30:00Z"
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *
 *
 *     ResponseWarehouseUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           maxLength: 50
 *           example: "Main Warehouse"
 *         description:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "Main storage facility"
 *         address:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: "123 Storage St."
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *           example: "ACTIVE"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-03-15T10:30:00Z"
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-03-17T10:30:00Z"
 */

/** --------------------------------------
 * Sección de Stock
 * -------------------------------------- */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseGetStock:
 *       type: object
 *       required:
 *         - quantity
 *         - minimum
 *         - unitMeasure
 *         - productId
 *         - warehouseId
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del registro de stock
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           description: Cantidad de stock
 *         minimum:
 *           type: integer
 *           minimum: 0
 *           description: Cantidad mínima de stock
 *         maximum:
 *           type: integer
 *           minimum: 0
 *           description: Cantidad máxima de stock
 *         lot:
 *           type: string
 *           maxLength: 50
 *           description: Número de lote
 *         unitMeasure:
 *           type: string
 *           enum: [PIECES, KILOGRAMS, LITERS, METERS]
 *           description: Unidad de medida
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración
 *         productId:
 *           type: integer
 *           description: ID del producto
 *         warehouseId:
 *           type: integer
 *           description: ID del almacén
 *         createdOn:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           description: Fecha de actualización
 *         createdBy:
 *           type: integer
 *           description: ID del usuario que creó el registro
 *         updatedBy:
 *           type: integer
 *           description: ID del usuario que actualizó el registro
 *
 *     StockFilters:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: ID del producto para filtrar
 *         warehouseId:
 *           type: string
 *           description: ID del almacén para filtrar
 *         lot:
 *           type: string
 *           maxLength: 50
 *           description: Número de lote para filtrar
 *         unitMeasure:
 *           type: string
 *           enum: [PIECES, KILOGRAMS, LITERS, METERS]
 *           description: Unidad de medida para filtrar
 *         stocksExpirated:
 *           type: boolean
 *           description: Mostrar productos vencidos
 *         stocksLow:
 *           type: boolean
 *           description: Mostrar productos con stock bajo
 *
 *     ResponseStockCreateUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del registro de stock
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           description: Cantidad de stock
 *         minimum:
 *           type: integer
 *           minimum: 0
 *           description: Cantidad mínima de stock
 *         maximum:
 *           type: integer
 *           minimum: 0
 *           description: Cantidad máxima de stock
 *         lot:
 *           type: string
 *           maxLength: 50
 *           description: Número de lote
 *         unitMeasure:
 *           type: string
 *           enum: [PIECES, KILOGRAMS, LITERS, METERS]
 *           description: Unidad de medida
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración
 *         productId:
 *           type: integer
 *           description: ID del producto
 *         warehouseId:
 *           type: integer
 *           description: ID del almacén
 *         createdOn:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           description: Fecha de actualización
 *         createdBy:
 *           type: integer
 *           description: ID del usuario que creó el registro
 *         updatedBy:
 *           type: integer
 *           description: ID del usuario que actualizó el registro
 *
 *     BodyStockCreateUpdate:
 *       type: object
 *       required:
 *         - quantity
 *         - minimum
 *         - unitMeasure
 *         - productId
 *         - warehouseId
 *       properties:
 *         quantity:
 *           type: integer
 *           description: Cantidad de stock
 *         minimum:
 *           type: integer
 *           description: Cantidad mínima de stock
 *         maximum:
 *           type: integer
 *           description: Cantidad máxima de stock
 *         lot:
 *           type: string
 *           description: Número de lote
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración
 *         productId:
 *           type: integer
 *           description: ID del producto
 *         warehouseId:
 *           type: integer
 *           description: ID del almacén
 *         unitMeasure:
 *           type: string
 *           enum: [PIECES, KILOGRAMS, LITERS, METERS]
 *           description: Unidad de medida
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseGetStockAlerts:
 *       type: object
 *       properties:
 *         expired:
 *           type: integer
 *           description: Cantidad de productos vencidos
 *         lowStock:
 *           type: integer
 *           description: Cantidad de productos con stock bajo
 */

/** --------------------------------------
 * Sección de Inventory Movement
 * -------------------------------------- */
/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         cost:
 *           type: number
 *         description:
 *           type: string
 *         barCode:
 *           type: string
 *         productCategoryId:
 *           type: integer
 *         productProviderId:
 *           type: integer
 *         productStatusId:
 *           type: integer
 *         createdOn:
 *           type: string
 *           format: date-time
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     Warehouse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *         createdOn:
 *           type: string
 *           format: date-time
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     InventoryMovementFilters:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *           description: Filter by product ID
 *         warehouseId:
 *           type: integer
 *           description: Filter by warehouse ID
 *         type:
 *           type: string
 *           enum: [ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT]
 *           description: Filter by movement type
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Filter by start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Filter by end date
 *
 *     BodyInventoryMovementCreate:
 *       type: object
 *       required:
 *         - productId
 *         - warehouseId
 *         - quantity
 *         - type
 *       properties:
 *         productId:
 *           type: integer
 *           description: ID of the product
 *         warehouseId:
 *           type: integer
 *           description: ID of the warehouse
 *         quantity:
 *           type: integer
 *           description: Quantity of the movement
 *         type:
 *           type: string
 *           enum: [ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT]
 *           description: Type of movement
 *         reason:
 *           type: string
 *           maxLength: 200
 *           description: Reason for the movement
 *         purchaseId:
 *           type: integer
 *           description: ID of the related purchase (optional)
 *         saleId:
 *           type: integer
 *           description: ID of the related sale (optional)
 *
 *     BodyInventoryMovementUpdate:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *           description: ID of the product
 *         warehouseId:
 *           type: integer
 *           description: ID of the warehouse
 *         quantity:
 *           type: integer
 *           description: Quantity of the movement
 *         type:
 *           type: string
 *           enum: [ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT]
 *           description: Type of movement
 *         reason:
 *           type: string
 *           maxLength: 200
 *           description: Reason for the movement
 *         purchaseId:
 *           type: integer
 *           description: ID of the related purchase (optional)
 *         saleId:
 *           type: integer
 *           description: ID of the related sale (optional)
 *
 *     ResponseGetInventoryMovement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productId:
 *           type: integer
 *         warehouseId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT]
 *         reason:
 *           type: string
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         updatedBy:
 *           type: integer
 *           nullable: true
 *         purchaseId:
 *           type: integer
 *           nullable: true
 *         saleId:
 *           type: integer
 *           nullable: true
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         warehouse:
 *           $ref: '#/components/schemas/Warehouse'
 *
 *     ResponseInventoryMovementCreate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productId:
 *           type: integer
 *         warehouseId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT]
 *         reason:
 *           type: string
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         warehouse:
 *           $ref: '#/components/schemas/Warehouse'
 *
 *     ResponseInventoryMovementUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productId:
 *           type: integer
 *         warehouseId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [ENTRY, EXIT, TRANSFERENCE, ADJUSTMENT]
 *         reason:
 *           type: string
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         updatedOn:
 *           type: string
 *           format: date-time
 *         updatedBy:
 *           type: integer
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         warehouse:
 *           $ref: '#/components/schemas/Warehouse'
 */

/** --------------------------------------
 * Sección de Purchase
 * -------------------------------------- */
/**
 * @openapi
 * components:
 *   schemas:
 *     PurchaseFilters:
 *       type: object
 *       properties:
 *         providerId:
 *           type: integer
 *           description: Filter by provider ID
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Filter by start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Filter by end date
 *         minTotal:
 *           type: number
 *           minimum: 0
 *           description: Filter by minimum total
 *         maxTotal:
 *           type: number
 *           minimum: 0
 *           description: Filter by maximum total
 *
 *     PurchaseDetail:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *         - price
 *       properties:
 *         productId:
 *           type: integer
 *           description: ID of the product
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Price per unit
 *
 *     BodyPurchaseCreate:
 *       type: object
 *       required:
 *         - providerId
 *         - total
 *         - details
 *       properties:
 *         providerId:
 *           type: integer
 *           description: ID of the provider
 *         total:
 *           type: number
 *           minimum: 0
 *           description: Total amount of the purchase
 *         details:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseDetail'
 *           minItems: 1
 *           description: List of purchase details
 *
 *     ResponseGetPurchase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         providerId:
 *           type: integer
 *         total:
 *           type: number
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         updatedBy:
 *           type: integer
 *           nullable: true
 *         provider:
 *           $ref: '#/components/schemas/ProductProvider'
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *
 *     ResponsePurchaseCreate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         providerId:
 *           type: integer
 *         total:
 *           type: number
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         provider:
 *           $ref: '#/components/schemas/ProductProvider'
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *
 *     ResponsePurchaseUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         providerId:
 *           type: integer
 *         total:
 *           type: number
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         updatedOn:
 *           type: string
 *           format: date-time
 *         updatedBy:
 *           type: integer
 *         provider:
 *           $ref: '#/components/schemas/ProductProvider'
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               product:
 *                 $ref: '#/components/schemas/Product'
 */

/** --------------------------------------
 * Sección de Clients
 * -------------------------------------- */
/**
 * @openapi
 * components:
 *   schemas:
 *     ClientFilters:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           maxLength: 15
 *           nullable: true
 *           example: "+1234567890"
 *
 *     ResponseGetClient:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           maxLength: 15
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           maxLength: 120
 *           example: "123 Main St"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-03-15T10:30:00Z"
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-03-17T10:30:00Z"
 *         createdBy:
 *           type: integer
 *           example: 1
 *         updatedBy:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         userClientCreatedName:
 *           type: string
 *           example: "Admin"
 *         userClientUpdatedName:
 *           type: string
 *           nullable: true
 *           example: "Editor"
 *
 *     BodyClientCreate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - address
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           maxLength: 15
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           maxLength: 120
 *           example: "123 Main St"
 *
 *     BodyClientUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           maxLength: 15
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           maxLength: 120
 *           example: "123 Main St"
 *
 *     ResponseClientCreate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           maxLength: 15
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           maxLength: 120
 *           example: "123 Main St"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-03-15T10:30:00Z"
 *         createdBy:
 *           type: integer
 *           example: 1
 *         userClientCreatedName:
 *           type: string
 *           example: "Admin"
 *
 *     ResponseClientUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           maxLength: 15
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           maxLength: 120
 *           example: "123 Main St"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-03-15T10:30:00Z"
 *         createdBy:
 *           type: integer
 *           example: 1
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           example: "2024-03-17T10:30:00Z"
 *         updatedBy:
 *           type: integer
 *           example: 1
 *         userClientCreatedName:
 *           type: string
 *           example: "Admin"
 *         userClientUpdatedName:
 *           type: string
 *           example: "Editor"
 */

/** --------------------------------------
 * Sección de Sale
 * -------------------------------------- */
/**
 * @openapi
 * components:
 *   schemas:
 *     SaleFilters:
 *       type: object
 *       properties:
 *         clientId:
 *           type: integer
 *           description: Filter by client ID
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Filter by start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Filter by end date
 *         minTotal:
 *           type: number
 *           minimum: 0
 *           description: Filter by minimum total
 *         maxTotal:
 *           type: number
 *           minimum: 0
 *           description: Filter by maximum total
 *
 *     SaleDetail:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *         - price
 *       properties:
 *         productId:
 *           type: integer
 *           description: ID of the product
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Price per unit
 *
 *     BodySaleCreate:
 *       type: object
 *       required:
 *         - clientId
 *         - total
 *         - details
 *       properties:
 *         clientId:
 *           type: integer
 *           description: ID of the client
 *         total:
 *           type: number
 *           minimum: 0
 *           description: Total amount of the sale
 *         details:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SaleDetail'
 *           minItems: 1
 *           description: List of sale details
 *
 *     ResponseGetSale:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         clientId:
 *           type: integer
 *         total:
 *           type: number
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         updatedBy:
 *           type: integer
 *           nullable: true
 *         client:
 *           $ref: '#/components/schemas/ResponseGetClient'
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *
 *     ResponseSaleCreate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         clientId:
 *           type: integer
 *         total:
 *           type: number
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         client:
 *           $ref: '#/components/schemas/ResponseGetClient'
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *
 *     ResponseSaleUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         clientId:
 *           type: integer
 *         total:
 *           type: number
 *         createdOn:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: integer
 *         updatedOn:
 *           type: string
 *           format: date-time
 *         updatedBy:
 *           type: integer
 *         client:
 *           $ref: '#/components/schemas/ResponseGetClient'
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               product:
 *                 $ref: '#/components/schemas/Product'
 */

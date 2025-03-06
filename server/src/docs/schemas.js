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

/**
 * @openapi
 * components:
 *   schemas:
 *     UserSettingLanguage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         language:
 *           type: string
 *           example: "en"
 *           description: The language code for the user's settings (e.g., "EN" for English, "ES" for Spanish).
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     createOrUpdateSettingLanguage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         language:
 *           type: string
 *           example: 'en'
 *         userId:
 *           type: integer
 *           example: 101
 *       required:
 *         - language
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     EventBody:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: some random string
 *         description:
 *           type: string
 *           example: some random string
 *         speaker:
 *           type: string
 *           example: random name string
 *         startTime:
 *           type: string
 *           example: 00:00
 *         endTime:
 *           type: string
 *           example: 00:00
 *         createdBy:
 *          type: number
 *          example: 1
 *         createdOn:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2020-04-04
 *         updatedOn:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2024-09-09
 *         eventdate:
 *          type: date
 *          pattern: '^\d{4}-\d{2}-\d{2}$'
 *          example: 2024-09-09
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     EventsTypes:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         description:
 *           type: string
 *           example: Eevent type description
 *         code:
 *          type: string
 *          example: C01, C02, C03 etc...
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     notesCount:
 *       type: object
 *       properties:
 *         low:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         medium:
 *           type: integer
 *           example: 1, 2, 3, 4 etc...
 *         high:
 *          type: integer
 *           example: 1, 2, 3, 4 etc...
 */

/**
 * @openapi
/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         sku:
 *           type: string
 *           maxLength: 16
 *           example: "ABC123456789"
 *         name:
 *           type: string
 *           maxLength: 80
 *           example: "Producto Ejemplo"
 *         productCategoryId:
 *           type: integer
 *           example: 1
 *         productTypeId:
 *           type: integer
 *           example: 2
 *         price:
 *           type: number
 *           format: decimal
 *           example: 99.99
 *         cost:
 *           type: number
 *           format: decimal
 *           example: 50.00
 *         stock:
 *           type: integer
 *           example: 100
 *         description:
 *           type: string
 *           maxLength: 2000
 *           example: "Descripción del producto"
 *         productStatusId:
 *           type: integer
 *           example: 1
 *         barCode:
 *           type: string
 *           maxLength: 25
 *           nullable: true
 *           example: "123456789012"
 *         createdBy:
 *           type: integer
 *           example: 1
 *         createdOn:
 *           type: string
 *           format: date-time
 *           example: "2024-02-26T12:00:00Z"
 *         updatedBy:
 *           type: integer
 *           example: 2
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-02-27T15:30:00Z"
 *
 *     ProductCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "ELE"
 *         description:
 *           type: string
 *           maxLength: 10
 *           example: "Electrónica"
 *
 *     ProductProvider:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "KIT"
 *         description:
 *           type: string
 *           maxLength: 10
 *           example: "Kit"
 *
 *     ProductStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "ACT"
 *         description:
 *           type: string
 *           maxLength: 10
 *           example: "Activo"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "ACT"
 *         description:
 *           type: string
 *           maxLength: 10
 *           example: "Activo"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "ELE"
 *         description:
 *           type: string
 *           maxLength: 10
 *           example: "Electrónica"
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductProvider:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           maxLength: 3
 *           example: "KIT"
 *         description:
 *           type: string
 *           maxLength: 10
 *           example: "Kit"
 */

/**
 * @openapi
 * components:
*   schemas:
*     ProductCreate:
*       type: object
*       required:
*         - sku
*         - name
*         - productCategoryId
*         - productTypeId
*         - price
*         - cost
*         - stock
*         - description
*         - productStatusId
*         - createdBy
*       properties:
*         sku:
*           type: string
*           maxLength: 16
*           example: "PROD123456789"
*         name:
*           type: string
*           maxLength: 80
*           example: "Laptop Dell XPS 15"
*         productCategoryId:
*           type: integer
*           example: 1
*         productTypeId:
*           type: integer
*           example: 2
*         price:
*           type: number
*           format: decimal
*           example: 999.99
*         cost:
*           type: number
*           format: decimal
*           example: 750.50
*         stock:
*           type: integer
*           example: 100
*         description:
*           type: string
*           maxLength: 2000
*           example: "Laptop de alta gama con procesador Intel i7 y 16GB RAM."
*         productStatusId:
*           type: integer
*           example: 1
*         barCode:
*           type: string
*           maxLength: 25
*           nullable: true
*           example: "1234567890123"
*         createdBy:
*           type: integer
*           example: 5
 */

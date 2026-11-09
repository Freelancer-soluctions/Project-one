/**
 * Schemas OpenAPI que faltaban (change `ci-shifting-left`).
 *
 * Las rutas de `attendance`, `employees`, `performanceEvaluation`, `clients`,
 * `expenses`, `news`, `payroll`, `providers`, `purchase`, `sales`, `settings`,
 * `stock`, `users`, `vacation` y `events` referenciaban 28 schemas que nunca se
 * escribieron; Spectral los reportaba como `invalid-ref` y por eso el job
 * `api-contract` arrancó en modo advisory. Las formas de este archivo siguen
 * los schemas Joi de cada módulo (`*.joi.ts`) y las filas que devuelve el dao,
 * no una versión idealizada del contrato.
 */

/** --------------------------------------
 * Sección de RRHH: attendance, employees y performanceEvaluation
 * -------------------------------------- */

/**
 * @openapi
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         name: { type: string, maxLength: 100, example: "Ana" }
 *         lastName: { type: string, maxLength: 100, example: "Pérez" }
 *         dni: { type: string, maxLength: 128, example: "12345678" }
 *         phone: { type: string, maxLength: 15, nullable: true, example: "+5491122334455" }
 *         email: { type: string, format: email, example: "ana.perez@example.com" }
 *         address: { type: string, maxLength: 120, nullable: true, example: "Av. Siempre Viva 742" }
 *         startDate: { type: string, format: date-time, example: "2020-01-01T00:00:00Z" }
 *         position: { type: string, maxLength: 100, example: "Analista" }
 *         department: { type: string, maxLength: 100, example: "Operaciones" }
 *         salary:
 *           type: string
 *           maxLength: 128
 *           description: "Salario serializado por la columna VarChar(128), no un número."
 *           example: "2500.50"
 *         createdBy: { type: integer, example: 1 }
 *         createdOn: { type: string, format: date-time, example: "2024-03-15T10:30:00Z" }
 *         updatedBy: { type: integer, nullable: true, example: null }
 *         updatedOn: { type: string, format: date-time, nullable: true, example: null }
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     BodyAttendanceCreateUpdate:
 *       type: object
 *       required: [employeeId, date, entryTime, exitTime, workedHours]
 *       properties:
 *         employeeId: { type: integer, example: 1 }
 *         date: { type: string, format: date-time, example: "2024-08-05T00:00:00Z" }
 *         entryTime: { type: string, maxLength: 5, example: "09:00" }
 *         exitTime: { type: string, maxLength: 5, example: "17:00" }
 *         workedHours: { type: number, example: 8 }
 *
 *     BodyAttendanceUpdatePartial:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales, pero debe enviarse al menos uno."
 *       properties:
 *         employeeId: { type: integer, example: 1 }
 *         date: { type: string, format: date-time, example: "2024-08-05T00:00:00Z" }
 *         entryTime: { type: string, maxLength: 5, example: "09:00" }
 *         exitTime: { type: string, maxLength: 5, example: "17:00" }
 *         workedHours: { type: number, example: 8 }
 *
 *     ResponseGetAttendance:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         employeeId: { type: integer, example: 1 }
 *         date: { type: string, format: date-time, example: "2024-08-05T00:00:00Z" }
 *         entryTime: { type: string, example: "09:00" }
 *         exitTime: { type: string, example: "17:00" }
 *         workedHours:
 *           type: string
 *           description: "Decimal(18,2) serializado como string por el driver de Postgres."
 *           example: "8.00"
 *         createdOn: { type: string, format: date-time, example: "2024-08-05T09:00:00Z" }
 *         updatedOn: { type: string, format: date-time, nullable: true, example: null }
 *         createdBy: { type: integer, example: 1 }
 *         updatedBy: { type: integer, nullable: true, example: null }
 *         employeeName: { type: string, nullable: true, example: "Ana" }
 *         employeeLastName: { type: string, nullable: true, example: "Pérez" }
 *         userAttendanceCreatedName: { type: string, nullable: true, example: "Admin" }
 *         userAttendanceUpdatedName: { type: string, nullable: true, example: null }
 *
 *     ResponseAttendanceCreateUpdate:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         employeeId: { type: integer, example: 1 }
 *         date: { type: string, format: date-time, example: "2024-08-05T00:00:00Z" }
 *         entryTime: { type: string, example: "09:00" }
 *         exitTime: { type: string, example: "17:00" }
 *         workedHours: { type: string, example: "8.00" }
 *         createdOn: { type: string, format: date-time, example: "2024-08-05T09:00:00Z" }
 *         updatedOn: { type: string, format: date-time, nullable: true, example: null }
 *         createdBy: { type: integer, example: 1 }
 *         updatedBy: { type: integer, nullable: true, example: null }
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     EmployeeFilters:
 *       type: object
 *       properties:
 *         name: { type: string, maxLength: 100, example: "Ana" }
 *         lastName: { type: string, maxLength: 100, example: "Pérez" }
 *         dni: { type: string, maxLength: 10, example: "12345678" }
 *         email: { type: string, format: email, example: "ana.perez@example.com" }
 *         department: { type: string, maxLength: 100, example: "Operaciones" }
 *         position: { type: string, maxLength: 100, example: "Analista" }
 *         limit: { type: integer, minimum: 1, example: 20 }
 *         page: { type: integer, minimum: 1, example: 1 }
 *
 *     ResponseGetEmployee:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         name: { type: string, maxLength: 100, example: "Ana" }
 *         lastName: { type: string, maxLength: 100, example: "Pérez" }
 *         dni: { type: string, maxLength: 128, example: "12345678" }
 *         phone: { type: string, maxLength: 15, nullable: true, example: null }
 *         email: { type: string, format: email, example: "ana.perez@example.com" }
 *         address: { type: string, maxLength: 120, nullable: true, example: null }
 *         startDate: { type: string, format: date-time, example: "2020-01-01T00:00:00Z" }
 *         position: { type: string, maxLength: 100, example: "Analista" }
 *         department: { type: string, maxLength: 100, example: "Operaciones" }
 *         salary: { type: string, maxLength: 128, example: "2500.50" }
 *         createdBy: { type: integer, example: 1 }
 *         createdOn: { type: string, format: date-time, example: "2024-03-15T10:30:00Z" }
 *         updatedBy: { type: integer, nullable: true, example: null }
 *         updatedOn: { type: string, format: date-time, nullable: true, example: null }
 *         userEmployeeCreatedName: { type: string, nullable: true, example: "Admin" }
 *         userEmployeeUpdatedName: { type: string, nullable: true, example: null }
 *
 *     BodyEmployeeCreate:
 *       type: object
 *       required: [name, lastName, dni, email, startDate, position, department, salary]
 *       properties:
 *         name: { type: string, maxLength: 100, example: "Ana" }
 *         lastName: { type: string, maxLength: 100, example: "Pérez" }
 *         dni: { type: string, maxLength: 10, example: "12345678" }
 *         email: { type: string, format: email, example: "ana.perez@example.com" }
 *         phone: { type: string, maxLength: 15, example: "+5491122334455" }
 *         address: { type: string, maxLength: 120, example: "Av. Siempre Viva 742" }
 *         startDate: { type: string, format: date-time, example: "2020-01-01T00:00:00Z" }
 *         position: { type: string, maxLength: 100, example: "Analista" }
 *         department: { type: string, maxLength: 100, example: "Operaciones" }
 *         salary: { type: number, minimum: 0, example: 2500.5 }
 *
 *     BodyEmployeeUpdate:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales."
 *       properties:
 *         name: { type: string, maxLength: 100, minLength: 1, example: "Ana" }
 *         lastName: { type: string, maxLength: 100, minLength: 1, example: "Pérez" }
 *         dni: { type: string, maxLength: 10, minLength: 1, example: "12345678" }
 *         email: { type: string, format: email, example: "ana.perez@example.com" }
 *         phone: { type: string, maxLength: 15, example: "+5491122334455" }
 *         address: { type: string, maxLength: 120, example: "Av. Siempre Viva 742" }
 *         startDate: { type: string, format: date-time, example: "2020-01-01T00:00:00Z" }
 *         position: { type: string, maxLength: 100, minLength: 1, example: "Analista" }
 *         department: { type: string, maxLength: 100, minLength: 1, example: "Operaciones" }
 *         salary: { type: number, minimum: 0, example: 2500.5 }
 *
 *     ResponseEmployeeCreateUpdate:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         name: { type: string, example: "Ana" }
 *         lastName: { type: string, example: "Pérez" }
 *         dni: { type: string, example: "12345678" }
 *         phone: { type: string, nullable: true, example: null }
 *         email: { type: string, format: email, example: "ana.perez@example.com" }
 *         address: { type: string, nullable: true, example: null }
 *         startDate: { type: string, format: date-time, example: "2020-01-01T00:00:00Z" }
 *         position: { type: string, example: "Analista" }
 *         department: { type: string, example: "Operaciones" }
 *         salary: { type: string, example: "2500.50" }
 *         createdBy: { type: integer, example: 1 }
 *         createdOn: { type: string, format: date-time, example: "2024-03-15T10:30:00Z" }
 *         updatedBy: { type: integer, nullable: true, example: null }
 *         updatedOn: { type: string, format: date-time, nullable: true, example: null }
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     PerformanceEvaluationFilters:
 *       type: object
 *       properties:
 *         employeeId: { type: integer, example: 1 }
 *         fromDate: { type: string, format: date, example: "2024-01-01" }
 *         toDate: { type: string, format: date, example: "2024-12-31" }
 *         limit: { type: integer, minimum: 1, example: 20 }
 *         page: { type: integer, minimum: 1, example: 1 }
 *
 *     PerformanceEvaluationCreate:
 *       type: object
 *       required: [employeeId, date, calification]
 *       properties:
 *         employeeId: { type: integer, example: 1 }
 *         date: { type: string, format: date-time, example: "2024-06-30T00:00:00Z" }
 *         calification: { type: integer, minimum: 1, maximum: 10, example: 8 }
 *         comments: { type: string, maxLength: 200, example: "Buen desempeño" }
 *
 *     PerformanceEvaluationPatch:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales."
 *       properties:
 *         employeeId: { type: integer, example: 1 }
 *         date: { type: string, format: date-time, example: "2024-06-30T00:00:00Z" }
 *         calification: { type: integer, minimum: 1, maximum: 10, example: 8 }
 *         comments: { type: string, maxLength: 200, example: "Buen desempeño" }
 *
 *     ResponseGetPerformanceEvaluation:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         employeeId: { type: integer, example: 1 }
 *         date: { type: string, format: date-time, example: "2024-06-30T00:00:00Z" }
 *         calification: { type: integer, example: 8 }
 *         comments: { type: string, nullable: true, example: "Buen desempeño" }
 *         createdOn: { type: string, format: date-time, example: "2024-06-30T10:00:00Z" }
 *         updatedOn: { type: string, format: date-time, nullable: true, example: null }
 *         createdBy: { type: integer, example: 1 }
 *         updatedBy: { type: integer, nullable: true, example: null }
 *         employeeName: { type: string, nullable: true, example: "Ana" }
 *         userPerformanceCreatedName: { type: string, nullable: true, example: "Admin" }
 *         userPerformanceUpdatedName: { type: string, nullable: true, example: null }
 */

/** --------------------------------------
 * Sección de cuerpos PATCH (contratos parciales)
 *
 * Cada schema replica el Joi de actualización de su módulo: mismos campos,
 * mismos límites y ninguno obligatorio (el `min(1)` del body se documenta como
 * descripción porque OpenAPI no expresa "al menos uno").
 * -------------------------------------- */

/**
 * @openapi
 * components:
 *   schemas:
 *     BodyClientUpdatePartial:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales."
 *       properties:
 *         name: { type: string, maxLength: 100, minLength: 1, example: "John Doe" }
 *         email: { type: string, format: email, example: "john@example.com" }
 *         phone: { type: string, maxLength: 15, minLength: 1, example: "+1234567890" }
 *         address: { type: string, maxLength: 120, minLength: 1, example: "123 Main St" }
 *
 *     BodyExpensePatch:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales."
 *       properties:
 *         description: { type: string, maxLength: 255, nullable: true, example: "New Marketing Campaign" }
 *         total: { type: number, minimum: 0.01, example: 500.75 }
 *         category:
 *           type: string
 *           nullable: true
 *           enum:
 *             - RENTAL
 *             - UTILITIES
 *             - SALARIES
 *             - SUPPLIES
 *             - TRANSPORT
 *             - MAINTENANCE
 *             - MARKETING
 *             - SOFTWARE
 *             - PROFESSIONAL_SERVICES
 *             - TAXES
 *             - BANK_FEES
 *             - TRAVEL
 *             - TRAINING
 *             - OTHER
 *           example: MARKETING
 *
 *     NewsUpdatePartial:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales."
 *       properties:
 *         description: { type: string, minLength: 1, maxLength: 400, example: "Noticia actualizada" }
 *         statusId: { type: integer, example: 1 }
 *         statusCode: { type: string, maxLength: 3, example: "C01" }
 *         document: { type: string, nullable: true, example: "Documento en base64" }
 *
 *     BodyPayrollUpdate:
 *       type: object
 *       description: "PATCH: al menos un campo."
 *       properties:
 *         employeeId: { type: integer, minimum: 1, example: 1 }
 *         month: { type: integer, minimum: 1, maximum: 12, example: 6 }
 *         year: { type: integer, minimum: 1900, maximum: 2100, example: 2024 }
 *         baseSalary: { type: number, minimum: 1, example: 2500.5 }
 *         extraHours: { type: number, minimum: 0, example: 120.5 }
 *         deductions: { type: number, minimum: 0, example: 80 }
 *         totalPayment: { type: number, minimum: 1, example: 2541 }
 *
 *     BodyProviderPatch:
 *       type: object
 *       description: "PATCH: al menos un campo."
 *       properties:
 *         code: { type: string, maxLength: 3, example: "P01" }
 *         name: { type: string, maxLength: 100, example: "Proveedor ABC" }
 *         status: { type: boolean, example: true }
 *         contactName: { type: string, maxLength: 60, nullable: true, example: "Juan Pérez" }
 *         contactEmail: { type: string, maxLength: 80, nullable: true, example: "contacto@proveedor.com" }
 *         contactPhone: { type: string, maxLength: 15, nullable: true, example: "+123456789" }
 *         address: { type: string, maxLength: 120, nullable: true, example: "Av. Principal 123" }
 *
 *     BodyPurchasePatch:
 *       type: object
 *       description: "PATCH: al menos un campo."
 *       properties:
 *         providerId: { type: integer, example: 1 }
 *         total: { type: number, minimum: 0, example: 1500.75 }
 *         details:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             properties:
 *               productId: { type: integer, example: 1 }
 *               quantity: { type: integer, minimum: 1, example: 2 }
 *               price: { type: number, minimum: 0, example: 750.37 }
 *
 *     BodySalePatch:
 *       type: object
 *       description: "PATCH: al menos un campo."
 *       properties:
 *         clientId: { type: integer, example: 1 }
 *         total: { type: number, minimum: 0, example: 1500.75 }
 *         details:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             properties:
 *               productId: { type: integer, example: 1 }
 *               quantity: { type: integer, minimum: 1, example: 2 }
 *               price: { type: number, minimum: 0, example: 750.37 }
 *
 *     SettingsPatch:
 *       type: object
 *       properties:
 *         language: { type: string, enum: [es, en], example: "es" }
 *         displayOptions:
 *           type: object
 *           properties:
 *             displayEvents: { type: boolean, example: true }
 *             displayNotes: { type: boolean, example: true }
 *             displayNews: { type: boolean, example: true }
 *             displayProfile: { type: boolean, example: true }
 *             displayLanguage: { type: boolean, example: true }
 *             displayReports: { type: boolean, example: true }
 *             displayPayroll: { type: boolean, example: true }
 *             displayStock: { type: boolean, example: true }
 *
 *     StockPatch:
 *       type: object
 *       description: "PATCH: al menos un campo."
 *       properties:
 *         quantity: { type: integer, minimum: 0, example: 10 }
 *         minimum: { type: integer, minimum: 0, example: 2 }
 *         maximum: { type: integer, minimum: 0, nullable: true, example: 100 }
 *         lot: { type: string, maxLength: 50, nullable: true, example: "L-2024-01" }
 *         unitMeasure:
 *           type: string
 *           enum: [PIECES, KILOGRAMS, LITERS, METERS]
 *           example: PIECES
 *         expirationDate: { type: string, format: date-time, nullable: true, example: "2025-06-15T00:00:00Z" }
 *         productId: { type: integer, example: 1 }
 *         warehouseId: { type: integer, example: 1 }
 *
 *     BodyUserUpdate:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales."
 *       properties:
 *         name: { type: string, maxLength: 100, minLength: 1, example: "John Doe" }
 *         email: { type: string, format: email, example: "john@example.com" }
 *         password:
 *           type: string
 *           minLength: 1
 *           description: "Solo escritura: nunca se devuelve en las respuestas."
 *           example: "S3cr3t"
 *         address: { type: string, maxLength: 250, nullable: true, example: "123 Main St" }
 *         birthday: { type: string, format: date-time, example: "1990-01-01T00:00:00Z" }
 *         city: { type: string, maxLength: 35, nullable: true, example: "Anytown" }
 *         isAdmin: { type: boolean, example: false }
 *         isManager: { type: boolean, example: false }
 *         accessNews: { type: boolean, example: true }
 *         accessConfiguration: { type: boolean, example: false }
 *         picture: { type: string, nullable: true, example: "https://example.com/avatar.png" }
 *         document: { type: string, nullable: true, example: "123456789" }
 *         roleId: { type: integer, minimum: 1, example: 2 }
 *         socialSecurity: { type: string, maxLength: 9, example: "123456789" }
 *         startDate: { type: string, format: date-time, example: "2020-01-01T00:00:00Z" }
 *         state: { type: string, maxLength: 50, nullable: true, example: "CA" }
 *         statusId: { type: integer, minimum: 1, example: 1 }
 *         telephone: { type: string, maxLength: 15, example: "555-123-4567" }
 *         zipcode: { type: string, maxLength: 9, example: "90210" }
 *         permissions: { type: array, items: { type: integer }, example: [1, 2] }
 *
 *     BodyVacationPatch:
 *       type: object
 *       properties:
 *         employeeId: { type: integer, minimum: 1, example: 1 }
 *         startDate: { type: string, format: date-time, example: "2024-08-01T00:00:00Z" }
 *         endDate: { type: string, format: date-time, example: "2024-08-15T00:00:00Z" }
 *         status: { type: string, enum: [PENDING, APPROVED, REJECTED], example: PENDING }
 *
 *     EventsUpdateSchema:
 *       type: object
 *       description: "PATCH: todos los campos son opcionales. `meetingUrl` es obligatorio para ONLINE/HYBRID y prohibido para IN_PERSON; `location` al contrario."
 *       properties:
 *         title: { type: string, maxLength: 50, example: "Tech Conference 2025" }
 *         description: { type: string, maxLength: 200, example: "Charla sobre IA" }
 *         speaker: { type: string, maxLength: 20, nullable: true, example: "John Doe" }
 *         startTime: { type: string, pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$', example: "09:00" }
 *         endTime: { type: string, pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$', example: "11:00" }
 *         eventDate: { type: string, format: date-time, example: "2025-06-15T00:00:00Z" }
 *         type: { type: integer, example: 2 }
 *         capacity: { type: integer, minimum: 0, example: 100 }
 *         modality: { type: string, enum: [ONLINE, IN_PERSON, HYBRID], example: HYBRID }
 *         meetingUrl: { type: string, maxLength: 500, example: "https://meet.example.com/abc-123" }
 *         location: { type: string, maxLength: 200, example: "Auditorio principal" }
 */

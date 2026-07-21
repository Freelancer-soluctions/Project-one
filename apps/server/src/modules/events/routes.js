import { Router } from 'express';
import {
  EventsCreateSchema,
  EventsFilters,
  EventsUpdateSchema,
} from './schemas/events.joi.js';
import * as eventsController from './controller.js';
import {
  validateQueryParams,
  validateSchema,
  verifyToken,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

// Mount event attendee routes (mergeParams inherits verifyToken)
import attendeeRoutes from './attendee/routes.js';

const router = Router();
// uso global de middleware
router.use(verifyToken);

/**
 * @openapi
 * /api/v1/events:
 *   post:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Crea un provider"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BodyEventCreateUpdate"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseEventCreateUpdate"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canCreateEvents],
  }),
  validateSchema(EventsCreateSchema),
  eventsController.createEvent
);

/**
 * @openapi
 * /api/v1/events/eventTypes:
 *   get:
 *     summary: "Obtener event types"
 *     description: "Obtiene la lista de eventos disponibles."
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/GetEventsTypes"
 *       5XX:
 *         description: "Error inesperado"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.get(
  '/eventTypes',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewEvents],
  }),
  eventsController.getAllEventTypes
);

/**
 * @openapi
 * /api/v1/events:
 *   get:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Obtener eventos"
 *     description: "Obtiene la lista de eventos junto con la información del tipo de evento. Se puede filtrar usando 'searchQuery', 'type', 'dateFrom', 'dateTo', 'speaker', y 'status'."
 *     parameters:
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 30
 *         required: false
 *         description: "Texto para buscar en el título, descripción o speaker del evento."
 *         example: "Tech Conference 2025"
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: "Filtrar por ID de tipo de evento (coincidencia exacta en eventTypeId)."
 *         example: 1
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: "Filtrar eventos desde esta fecha (inclusive, formato ISO: YYYY-MM-DD)."
 *         example: "2025-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: "Filtrar eventos hasta esta fecha (inclusive, formato ISO: YYYY-MM-DD, normalizado a fin de día)."
 *         example: "2025-12-31"
 *       - in: query
 *         name: speaker
 *         schema:
 *           type: string
 *           maxLength: 50
 *         required: false
 *         description: "Filtrar por nombre del speaker (coincidencia parcial, case-insensitive)."
 *         example: "John"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, past, all]
 *         required: false
 *         description: "Filtrar por estado del evento: 'upcoming' (futuros), 'past' (pasados), o 'all' (todos)."
 *         example: "upcoming"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         required: false
 *         description: "Número de página para paginación (default: 1)."
 *         example: 2
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         required: false
 *         description: "Cantidad de eventos por página (default: 20, max: 100)."
 *         example: 20
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ResponseGetEvents"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: "Error inesperado"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewEvents],
  }),
  validateQueryParams(EventsFilters),
  eventsController.getAllEvents
);



/**
 * @openapi
 * /api/v1/events/{id}:
 *   patch:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Actualiza un evento"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del evento a actualizar."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/EventsUpdateSchema"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseEventCreateUpdate"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 * */

router.patch(
   '/:id',
   checkRoleAuthOrPermisssion({
     allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
     permissions: [PERMISSIONCODES.canEditEvents],
   }),
   validatePathParam,
   validateSchema(EventsUpdateSchema),
   eventsController.updateEventById
 );

/**
 * @openapi
 * /api/v1/events/{id}:
 *   delete:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Elimina un evento"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del evento a eliminar."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Delete"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canDeleteEvents],
  }),
  validatePathParam,
  eventsController.deleteEventById
);

// Mount event attendee routes (mergeParams inherits verifyToken)
router.use('/:eventId', attendeeRoutes);

export default router;

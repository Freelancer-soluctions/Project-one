import { Router } from "express";
import {
  SettingsLanguage,
  SettingsDisplay,
} from "../../utils/joiSchemas/joi.js";
import * as settingsController from "./controller.js";
// import validateQueryParams from '../../middleware/validateQueryParams.js'
import validateSchema from "../../middleware/validateSchema.js";
import verifyToken from "../../middleware/verifyToken.js";

const router = Router();

/**
 * @openapi
 * /api/v1/settings/language/{id}:
 *   get:
 *     tags:
 *       - Language
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: The ID of the user setting to retrieve the language.
 *       - in: header
 *         name: x-access-token
 *         schema:
 *           type: string
 *         required: true
 *         description: The access token for authorization.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   $ref: "#/components/schemas/UserSettingLanguage"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.get("/:id", verifyToken, settingsController.getSettingsById);

/**
 * @openapi
 * /api/v1/settings/language:
 *   post:
 *     tags:
 *       - SettingsLanguage
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *           type: string
 *         required: true
 *         description: Access token for authorization
 *     requestBody:
 *         content:
 *          multipart/form-data:
 *           schema:
 *            $ref: "#/components/schemas/createOrUpdateSettingLanguage"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.post(
  "/language/",
  verifyToken,
  validateSchema(SettingsLanguage),
  settingsController.createOrUpdateSettingsLanguage
);

/**
 * @openapi
 * /api/v1/settings/language:
 *   post:
 *     tags:
 *       - SettingsLanguage
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *           type: string
 *         required: true
 *         description: Access token for authorization
 *     requestBody:
 *         content:
 *          multipart/form-data:
 *           schema:
 *            $ref: "#/components/schemas/createOrUpdateSettingLanguage"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.post(
  "/display/",
  verifyToken,
  validateSchema(SettingsDisplay),
  settingsController.createOrUpdateSettingsDisplay
);

export default router;

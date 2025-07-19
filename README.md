Front end 
- Persitencia de datos como el inicio de sesion con redux-persist
- Proteccion de rutas solo accesibles cuando la sesion es valida por medio de un guard, trabajando conjuntamente con jwt
- Internalizacion con i18next y react-i18next soportando dos idiomas (ingles y español)
- Storybook para la documentacion y prueba componentes UI, para la facilitacion entre diseñadores y QA testers
- Uso de hooks personalizados para organizar y separalar la logica de la pagina para su mejor comprension.
- Uso de logger para monitoreo y registro de acciones o errores del front end
- React hook forma para manejo de formularios en combinacion con zod schema validation
- RTK QUERY  para manejo de estado global
- Redux persist para la persitencia de estados necesarios como lo son las configuraciones o informacion de usuario

Back end
- Swagger ui para la documentacion y prueba APIs REST
- Documentacion basada en jsdoc
- Arquitectura layered o capas
- Uso de prima ORM con sistema de consultas naviva y uso de sql raw para consultas mas complejas.
- Uso de JWT para la autenticacion y autorizacion de usuarios en rutas privadas
- HOF hihg order function para manejo de errores

Global
- El sistema posee varias capas de seguridad siendo tales como middlewares de control de acceso para verificacion de tokens jwt, roles y permisos, (Broken access control owasp top 10)


1️⃣ Módulo de Gestión de Productos 
📌 Objetivo: Administrar los productos y sus características.
🔹 CRUD de productos (crear, leer, actualizar, eliminar).
🔹 Manejo de categorías y atributos personalizables.
🔹 Soporte para productos compuestos (kits o combos).
🔹 Asociación con múltiples proveedores.
🔹 Generación de código de barras automático.

2️⃣ Módulo de Stock y Almacenes
📌 Objetivo: Controlar la cantidad de productos en diferentes almacenes.
🔹 Manejo de stock por almacén/sucursal.
🔹 Configuración de stock mínimo y máximo con alertas.
🔹 Registro de lotes y fechas de caducidad.
🔹 Métodos de valoración de inventario (PEPS, UEPS, Promedio Ponderado).
🔹 Configuración de permisos por usuario para modificar stock.

3️⃣ Módulo de Movimientos de Inventario
📌 Objetivo: Registrar todas las transacciones que afectan el stock.
🔹 Entradas y salidas de inventario con motivo (compra, venta, ajuste, etc.).
🔹 Transferencias entre almacenes.
🔹 Ajustes manuales de inventario (pérdidas, auditorías, etc.).
🔹 Auditoría de todos los movimientos.

4️⃣ Módulo de Integración con Compras y Ventas
📌 Objetivo: Sincronizar inventario con compras y ventas.
🔹 Reducción automática de stock tras una venta.
🔹 Actualización de stock al recibir productos de una compra.
🔹 Integración con facturación y contabilidad.

5️⃣ Módulo de Reportes y Auditoría
📌 Objetivo: Generar reportes de inventario y auditoría.
🔹 Kardex de inventario (historial de movimientos por producto).
🔹 Reportes de stock en tiempo real.
🔹 Auditoría de cambios manuales en el inventario.
🔹 Análisis de tendencias de ventas y consumo de productos.

6️⃣ Módulo de Configuración y Personalización
📌 Objetivo: Adaptar el sistema a diferentes negocios.
🔹 Permitir agregar campos personalizados a los productos.
🔹 Configuración de permisos y roles de usuario.
🔹 Definir reglas de stock y alertas.
🔹 Automatización de órdenes de compra si el stock es bajo.

Flujo de comunicación entre módulos
1️⃣ Gestión de Productos → Stock y Almacenes

Cuando se crea un producto, debe poder asignarse a uno o varios almacenes con un stock inicial opcional.
Si un producto es compuesto (kit o combo), debe asegurarse que su stock se calcula en base a sus componentes.
2️⃣ Stock y Almacenes → Movimientos de Inventario

Cualquier cambio de stock (entrada, salida, ajuste, transferencia) se registra como un movimiento de inventario.
Cada almacén tiene su propio stock, por lo que las transferencias entre almacenes deben actualizar ambos correctamente.
3️⃣ Movimientos de Inventario → Integración con Compras y Ventas

Al realizar una venta, se registra una salida de stock y un movimiento en el historial.
Al recibir una compra, se registra una entrada de stock y se asocia con la orden de compra.
Si una auditoría o ajuste cambia manualmente el stock, debe registrarse en la auditoría del inventario.
4️⃣ Integración con Compras y Ventas → Stock y Almacenes

La compra de productos puede actualizar automáticamente el stock en los almacenes asignados.
Las ventas reducen el stock y pueden generar alertas si se alcanza el mínimo configurado.
5️⃣ Stock y Almacenes → Reportes y Auditoría

Cualquier cambio en el stock se refleja en los reportes en tiempo real.
Los movimientos de inventario deben estar auditados para garantizar trazabilidad.
6️⃣ Configuración y Personalización → Todos los módulos

Debe permitir la configuración de reglas como stock mínimo, alertas, permisos y roles de usuario.
Posibilidad de personalizar los campos de los productos y reportes según necesidades del negocio.
Automatización de compras si el stock baja de un nivel crítico.

Tabla: Acceso por rol a los módulos del ERP
| Módulo                  | Admin | Manager | User |
| ----------------------- | :---: | :-----: | :--: |
| Dashboard               |   ✅   |    ✅    |   ✅  |
| Gestión de productos    |   ✅   |    ✅    |  🔲  |
| Proveedores             |   ✅   |    ✅    |  🔲  |
| Inventario              |   ✅   |    ✅    |  🔲  |
| Categorías de productos |   ✅   |    ✅    |  🔲  |
| Atributos de producto   |   ✅   |    ✅    |  🔲  |
| Gestión de ventas       |   ✅   |    ✅    |  🔲  |
| Gestión de compras      |   ✅   |    ✅    |  🔲  |
| Gestión de clientes     |   ✅   |    ✅    |   ✅  |
| Gestión de empleados    |   ✅   |    ✅    |  🔲  |
| Evaluación de desempeño |   ✅   |    ✅    |  🔲  |
| Nómina                  |   ✅   |    ✅    |  🔲  |
| Asistencia              |   ✅   |    ✅    |  🔲  |
| Vacaciones              |   ✅   |    ✅    |  🔲  |
| Noticias                |   ✅   |    ✅    |   ✅  |
| Configuración de acceso |   ✅   |    🔲   |  🔲  |
| Gestión de usuarios     |   ✅   |    🔲   |  🔲  |
| Órdenes de clientes     |   ✅   |    ✅    |   ✅  |
| Órdenes de proveedores  |   ✅   |    ✅    |  🔲  |
| Gastos                  |   ✅   |    ✅    |  🔲  |
| Reportes / Estadísticas |   ✅   |    ✅    |   ✅  |




Tabla de permisos booleanos por rol (para manager y user) SDSD

| ID  | Código del Permiso              | Descripción                               | Manager | User |
|-----|----------------------------------|-------------------------------------------|---------|------|
| 1   | canViewDashboard                 | Puede ver el dashboard                    | ✅      | ✅  |
| 2   | canCreateProduct                 | Puede crear productos                     | ✅      |      |
| 3   | canEditProduct                   | Puede editar productos                    | ✅      |      |
| 4   | canDeleteProduct                 | Puede eliminar productos                  | ✅      |      |
| 5   | canViewProduct                   | Puede ver productos                       | ✅      | ✅   |
| 6   | canCreateProvider                | Puede crear proveedores                   | ✅      |      |
| 7   | canEditProvider                  | Puede editar proveedores                  | ✅      |      |
| 8   | canDeleteProvider                | Puede eliminar proveedores                | ✅      |      |
| 9   | canViewProvider                  | Puede ver proveedores                     | ✅      | ✅   |
| 10  | canCreateInventory               | Puede crear inventario                    | ✅      |      |
| 11  | canEditInventory                 | Puede editar inventario                   | ✅      |      |
| 12  | canViewInventory                 | Puede ver inventario                      | ✅      | ✅   |
| -   | canDeleteInventory               | Puede eliminar inventario                 | ✅      |      |
| 13  | canCreateCategory                | Puede crear categorías                    | ✅      |      |
| 14  | canEditCategory                  | Puede editar categorías                   | ✅      |      |
| 15  | canViewCategory                  | Puede ver categorías                      | ✅      | ✅   |
| -   | canDeleteCategory                | Puede eliminar inventario                 | ✅      |      |
| 16  | canCreateSale                    | Puede crear ventas                        | ✅      | ✅   |
| 17  | canEditSale                      | Puede editar ventas                       | ✅      | ✅  |
| 18  | canViewSale                      | Puede ver ventas                          | ✅      | ✅   |
| -   | canDeleteSale                    | Puede eliminar un sale                    | ✅      |      |
| 19  | canCreatePurchase                | Puede crear compras                       | ✅      |      |
| 20  | canEditPurchase                  | Puede editar compras                      | ✅      |      |
| 21  | canViewPurchase                  | Puede ver compras                         | ✅      |      |
| -   | canDeletePurchase                | Puede eliminar un compras                 | ✅      |      |
| 22  | canCreateClient                  | Puede crear clientes                      | ✅      |      |
| 23  | canEditClient                    | Puede editar clientes                     | ✅      |      |
| 24  | canViewClient                    | Puede ver clientes                        | ✅      | ✅   |
| -   | canDeleteClient                  | Puede eliminar un cliente                 | ✅      |      |
| 25  | canCreateEmployee                | Puede crear empleados                     | ✅      |      |
| 26  | canEditEmployee                  | Puede editar empleados                    | ✅      |      |
| 27  | canViewEmployee                  | Puede ver empleados                       | ✅      |      |
| -   | canDeleteEmployee                | Puede eliminar un empleados               | ✅      |      |

| 28  | canCreateEvaluatePerformance     | Puede crear evaluar desempeño             | ✅      |      |
| -   | canEditEvaluatePerformance       | Puede editar evaluar desempeño            | ✅      |      |
| -   | canDeleteEvaluationPerformance   | Puede eliminar un empleados               | ✅      |      |
| 29  | canViewPerformanceEvaluations    | Puede ver evaluaciones de desempeño       | ✅      |      |
| 30  | canCreatePayroll                 | Puede crear nóminas                       | ✅      |      |
| 31  | canEditPayroll                   | Puede editar nóminas                      | ✅      |      |
| 32  | canViewPayroll                   | Puede ver nóminas                         | ✅      |      |
| -   | canDeletePayroll                 | Puede eliminar un empleados               | ✅      |      |

| 33  | canCreateAttendance              | Puede registrar asistencia                | ✅      |      |
| -   | canEditAttendance                | Puede registrar asistencia                | ✅      |      |
| -   | canDeleteAttendance              | Puede eliminar un empleados               | ✅      |      |
| 34  | canViewAttendance                | Puede ver asistencia                      | ✅      | ✅   |
| 35  | canRequestVacation               | Puede solicitar vacaciones                | ✅      | ✅   |
| -   | canEditRequestVacation           | Puede solicitar vacaciones                | ✅      | ✅   |
| -   | canDeleteVacation              | Puede eliminar un empleados               | ✅      |   ✅   |
| 36  | canViewVacations                 | Puede ver vacaciones                      | ✅      | ✅   |
| 37  | canViewNews                      | Puede ver noticias                        | ✅      | ✅   |
| 37  | canCreateNews                      | Puede ver noticias                        | ✅      | ✅   |
| 37  | canEditNews                      | Puede ver noticias                        | ✅      | ✅   |
| 37  | canDeleteNews                      | Puede ver noticias                        | ✅      | ✅   |



| 38  | canCreateClientOrder             | Puede crear órdenes de cliente            | ✅      | ✅   |
| 39  | canEditClientOrder               | Puede editar órdenes de cliente           | ✅      |      |
| 40  | canViewClientOrder               | Puede ver órdenes de cliente              | ✅      | ✅   |

| 41  | canCreateProviderOrder           | Puede crear órdenes a proveedores         | ✅      |      |
| 42  | canEditProviderOrder             | Puede editar órdenes a proveedores        | ✅      |      |
| 43  | canViewProviderOrder             | Puede ver órdenes a proveedores           | ✅      |      |
| 37  | canDeleteProviderOrder           | Puede ver noticias                      | ✅      |    |

| 44  | canCreateExpense                 | Puede crear gastos                        | ✅      |      |
| 45  | canEditExpense                   | Puede editar gastos                       | ✅      |      |
| 46  | canViewExpense                   | Puede ver gastos                          | ✅      |      |
| 37  | canDeleteExpense             | Puede ver noticias                      | ✅      |    |

| 47  | canViewReports                   | Puede ver reportes                        | ✅      |      |

No se han aplicado los de client order y reports queda faltando mas modulos


Segmentación de Permisos por Funcionalidad
Decidiste que el sistema crecerá, por lo tanto optamos por segmentar los permisos en categorías lógicas para mayor claridad y control granular:

Ejemplo de categorías:
📦 Productos → canCreateProduct, canEditProduct, etc.

👤 Clientes → canCreateClient, canEditClient, etc.

🧾 Órdenes → canCreateClientOrder, canViewProviderOrder, etc.

💼 Recursos Humanos → canViewEmployee, canEditPayroll, etc.

Permisos por Rol (manager y user)
Creamos una tabla de permisos booleanos para cada rol, donde:

manager tiene acceso total.

user tiene acceso parcial (ver dashboard, clientes, órdenes, etc.).

Esto se convirtió en data semilla para la tabla RolePermit, uniendo cada roleId con los permissionId correspondientes.



Quiero que hagas lo siguiente: 1- crea la estructura para expenses siguiendo como ejemplo clients y lo hecho en el server de clients, 2- usa la misma estructura de codigo, es importante que respetes como esta escrito el codigo lo que quiero es que lo adaptes a expenses siguiendo la misma estructura que esta en clients . 3- crealo dentro de modules siguiendo la estructura de archivos. 4- usa el mismo codigo de clients  pero adaptado a expenses, y estos cambios son los del front end, no debes de realizar ningun cambio en el back end, 5 verifica los modelos de expenses  en el back end (server) para que sepas como es la estructura del fromulario en el front end, antes de hacer algun cambio por favor lee la estructura y el codebase de clients que es el ejemplo no crees ni añadas codigo que no existe en clients quiero estrictamente la misma estructura adapatada apara a expenses, preguntame si tienes dudas

Quiero que hagas lo siguiente: 1- crea la estructura para vacation siguiendo como ejemplo clients y el modelo de prisma de vacation, 2- usa la misma estructura de codigo, es importante que respetes como esta escrito el codigo lo que quiero es que lo adaptes a vacation siguiendo la misma estructura que esta en clients. 3- crealo dentro de components siguiendo la estructura de archivos. reviza el codigo porque no lo estas haciendo bien quiero que sea exacto yo estoy usando esmodules y tu lo estas haciendo de otra forma, tambien ten presente las HOF que tienen los controladores porque no estoy haciendo uso de try catch 4- Crea los esquemas de Joi específicos para vacation, también la documentacion de Swagger correspondientes en folder docs/schemas.js y los comentarios de jsdoc en controller, service y dao
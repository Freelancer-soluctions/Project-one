# Module: Stock (Server)

Descripción General
- Gestión de stock por producto y almacén, con lotes, fechas de caducidad y movimientos de entrada/salida.

🗄️ Base de Datos (schema.prisma)
- Entidad stock con campos: id, quantity, minimum, maximum, lot, unitMeasure, expirationDate, productId, warehouseId, createdOn, ...
- Relaciones: product (products), warehouse (warehouse), userStockCreated (users), userStockUpdated (users)
- Constraints: unique stock entry por producto/almacén/lote/fecha de caducidad

⚙️ Servidor (Backend)
- Endpoints: /api/stock, /api/warehouse y rutas relacionadas
- Lógica: validaciones de stock, control de transacciones, movimientos de inventario
- DAO: acceso a Prisma para stock, warehouse e inventoryMovement

💻 Cliente (Frontend)
- Referenciado en docs/modules/client-stock.md

🔗 Relaciones
- Con productos y almacenes

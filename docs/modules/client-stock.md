# Module: Stock (Client)

Descripción General
- Gestión de stock desde la interfaz, mostrando ubicaciones y movimientos de inventario a través de APIs del backend.

⚙️ Servidor (Backend)
- Endpoints de stock: ver movimientos, consultar stock por producto/almacén (ver server/stock)
- Lógica: mapea respuestas del backend al UI
- DAO: invoca queries al stock y almacenes

💻 Cliente (Frontend)
- Páginas: modules/stock/pages/Stock.jsx (si existe)
- Componentes: InventoryDatatable, InventoryMovementFiltersForm
- API: inventoryMovementAPI.js, stockAPI.js

🔗 Relaciones
- Con productos y warehouse (almacenes) para asociar stock

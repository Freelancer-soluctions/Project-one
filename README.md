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



llaves de env generadas 
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" <- se uso esta
usar alguna de estas opciones para crear las llaves secretas
node -e "console.log('SECRETKEY=', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('REFRESHSECRETKEY=', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SECRETCOOKIEKEY=', require('crypto').randomBytes(32).toString('hex'))"

AESGCM KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

A02 CRYPTOGRAPHID FAILURES
Cifrado de datos en campos sensibles (AES-GCM) 

Configuracion de prettier
{
  // Esquema oficial para que editores (VS Code, WebStorm)
  // validen y autocompleten las opciones de Prettier
  "$schema": "https://json.schemastore.org/prettierrc",

  // Longitud máxima de una línea antes de que Prettier haga saltos
  // Valor recomendado por Prettier y estándar en equipos
  "printWidth": 80,

  // Número de espacios por nivel de indentación
  "tabWidth": 2,

  // Fuerza el uso de espacios en lugar de tabs
  // Garantiza consistencia entre editores y CI
  "useTabs": false,

  // Obliga a usar punto y coma al final de las sentencias
  // Evita edge cases del ASI en JavaScript
  "semi": true,

  // Usa comillas simples en JavaScript
  // No afecta a JSX ni a JSON
  "singleQuote": true,

  // Solo añade comillas a propiedades de objetos cuando es necesario
  // Reduce ruido visual sin romper compatibilidad
  "quoteProps": "as-needed",

  // En JSX se mantienen comillas dobles (convención HTML)
  // Recomendado por la documentación oficial
  "jsxSingleQuote": false,

  // Añade coma final donde ES5 lo permite (objetos, arrays, parámetros)
  // Mejora los diffs en Git
  "trailingComma": "es5",

  // Añade espacios dentro de llaves en objetos: { foo: bar }
  // Mejora la legibilidad
  "bracketSpacing": true,

  // Mantiene el cierre de JSX en una nueva línea
  // Evita JSX compacto difícil de leer
  "bracketSameLine": false,

  // Siempre incluye paréntesis en funciones flecha
  // Mejora legibilidad y evita ambigüedades
  "arrowParens": "always",

  // Fuerza finales de línea LF
  // CRÍTICO para evitar errores en CI/CD (Linux) y conflictos Windows
  "endOfLine": "lf"
}
----------------------------------------------------------------------------------------------

Uso en CI/CD (muy importante)   

{
  "scripts": {
    "format:check": "prettier --check \"apps/**/*.{js,jsx,json,md}\""
  }
}
En el pipeline
npm ci
npm run format:check

Falla el pipeline si alguien rompe el formato

No modifica código en CI

Refuerza Husky (defensa en capas)


Uso correcto en CI/CD (clave)
En CI NO se usa --fix.

{
  "scripts": {
    "lint": "eslint \"apps/**/*.{js,jsx}\""
  }
}
npm ci
npm run lint:ci
npm run format:check
npm test
Esto garantiza:

CI falla si hay errores

El código no se modifica

Husky + CI se refuerzan mutuamente

Se uso trunk based development como estrategia de ramas en compañia de feature flags
-------------------------------------------------------------------------------------------------

Análisis Arquitectónico (Monorepo + PR CI)

Tienes dos workflows:

CI → Orquestador principal (pull_request a main)

quality.yml → Workflow reutilizable (workflow_call)

Esto está muy bien planteado. Es patrón enterprise real:

Separación de responsabilidades

Reutilización

Orquestación central

Detección inteligente de cambios

Eso ya es nivel intermedio-alto.

Branch-Based Pipeline:
Feature Branch → PR Pipeline (build, test, Code Quality, security scan)
       ↓
Main Branch → Full Pipeline (build, test, scan, deploy to staging)
       ↓
Release Tag → Production Pipeline (deploy to prod)


-----------------------------------------------------------------------------------------
Uso de semgrep con docker
Uso de gitleaks con chocolatey

## Security Scanning
## Static Application Security Testing (SAST)

This project integrates **Semgrep** for **Static Application Security Testing (SAST)** as part of a **Shift-Left security strategy**.
Semgrep analyzes the source code to detect common vulnerabilities during development before code reaches the CI pipeline.

Security rules are aligned with common web application vulnerabilities such as:

* Broken Access Control
* Injection
* Cross-Site Scripting (XSS)
* Cryptographic Failures
* Server-Side Request Forgery (SSRF)
* Security Misconfiguration

The full list of rules is documented in:

```
docs/security/semgrep-rules.md
```

---

# Running Semgrep Locally

Developers are encouraged to run Semgrep **before committing code** to detect potential security issues early.

The project runs Semgrep using a **Docker container**, ensuring a consistent scanning environment without requiring a local installation.

---

## 1. Pull the Semgrep Docker Image

Download the official Semgrep container:

```bash
docker pull semgrep/semgrep:latest
```

This image is used internally by the project scripts to execute the security scan.

---

## 2. Run the Semgrep Scan

The project provides two scanning modes depending on the use case.

### Scan only staged files (recommended before committing)

This scan analyzes **only the files staged in Git**, making it faster and suitable for local development.

```bash
npm run sast:semgrep or pre-commit githook configuration
```

Script executed:

```
scripts/security/semgrep-staged.ps1
```

---

### Scan the entire project

This scan analyzes **the complete repository**, which is useful for:

* manual security checks
* validating a branch before opening a pull request
* full security audits

```bash
npm run sast:semgrep:full
```

Script executed:

```
scripts/security/semgrep.ps1
```

---

# Recommended Developer Workflow

A typical secure development workflow is:

1. Implement a feature
2. Stage the changes

```
git add .
```

3. Run the staged security scan in precommit hook

```
npm run sast:semgrep
```

4. Fix any detected vulnerabilities
5. Commit the changes

This ensures vulnerabilities are detected **before code is pushed to the repository**.

---


# Security Documentation

Additional security documentation can be found in:

```
docs/security/SECURITY.md (Static Application Security Testing (SAST))
docs/security/segremp-rules.md 

```

These documents describe:

* security policies
* rule configuration
* vulnerability coverage

## Dependency Vulnerability Scanning

This project integrates **Trivy** for **dependency vulnerability scanning** as part of the project's **Shift-Left security strategy**.

Trivy analyzes project dependencies to detect **known vulnerabilities (CVEs)** in third-party packages before they reach production.

The scan evaluates both **direct and transitive dependencies** defined in the repository lockfile.

Dependency vulnerabilities are detected using public vulnerability databases such as:

* NVD (National Vulnerability Database)
* GitHub Security Advisories
* Vendor security advisories

These vulnerabilities may affect packages used by the application and can introduce risks such as:

* Remote Code Execution (RCE)
* Prototype Pollution
* Denial of Service (DoS)
* Authentication bypass
* Privilege escalation

---

# Running Dependency Scan Locally

Developers are encouraged to run the dependency scan periodically to detect vulnerable packages early in the development process.

The project runs Trivy using a **Docker container**, ensuring a consistent scanning environment without requiring a local installation.

---

## 1. Pull the Trivy Docker Image

Download the official Trivy container:

```bash
docker pull aquasec/trivy:latest
```

This image is used internally by the project scripts to execute the dependency vulnerability scan.

---

## 2. Run the Dependency Scan

The project provides a script to analyze dependencies defined in the repository lockfile.

```bash
npm run security:trivy:deps
```

Script executed:

```
scripts/security/trivy-deps.ps1
```

---

## What the Scan Analyzes

Because this project uses a **monorepo architecture with npm workspaces**, dependencies are installed at the repository root.

For this reason, the dependency scan analyzes the root lockfile:

```
package-lock.json
```

This allows Trivy to evaluate **all dependencies used across the workspace**, including:

```
apps/client
apps/server
```

---

# Example Scan Output

When vulnerabilities are detected, Trivy reports them with their severity level.

Example output:

```
package-lock.json

Total: 1 (HIGH: 1)

Library   Vulnerability      Severity
lodash    CVE-2021-23337     HIGH
```

Severity levels reported by Trivy include:

* LOW
* MEDIUM
* HIGH
* CRITICAL

Developers should prioritize fixing **HIGH and CRITICAL vulnerabilities**.

---

# Recommended Developer Workflow

A typical secure development workflow is:

1. Install or update dependencies

```
npm install
```

2. Run the dependency vulnerability scan

```
npm run security:trivy:deps
```

3. Review detected vulnerabilities

4. Upgrade vulnerable dependencies

5. Verify the vulnerability is resolved

This ensures vulnerable dependencies are detected **before deployment or CI execution**.

---

# Security Documentation

Additional security documentation can be found in:

```
docs/security/SECURITY.md (Dependency Vulnerability Scanning)
```

These documents describe:

* security policies
* vulnerability management process
* dependency risk mitigation strategy




## Secret Detection (Gitleaks)

### Overview

This project integrates **Gitleaks** to detect sensitive information that may be accidentally committed to the repository.

Secret detection is part of the project's **Shift-Left security strategy**, allowing security issues to be identified **directly on the developer's machine before code reaches the repository**.

The scanner helps prevent exposure of sensitive information such as:

- API keys
- authentication tokens
- database credentials
- private cryptographic keys
- passwords or secrets embedded in source code

Detecting secrets early reduces the risk of credential leaks and unauthorized access to infrastructure or external services.

---

## Monorepo Scope

The repository is structured as a **monorepo using npm workspaces**.

Secret scanning runs from the **repository root**, ensuring all workspaces are covered automatically.

Example structure:
root
│
├── package.json
├── .gitleaks.toml
│
├── apps
│ ├── client
│ └── server


Because scanning runs from the root, **all workspaces are included automatically** without additional configuration.

---

## Installation

Gitleaks must be installed locally before running secret scans.

In this project the tool is installed using **Chocolatey**.

Install Gitleaks with: choco install gitleaks


After installation, verify the installation: gitleaks version

---

## Available Security Commands

The project provides npm scripts to run secret detection.

### Scan staged files (used by Git hooks)
npm run security:secrets

Script definition: "security:secrets": "gitleaks protect --staged --verbose --redact --config .gitleaks.toml"


This command:

- scans **only staged files**
- prevents secrets from being committed
- redacts detected secrets in the console output
- uses the project configuration defined in `.gitleaks.toml`

This mode is optimized for **fast local execution during commits**.

---

### Full repository scan
npm run security:secrets:full

Script definition: "security:secrets:full": "gitleaks detect --source . --verbose --config .gitleaks.toml"


This command scans the **entire repository** and is useful when:

- performing a full security review
- preparing a release
- verifying the repository before pushing changes

---

## Configuration

Secret detection rules are defined in: .gitleaks.toml


The configuration file contains:

- default rules provided by Gitleaks
- project-specific secret detection patterns
- directory exclusions (dependencies, build artifacts)
- testing directory exclusions

Example exclusions typically include:

- `node_modules`
- build artifacts (`dist`, `build`)
- test fixtures and mocks

---

## Pre-Commit Protection

Secret detection is integrated into the development workflow using a **Git pre-commit hook (Husky)**.

Before a commit is created, the repository automatically runs the secret scan.


This mechanism ensures that **sensitive information never reaches the repository history**.

---

## Handling Detected Secrets

If Gitleaks detects a potential secret:

1. Identify the exposed value.
2. Remove the secret from the source code.
3. Replace the value with an environment variable if needed.
4. Re-stage the changes.
5. Commit again.

Example of recommended approach:

Instead of committing a secret:
API_KEY="my-secret-key"

Use environment variables: API_KEY=process.env.API_KEY


---

## Ignoring False Positives
 
If a detection is determined to be a false positive, it can be suppressed using: .gitleaksignore


This file allows the repository to ignore specific findings while keeping the scanner active for real secrets.

---

## Security Strategy

Secret detection is part of the project's **multi-layer security strategy**.
Developer Machine
│
├─ Static Code Analysis
├─ Secret Detection (Gitleaks)
└─ Dependency Vulnerability Scanning


Running security checks **locally before code is committed** helps catch security issues earlier in the development lifecycle.

The security:secrets command runs gitleaks protect --staged, which scans only the files currently staged for commit in Git (i.e., the files added with git add). This command is typically executed as part of a pre-commit hook to prevent secrets such as API keys, tokens, passwords, or private keys from being committed to the repository. The --verbose flag provides detailed output about the scan process, while --redact ensures that detected secrets are masked in the console output to avoid exposing them in logs.

The security:secrets:full command runs gitleaks detect --source ., which performs a full repository scan, including the entire Git history and all files in the project. This allows detection of secrets that may have been committed in the past, even if the files were later modified or removed. This type of scan is typically executed in CI pipelines or security audits to identify historical credential leaks and ensure the repository remains free of exposed secrets over time.










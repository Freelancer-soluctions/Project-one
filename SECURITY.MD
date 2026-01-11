# Security Policy

## 1. Propósito

Este documento define las políticas de seguridad del proyecto con el objetivo de mitigar los riesgos identificados en el **OWASP Top 10 (2021/2024)**, con especial énfasis en **A02: Cryptographic Failures**, y extendiéndose a los controles necesarios desde **A03 en adelante**.

El contenido sirve como:

* Evidencia para auditorías de seguridad (OWASP, ISO/IEC 27001, revisiones técnicas)
* Guía para desarrolladores actuales y futuros
* Base de revisión periódica de controles de seguridad

---

## 2. Alcance

Aplica a:

* Backend: **Node.js + Express (JavaScript)**
* Frontend: **React**
* Autenticación basada en **JWT (Access + Refresh Token)**
* Comunicación cliente-servidor vía **HTTPS**

---

## 3. A02 – Cryptographic Failures

### 3.1 Algoritmos criptográficos permitidos

El proyecto **solo permite algoritmos criptográficos considerados seguros y vigentes**:

* Hash de contraseñas: `bcrypt` (cost factor ≥ 10)
* Tokens JWT: `HS256` / `RS256` (según configuración)
* Generación de entropía: `crypto.randomBytes`
* TLS: TLS 1.2 o superior

**Algoritmos explícitamente prohibidos**:

* MD5
* SHA-1
* RC4
* DES / 3DES
* AES en modo ECB

---

### 3.2 Manejo de claves y secretos

* Ninguna clave criptográfica se encuentra hardcodeada en el código fuente.
* Todas las claves se obtienen desde variables de entorno.
* Se utilizan claves separadas para:

  * Access Token
  * Refresh Token
* Las claves cumplen con longitudes adecuadas (≥ 256 bits para secretos simétricos).

---

### 3.3 Tokens JWT

* Los **Access Tokens**:

  * Son de corta duración
  * Se almacenan en `sessionStorage` del frontend
  * Se envían exclusivamente por el header `Authorization`

* Los **Refresh Tokens**:

  * Se almacenan en cookies con:

    * `httpOnly: true`
    * `secure: true`
    * `sameSite` configurado según entorno
  * Son rotados en cada uso
  * Se invalidan al cerrar sesión

---

### 3.4 Protección contra CSRF

* Se implementa el patrón **Double Submit Cookie**:

  * Cookie `csrfToken` accesible por frontend
  * Header `csrf-token` enviado explícitamente
* La validación se realiza con comparación segura (`timingSafeEqual`).
* El endpoint de refresh token está protegido contra CSRF.

---

### 3.5 Transporte seguro (TLS)

* Todo el tráfico se realiza exclusivamente sobre HTTPS.
* No se permite transmisión de tokens ni credenciales sobre HTTP.
* En producción se forzará TLS mediante infraestructura y/o proxy inverso.

---

### 3.6 Logging seguro

* Nunca se registran:

  * Contraseñas
  * Tokens JWT
  * Refresh tokens
  * Claves criptográficas
* Los logs se consideran datos sensibles y se protegen adecuadamente.

---

### 3.7 Revisión criptográfica periódica

La configuración criptográfica se revisa periódicamente para verificar:

* Algoritmos vigentes y no obsoletos
* Tamaños de clave adecuados
* Uso correcto de randomness
* Configuración TLS actualizada

---

## 4. A03 – Injection

* Uso de ORM / query builders para acceso a datos
* Validación y sanitización de entradas

Prevenir vulnerabilidades de inyección (SQL, NoSQL, ORM, Command Injection, Mass Assignment) asegurando que toda entrada proveniente del cliente sea validada explícitamente antes de ser procesada por la aplicación.

Alcance

Esta política aplica a todas las entradas externas recibidas por la aplicación, incluyendo pero no limitado a:

req.body

req.params

req.query

req.headers

req.cookies

Controles implementados
1. Validación centralizada de entrada

Toda ruta expuesta por la API DEBE aplicar un middleware de validación previo al controller, basado en esquemas explícitos.

No se permite acceso directo a req.body, req.params o req.query desde la lógica de negocio sin validación previa.

La validación se realiza mediante esquemas declarativos (Joi u otro validador equivalente).

2. Whitelisting estricto de campos

La aplicación utiliza listas blancas (whitelisting) para definir qué campos son aceptados por cada endpoint.

Solo se permiten los campos definidos en el esquema de validación.

Campos adicionales enviados por el cliente son rechazados automáticamente.

No se utilizan listas negras.

Esto mitiga:

Inyecciones indirectas

Mass Assignment

Manipulación de payloads

3. Validación por tipo, formato, longitud y rango

Cada campo de entrada es validado explícitamente según:

Tipo de dato esperado

Longitud mínima y máxima

Formato (email, fecha, UUID, etc.)

Reglas de obligatoriedad

No se aceptan valores implícitos, coerción silenciosa ni datos parcialmente válidos.

4. Corte temprano del flujo (Fail Fast)

Si la validación falla:

La petición se rechaza inmediatamente con código 400 Bad Request

El request NO alcanza la capa de controladores ni servicios

No se ejecuta lógica de negocio ni consultas a bases de datos

Esto reduce la superficie de ataque y evita que payloads maliciosos lleguen a capas sensibles.

5. Mensajes de error controlados

Los errores de validación:

No exponen estructuras internas

No revelan detalles de implementación

Devuelven únicamente mensajes de validación controlados

6. Separación entre validación y lógica de negocio

La validación de entrada está desacoplada de:

Controllers

Services

Repositories / DAOs

Esto garantiza consistencia, reutilización y cumplimiento uniforme de la política de seguridad.

Riesgos mitigados

SQL Injection

NoSQL Injection

ORM Injection

Command Injection

Mass Assignment

Manipulación de payloads

Bypass de reglas de negocio por input no validado

Cumplimiento OWASP

Esta implementación cumple con los controles recomendados por OWASP Top 10 2021 – A03: Injection, específicamente:

Validación estricta de entrada

Uso de whitelisting

Rechazo de datos inesperados

Reducción de superficie de ataque desde el input
* No se construyen queries dinámicas sin control

 
Control de exposición de registros (Data Exposure Control)

La aplicación implementa controles explícitos para evitar la exposición masiva de registros como consecuencia de consultas manipuladas o no acotadas, mitigando escenarios comunes de explotación asociados a A03: Injection. Todas las operaciones de lectura que soportan paginación utilizan valores de limit y offset validados, tipados y acotados previamente, impidiendo que el cliente fuerce consultas sin límites o con rangos arbitrarios. El acceso a datos se realiza exclusivamente mediante ORMs, query builders o consultas parametrizadas, evitando la interpolación directa de valores provenientes del cliente. Adicionalmente, el total de registros (count) requerido para paginación se obtiene mediante consultas controladas y separadas, garantizando que la lógica de conteo no reutilice ni exponga consultas dinámicas no validadas. Este enfoque reduce la superficie de ataque, previene enumeración de datos y asegura que el sistema permanezca resiliente incluso ante intentos de manipulación de parámetros de paginación o filtrado.

Validación fuerte de todos los parámetros

Validar:

Query string

Path params

Headers

JSON bodies

Cookies

Incluso en APIs publicadas o microservicios internos.
👉 Haz revisión de código para confirmar validaciones en todos los endpoints.

---

## 5. A04 – Insecure Design

* La arquitectura separa responsabilidades (controllers, services, middlewares)
* Los controles de seguridad se aplican por defecto (deny by default)
* Las decisiones criptográficas están centralizadas

---

## 6. A05 – Security Misconfiguration

* Uso de `helmet` para encabezados de seguridad
* Configuración explícita de CSP
* Deshabilitación de información sensible en headers
* Configuración estricta de CORS

---

## 7. A06 – Vulnerable and Outdated Components

* Dependencias auditadas periódicamente
* Uso de herramientas como `npm audit`
* Actualización activa de librerías críticas

---

## 8. A07 – Identification and Authentication Failures

* Autenticación basada en tokens
* Hash seguro de contraseñas
* Separación entre access y refresh tokens
* Revocación de sesión al cerrar sesión

---

## 9. A08 – Software and Data Integrity Failures

* Dependencias obtenidas de repositorios oficiales
* Uso de lockfiles
* No ejecución de código remoto dinámico

---

## 10. A09 – Security Logging and Monitoring Failures

* Logging centralizado
* Registro de eventos relevantes de seguridad
* Registro de violaciones CSP

---

## 11. A10 – Server-Side Request Forgery (SSRF)

* No se permiten URLs arbitrarias proporcionadas por el usuario
* Validación estricta de destinos externos

---

## 12. Reporte de vulnerabilidades

Las vulnerabilidades deben ser reportadas de forma responsable mediante los canales definidos por el equipo del proyecto.

---

## 13. Revisión del documento

Este documento será revisado y actualizado cuando:

* Cambien los requisitos de seguridad
* Se modifique la arquitectura
* Se detecten nuevas vulnerabilidades relevantes

---

**Última actualización:** YYYY-MM-DD

# 🛡️ Data Classification & Cryptographic Controls Guide

Este documento establece cómo se deben clasificar los datos sensibles dentro del proyecto y qué controles criptográficos aplicar según las recomendaciones de **OWASP Top 10: Cryptographic Failures**.

Su objetivo es garantizar que cualquier desarrollador pueda identificar información sensible y aplicar las medidas de seguridad correctas antes de escribir código.

---

# 📌 1. Objetivos del documento

- Definir qué datos son sensibles dentro del proyecto.
- Clasificar cada tipo de dato según su nivel de criticidad.
- Determinar qué controles criptográficos se deben aplicar.
- Evitar filtraciones, exposición accidental y malas prácticas.
- Crear un estándar interno que todos los desarrolladores deben cumplir.

---

# 🧩 2. Niveles de clasificación (OWASP)

OWASP recomienda clasificar los datos antes de elegir técnicas criptográficas.
Nuestro proyecto utilizará tres niveles:

## **Nivel 1 — Público**

Datos que no requieren protección criptográfica.
Ejemplos:

- Textos informativos.
- Contenido estático no sensible.
- Datos visibles públicamente.

**Controles requeridos:** ninguno.

---

## **Nivel 2 — Sensible**

Datos que requieren protección **en tránsito** (HTTPS) y control de acceso.
Ejemplos:

- Email del usuario.
- Nombre completo.
- Preferencias del usuario.
- Logs técnicos sin información crítica.

**Controles requeridos:**

- TLS (HTTPS obligatorio).
- No loggear estos datos sin una razón válida.
- No exponerlos a frontend si no es necesario.
- Validación de entrada.

---

## **Nivel 3 — Crítico**

Datos que deben ser protegidos incluso si la base de datos se filtra.

Ejemplos:

- Contraseñas.
- Refresh tokens.
- Tokens CSRF.
- Identificaciones personales.
- Secretos de API.
- Credenciales internas.
- Datos privados del usuario.

**Controles requeridos:**

- Hashing fuerte → `bcrypt`, `argon2`, `scrypt`.
- Cifrado AES-GCM para datos que deben ser leídos luego.
- Cookies HttpOnly + Secure + SameSite.
- Tokenización si aplica.
- Rotación de secretos.
- Nunca loggear estos datos.

---

# 🔍 3. Datos sensibles dentro del proyecto

A continuación se identifican los datos sensibles manejados actualmente por el sistema.

## **3.1 Autenticación**

| Dato          | Nivel    | Control requerido                                       |
| ------------- | -------- | ------------------------------------------------------- |
| Contraseña    | Crítico  | Hashing fuerte con bcrypt/argon2                        |
| Access Token  | Sensible | Guardar solo en sessionStorage                          |
| Refresh Token | Crítico  | Cookie HttpOnly + Secure + SameSite=strict              |
| CSRF Token    | Crítico  | Generado con crypto.randomBytes + comparación constante |

---

## **3.2 Información del usuario**

| Dato                   | Nivel    | Control requerido                    |
| ---------------------- | -------- | ------------------------------------ |
| Email                  | Sensible | Solo en tránsito (HTTPS), no loggear |
| ID interno del usuario | Sensible | No exponer salvo necesario           |
| Teléfono (si aplica)   | Crítico  | Cifrado AES-GCM recomendado          |
| Dirección (si aplica)  | Crítico  | Cifrado AES-GCM recomendado          |
| Rol / permisos         | Sensible | Exponer solo en claims seguros       |

---

## **3.3 Secretos del sistema**

| Dato                            | Nivel   | Control requerido                            |
| ------------------------------- | ------- | -------------------------------------------- |
| JWT Secret                      | Crítico | En variables de entorno + rotación periódica |
| Claves API externas             | Crítico | En variables de entorno + evitar exponer     |
| Passwords de servicios internos | Crítico | Nunca en repositorio                         |

---

# 🔐 4. Controles criptográficos obligatorios

## **4.1 Hashing de contraseñas**

- Usar `bcrypt` con **cost ≥ 12**.
- Nunca guardar contraseñas en texto plano.
- No loggear contraseñas (ni valores parciales).

---

## **4.2 Cifrado de datos almacenados (si aplica)**

Usar **AES-256-GCM** cuando un dato crítico:

- Deba mostrarse de nuevo al usuario.
- No pueda ser sustituido por hashing.

Implementación sugerida:

- AES-GCM con IV aleatorio por registro.
- Clave almacenada en variable de entorno.

---

## **4.3 Tokens de sesión**

### Access Token

- Almacenado en `sessionStorage` (no permanente).
- No marcarlo como HttpOnly para permitir lectura del frontend.

### Refresh Token

- `HttpOnly: true`
- `Secure: true` (solo HTTPS)
- `SameSite: strict`
- Rotación en cada uso.
- Asociado a un solo usuario.

---

## **4.4 CSRF Protection**

- Token generado con `crypto.randomBytes`.
- Guardado en cookie HttpOnly.
- Clonado hacia el header en frontend.
- Validación con `timingSafeEqual`.
- Solo requerido para rutas con cookies.

---

# 🛑 5. Comportamientos que están prohibidos

- Guardar contraseñas en logs.
- Guardar refresh tokens en localStorage.
- Exponer secretos del backend hacia el frontend.
- Guardar información sensible sin cifrado si debe ser recuperada.
- Dejar llaves API dentro del repositorio.
- Permitir `dangerouslySetInnerHTML` sin sanitización.

---

# 📋 6. Procedimiento para nuevos desarrollos

Siempre que un programador agregue un nuevo campo en base de datos, debe seguir este proceso:

1. **Clasificar el dato:** Público / Sensible / Crítico.
2. **Definir su tratamiento:** Hash, cifrado, tokenización o nada.
3. **Documentarlo en este archivo.**
4. **Aplicar controles criptográficos necesarios.**
5. **Validar que el dato no se loggea.**
6. **Confirmar que solo se expone a frontend si es indispensable.**
7. **Confirmar que viaja sobre HTTPS.**

---

# 📦 7. Checklist rápido para desarrolladores

- [ ] ¿El dato está clasificado?
- [ ] ¿Requiere hashing?
- [ ] ¿Requiere cifrado?
- [ ] ¿Requiere token seguro?
- [ ] ¿Este dato se loggea accidentalmente?
- [ ] ¿Este dato debe llegar al frontend?
- [ ] ¿Está protegido por Helmet + CSP?
- [ ] ¿Está protegido en tránsito con HTTPS?
- [ ] ¿Se está almacenando más información de la necesaria?

---

# 🏁 8. Estado actual del proyecto (actualizado)

Según la revisión actual, el proyecto ya cumple:

- Hashing de contraseñas.
- Tokens configurados correctamente.
- CSRF seguro.
- Helmet + CSP.
- Logger con formatos seguros.
- Cookies seguras para refresh token.

Pendiente por implementar (si aplica a futuro):

- Cifrado AES-GCM para datos altamente sensibles.
- Clasificación automática en modelos Prisma.
- Políticas internas para rotación de claves JWT.

---

# ✔ Este documento debe mantenerse actualizado

Cada nueva funcionalidad o modelo debe reflejarse aquí.
Si se agrega un nuevo dato, debe clasificarse y documentarse.

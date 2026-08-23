# Commit Signing (SSH ed25519)

> **Onboarding reproducible** para Windows/MSYS2. Documenta la clave SSH ed25519 dedicada, la configuración de Git y la subida a GitHub para que los commits queden `Verified`. Cruza referencia con la [guía pedagógica](./learning/ci-cd/05b-commit-signing.md) — este es el archivo **operativo**, no teórico.

---

## 1. Onboarding reproducible (Windows/MSYS2)

### Prerequisito: git >= 2.34

```bash
git --version
# Debe reportar versión 2.34 o superior
```

### Paso 1 — Generar clave SSH ed25519 dedicada (con passphrase)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_projectERP -C "projectERP-signing"
```

- Se te pedirá una passphrase — establece una (a diferencia de la clave de auth, esta es exclusiva para firmar commits).
- Esto crea `~/.ssh/id_ed25519_projectERP` (privada) y `~/.ssh/id_ed25519_projectERP.pub` (pública).

### Paso 2 — Subir la clave pública a GitHub

1. Copia la pública al portapapeles:

   ```bash
   clip < ~/.ssh/id_ed25519_projectERP.pub
   ```

2. En GitHub: Settings → **SSH and GPG keys** → **New SSH key**.
   - Título: **Commit signing Project One**
   - Key: pega el contenido.
   - **Tipo**: selecciona **Signing key** (Authentication key es para login SSH, NO para commits).
   - Guarda.

### Paso 3 — Configurar los 4 flags globales de Git

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519_projectERP.pub
git config --global commit.gpgsign true
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

### Paso 4 — Crear `~/.ssh/allowed_signers` (sintaxis EXACTA)

El archivo debe tener una sola línea con la siguiente sintaxis exacta (un espacio entre cada campo):

```text
jamaringarciabusiness@gmail.com namespaces="git" <contenido-de-la-clave-pub>
```

> **Crítico**: El principal del archivo debe ser el email del committer (`jamaringarciabusiness@gmail.com`), no el comentario (`-C`) que pasaste a `ssh-keygen`. El namespace `git` es el que git usa para la verificación de firmas SSH (`ssh-keygen -Y sign -n git`). Un formato incorrecto rompe la verificación local (requirement R12).

### Paso 5 — Validar: crear un commit firmado y verificar

```bash
git commit -S -m "feat: firma de prueba"
git log --show-signature
```

**Resultado esperado**: Debe aparecer una línea que contiene **"Good \"SSH\" signature"** (o "Good signature from ..." dependiendo de la versión de git). Si aparece, la configuración es correcta.

---

## 2. Troubleshooting

### Error: `! [remote rejected] main -> main (push declined)`

- **Causa**: El ruleset `Require signed commits` en `main` está activo y el commit que intentas empujar no tiene el badge `Verified` en GitHub (falta `git commit -S` o la clave no está configurada).
- **Solución**: Firma el commit localmente con `git commit -S -m "..."` y empuja nuevamente. Si usas un cliente GUI de Git, verifica que la opción "Sign commit" esté activada.

### Falsos negativos con `git log %G?` sin `allowedSignersFile`

- **Por qué NO usar `git log %G?` en CI**: La sintaxis `%G?` devuelve el ID de la clave GPG, pero para claves SSH esto es poco fiable o no está definido. Más importante aún, **sin el archivo `allowed_signers`**, `git log` no puede cruzar la firma local con las claves públicas registradas en GitHub, lo que produce `falsos N` (commits que parecen firmados localmente pero GitHub los marca `Unverified`, o viceversa).
- **Forma fiable**: Siempre consulta la [GitHub REST API](https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit) campo `.verified` en `GET /repos/{owner}/{repo}/commits/{ref}`. El job `verify-signatures` en CI usa esta vía.

### Clave no aparece `Verified` — Revisar modo vigilant + tipo de clave

- **Modo vigilant**: Si activaste **Vigilant mode** en GitHub (Settings → SSH and GPG keys), los commits legacy (previos a esta política) mostrarán `Unverified` solo de forma visual — no rompen el pipeline.
- **Signing key vs Authentication key**: Asegúrate de haber seleccionado **Signing key** al subir la clave (no Authentication key). La Authentication key se usa para el login SSH al repositorio; la Signing key es la que habilita el badge `Verified` en los commits.

---

## 3. Cross-referencia operativa

- Para la teoría completa (objetivo de aprendizaje, analogías, tabla de métodos compatibles, flujo F0-F5), consulta la [guía pedagógica](./learning/ci-cd/05b-commit-signing.md).
- Este documento (`commit-signing.md`) se centra en los pasos **operativos y reproducibles**: onboarding, configuración, troubleshooting y runbook de rotación. No duplicamos la teoría aquí, solo los comandos y configuraciones necesarias para que un nuevo dev quede productivo.

---

## 4. Runbook rotación y revocación de claves (Task 6.3)

> **Criterio de cero-downtime**: durante el solapamiento, ambos commits (vieja y nueva clave) permanecen `Verified`. No se interrumpen releases ni pipelines. La revocación de la clave antigua solo se realiza después de confirmar que cero commits recientes quedaron sin verificar con la nueva clave.

### 4.1 Procedimiento — Desarrollador (clave SSH ed25519 personal)

1. **Generar nueva clave ed25519 dedicada**

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_projectERP_new -C "projectERP-signing-v2"
   ```

2. **Añadir la `.pub` nueva como Signing Key ADICIONAL en GitHub**
   - Settings → SSH and GPG keys → New SSH key
   - Título: "Commit signing Project One v2"
   - Key: contenido de `id_ed25519_projectERP_new.pub`
   - **Tipo**: Signing key
   - Guarda. La clave antigua **sigue activa**.

3. **Actualizar la configuración local de Git** para usar la nueva clave

   ```bash
   git config --global user.signingkey ~/.ssh/id_ed25519_projectERP_new.pub
   ```

4. **Actualizar el archivo `allowed_signers`** para incluir la nueva clave (modo solapamiento)

   Edita `~/.ssh/allowed_signers` y añade una segunda línea con la nueva clave (o actualiza la existente para que tenga ambas namespaces si tu versión de git lo permite). La sintaxis por línea sigue siendo `<email> namespaces="git" <clave-pub>`. Puedes tener múltiples líneas, una por clave.

   ```text
   jamaringarciabusiness@gmail.com namespaces="git" <contenido-de-la-clave-antigua-pub>
   jamaringarciabusiness@gmail.com namespaces="git" <contenido-de-la-clave-nueva-pub>
   ```

5. **Firmar nuevos commits con la nueva clave** durante un periodo de solapamiento (mínimo 2-3 semanas o hasta que el historial lo permita).

6. **Verificar que cero commits recientes están sin verificar con la antigua clave**

   ```bash
   # Revisar la historia reciente: los commits firmados con la nueva clave deben salir Verified
   git log --show-signature -n 20
   # Confirmar que ningún commit nuevo en main usa solo la clave antigua sin la nueva
   ```

7. **Una vez confirmado cero commits recientes sin verificar con la clave antigua**:
   - **Reocar la clave antigua en GitHub**: Settings → SSH and GPG keys → Junto a la clave vieja, clic en **Delete** (o Revoke).
   - **Borrar la clave local vieja** (opcional, después de un par de semanas):

     ```bash
     rm ~/.ssh/id_ed25519_projectERP
     ```

### 4.2 Procedimiento — GitHub App (claves `APP_SSH_KEY` / `APP_SSH_PUB`)

1. **Regenerar el par de claves ed25519 para la App**
   - Genera un par SSH ed25519 nuevo: `ssh-keygen -t ed25519 -f /ruta/APP_SSH_KEY_NEW`
   - La privada será `APP_SSH_KEY_NEW` y la pública `APP_SSH_KEY_NEW.pub`.

2. **Registrar la nueva `.pub` como Signing Key de la App**
   - En la Settings de la cuenta/oorg Dueña de la App: SSH and GPG keys → New SSH key.
   - Título: "GitHub App Project One signing v2"
   - Key: contenido de `APP_SSH_KEY_NEW.pub`
   - **Tipo**: Signing key
   - Guarda.

3. **Actualizar los secrets del repositorio**
   - `APP_SSH_KEY` ← contenido de `APP_SSH_KEY_NEW` (privada, en base64 o PEM según como lo almacenes)
   - `APP_SSH_PUB` ← contenido de `APP_SSH_KEY_NEW.pub` (para que el workflow pueda leerlo si es necesario)

4. **Actualizar la configuración del workflow** (`.github/workflows/release.yml` y `.github/workflows/ci.yml` si es necesario) para que `user.signingkey` apunte a `APP_SSH_PUB` nuevo y `user.name`/`user.email` sean los de la GitHub App.

5. **Probar que los version commits + Release PR quedan `Verified`** con la nueva clave.

6. **Opcional: Revocar la clave antigua de la App** en GitHub (Settings → SSH and GPG keys) después de un periodo de solapamiento confirmado.

---

## 5. Referencias rápidas

| Tema                           | Recurso                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Generar clave ed25519          | `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_projectERP -C "projectERP-signing"`  |
| Configurar git firma           | `git config --global gpg.format ssh` / `user.signingkey` / `commit.gpgsign true` |
| Validar commit firmado         | `git log --show-signature` → "Good \"SSH\" signature"                            |
| Sintaxis allowed_signers       | `<email> namespaces="git" <clave-pub>`                                           |
| Job verify-signatures CI       | `.github/workflows/ci.yml` Stage 2 PRE-Build, API `.verified`                    |
| Ruleset Require signed commits | Configurado en `main`, bypass Admin para emergencias                             |
| Guía pedagógica completa       | [05b-commit-signing.md](./learning/ci-cd/05b-commit-signing.md)                  |
| OpenSpec change                | `openspec/changes/ci-commit-signing/`                                            |

# Sprint: Security Hardening & Audit Trail — CHANGELOG

## Archivos modificados (9 ficheros, 0 features nuevas)

| Archivo | Cambios |
|---|---|
| `server.ts` | Socket auth, document RBAC+tenant+audit, optimistic locking real |
| `src/context/SocketContext.tsx` | JWT en handshake, sin join-tenant manual |
| `src/services/auditService.ts` | Nuevos action types: DOCUMENT_ADDED, DOCUMENT_SOFT_DELETED |
| `src/services/gatesService.ts` | CFO → BACKOFFICE (roles válidos en DB) |
| `src/services/obraClient.ts` | deleteDocument ahora requiere reason |
| `src/services/transitionService.ts` | Eliminado zod (vacío en deps), validación manual equivalente |
| `src/types/obra.ts` | Eliminados prevHash/seq de TransitionRequest y ConfigChangeRequest |
| `src/components/FichaObra.tsx` | Sin prevHash/seq en calls, prompt reason al borrar doc |
| `src/tests/security-sprint.test.ts` | Tests nuevos para todo el sprint |

---

## A) Socket.io seguro por tenant

**Problema:** El cliente emitía `join-tenant` con un tenantId arbitrario → cualquier usuario podía espiar eventos de otro tenant.

**Solución:**
- **server.ts:** Middleware `io.use()` que verifica JWT en `socket.handshake.auth.token`. Extrae `tenantId` del token verificado y hace `socket.join()` automáticamente. El evento `join-tenant` desde el cliente se ignora con log de seguridad.
- **SocketContext.tsx:** Envía `auth: { token }` en la conexión. No emite `join-tenant`. Maneja errores de autenticación del socket.

## B) Documentos con seguridad + auditoría

**Problemas encontrados:**
1. Sin RBAC: cualquier rol podía subir/borrar.
2. Sin tenant check: acceso cruzado posible.
3. Bug de path traversal: `path.join(cwd, 'public', docToDelete.url)` con url = `/uploads/...` resultaba en path fuera del directorio esperado.
4. Sin audit trail: borrados/subidas no dejaban registro en cadena HMAC.
5. Hard-delete sin trazabilidad.

**Solución:**
- **RBAC:** Upload → todos los roles. Delete → solo ADMIN, BACKOFFICE, JEFE_OBRA.
- **Tenant check:** Se verifica `row.tenant_id === user.tenantId` antes de operar.
- **Path traversal fix:** `safeResolvePath()` usa `path.basename()` + `path.resolve()` + verificación de prefijo. Nunca se construye ruta directamente desde input del usuario.
- **Soft-delete:** El documento se marca con `deleted: true`, `deletedAt`, `deletedBy`, `deleteReason`. El fichero físico sí se elimina (espacio), pero el registro persiste en el JSON de documentos.
- **Audit:** `DOCUMENT_ADDED` y `DOCUMENT_SOFT_DELETED` se insertan en la misma cadena HMAC por obra con seq incremental. `verifyChain` los valida correctamente.
- **Reason obligatorio:** Para borrar un documento se requiere un motivo (string no vacío).

## C) Optimistic locking real en DB

**Problema:** El `UPDATE ... WHERE version = ?` se ejecutaba sin verificar `changes`. Si otro proceso cambiaba la versión entre el SELECT y el UPDATE, el UPDATE no modificaba nada pero el audit log se insertaba igual → log huérfano, datos inconsistentes.

**Solución:** En ambos endpoints (transition y config):
1. Se ejecuta el UPDATE primero dentro de la transacción.
2. Se verifica `updateResult.changes === 1`.
3. Si `changes === 0` → `throw new Error('VERSION_CONFLICT')` → la transacción se revierte completa (no se inserta audit log).
4. Se devuelve HTTP 409 CONFLICT al cliente.

## D) Roles consistentes

**Problema:** `gatesService.ts` usaba `'CFO'` como overrideRole, pero la tabla `users` solo permite: ADMIN, BACKOFFICE, JEFE_OBRA, INSTALADOR, COMERCIAL.

**Solución:** Reemplazado `CFO` → `BACKOFFICE` en:
- Gate S_OP_ANTICIPO (línea 86)
- Gate S_FIN_CUADRE (línea 149)

## E) Limpieza de contratos

**Problema:** El frontend calculaba `prevHash` y `seq` y los enviaba al servidor. Esto es inseguro (el cliente podría manipular la cadena) y propenso a errores de sincronización.

**Solución:**
- Eliminados `prevHash` y `seq` de `TransitionRequest` y `ConfigChangeRequest` en `types/obra.ts`.
- El servidor ya los calculaba internamente antes de llamar a `processStateTransition` → no hay cambio de comportamiento.
- `FichaObra.tsx` ya no envía estos campos.
- `obraClient.deleteDocument` ahora acepta `reason` como parámetro obligatorio.

## Nota sobre zod

El `package.json` referenciaba `zod@4.3.6` pero los node_modules estaban vacíos (zip corrupto). Como no hay red para reinstalar, se reemplazó la validación con `ConfigSchema` por una función `validateConfig()` manual que hace exactamente lo mismo: verifica que el objeto tenga exactamente 4 claves booleanas, sin extras (strict).

## Tests creados

`src/tests/security-sprint.test.ts` cubre:
1. Tenant isolation en transiciones y config changes
2. RBAC: roles correctos para upload y delete de documentos
3. Cadena audit con eventos de documentos (STATE_CHANGE + DOCUMENT_ADDED + DOCUMENT_SOFT_DELETED) + detección de tampering
4. Optimistic locking: versiones obsoletas devuelven CONFLICT
5. Roles consistentes: sin CFO en overrideRoles
6. Contrato limpio: sin prevHash/seq en tipos de cliente

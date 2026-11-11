# Spec de implementación: SSO web para Project Hub

**Para:** equipo de SofLIA Academy
**Estado:** pendiente de implementar. El lado cliente (Project Hub) ya está
implementado y en espera de estos dos endpoints — ver §7 para el estado
actual.
**Documento origen:** `learning-sso-federated-login.md` (mismo repo),
sección 11. Este archivo es la versión autocontenida, lista para pasar a un
ticket, del contrato que ahí se describe.

---

## 1. Problema que resuelve

Las cuentas creadas por Google/Microsoft en Academy no tienen password en
`auth.users` (Supabase Auth). Project Hub, igual que el Hub de escritorio
antes de este cambio, solo sabe autenticar con `signInWithPassword` — así
que esas cuentas no tienen ninguna vía de entrada a Project Hub hoy.

La solución reutiliza el mecanismo que Academy **ya implementó** para el
Hub de escritorio (ticket de un solo uso + PKCE, ver `desktop_sso_tickets`),
adaptado a un flujo de redirección HTTPS estándar en vez de un deep link
`soflia://`. No es un sistema nuevo: son dos endpoints delgados que
reutilizan la lógica de SSO y la tabla de tickets que ya existen.

## 2. Qué hay que construir

Dos endpoints nuevos, equivalentes web de los que ya existen para
escritorio:

| Ya existe (escritorio) | Nuevo (web) | Diferencia |
|---|---|---|
| `GET /api/auth/desktop/start` | `GET /api/auth/web/start` | Recibe `redirect_uri` en vez de tener el deep link fijo; valida `redirect_uri` contra whitelist. |
| `POST /api/auth/desktop/exchange` | `POST /api/auth/web/exchange` | Idéntico, sin cambios. |

No se toca `desktop_sso_tickets` ni `consume_desktop_sso_ticket`: la tabla
no distingue "para qué cliente" se pidió el ticket, así que sirve para
ambos sin cambio de esquema.

---

## 3. `GET /api/auth/web/start`

### 3.1. Query params

| Param | Requerido | Descripción |
|---|---|---|
| `state` | sí | Opaco. Project Hub lo genera y lo verifica; Academy solo debe devolverlo intacto. No interpretarlo, no loguearlo con detalle. |
| `code_challenge` | sí | Base64url de `SHA-256(code_verifier)`. Mismo formato que ya usa `/api/auth/desktop/start`. |
| `redirect_uri` | sí | URL completa de retorno. **Nuevo respecto al flujo de escritorio.** |

### 3.2. Validación de `redirect_uri` (antes de ejecutar cualquier SSO)

`redirect_uri` debe matchear **exactamente** (no solo el dominio) una entrada
de una whitelist de orígenes de Project Hub configurada en Academy:

```
http://localhost:3000/api/auth/callback/learning     (dev)
https://<dominio-de-produccion>/api/auth/callback/learning   (prod — pendiente de que Project Hub confirme su dominio final)
```

Si no matchea: responder `400 Bad Request` inmediatamente, **sin** ejecutar
el SSO con Google/Microsoft ni emitir ningún ticket. Esta validación es la
única defensa real contra que el flujo web se convierta en un redirector
abierto — ningún otro parámetro del cliente debe poder influir el destino
final de la redirección.

### 3.3. Comportamiento

1. Validar `redirect_uri` (§3.2).
2. Ejecutar (o reutilizar, si ya hay sesión web de Academy) el mismo SSO
   con Google/Microsoft que ya usa `/api/auth/desktop/start`. Sin cambios
   en esta parte — es agnóstica del cliente que la invocó.
3. Al completarse: generar el ticket igual que hoy — guardar su **hash**
   (nunca el valor en claro) junto con `code_challenge`, el `user_id`
   autenticado y una expiración corta (~1 minuto), en
   `desktop_sso_tickets` (mismo mecanismo, mismo `code_challenge` recibido
   arriba).
4. Redirigir a:
   ```
   {redirect_uri}?state={state}&ticket={ticket}
   ```
   O si el usuario cancela o el proveedor deniega:
   ```
   {redirect_uri}?state={state}&error=access_denied
   ```
   El destino de la redirección se construye **enteramente en el
   servidor**, a partir del `redirect_uri` ya validado — ningún otro
   parámetro del cliente debe alterarlo.

---

## 4. `POST /api/auth/web/exchange`

**Idéntico a `/api/auth/desktop/exchange`.** Si ya existe una función
compartida para el intercambio de escritorio, este endpoint debería ser un
wrapper delgado sobre la misma lógica.

### 4.1. Request

```http
POST /api/auth/web/exchange
Content-Type: application/json

{
  "ticket": "<valor recibido por el cliente en el redirect>",
  "code_verifier": "<PKCE verifier, nunca visto antes por Learning>"
}
```

Sin cookies — el cliente llama con `credentials: 'omit'` (o su
equivalente server-to-server; Project Hub hace este POST desde su propio
backend, no desde el navegador).

### 4.2. Comportamiento

1. Hashear el `ticket` recibido, ejecutar el consumo atómico
   (`consume_desktop_sso_ticket` o equivalente) — inválido, expirado o ya
   consumido son **indistinguibles** entre sí en la respuesta.
2. Comparar `SHA-256(code_verifier)` contra el `code_challenge` guardado
   junto al ticket. El verificador se compara **después** de haber
   consumido el ticket — un verificador incorrecto también deja el ticket
   quemado (no se puede reintentar adivinando).
3. Comprobar `organization_users.status = 'active'` para el `user_id` del
   ticket.
4. Si todo es válido: `admin.auth.admin.generateLink({ type: 'magiclink', email })`
   sobre el proyecto SOFIA.

### 4.3. Response de éxito

```http
200 OK
Cache-Control: no-store
Content-Type: application/json

{ "tokenHash": "<token_hash del magic link>" }
```

### 4.4. Respuestas de error

| Condición | HTTP | Body |
|---|---|---|
| Ticket inválido, expirado o ya consumido | 400 o 401 | `{ "error": "invalid_ticket" }` |
| Verificador no coincide | 400 o 401 | `{ "error": "invalid_ticket" }` (mismo código — no distinguir) |
| `organization_users.status != 'active'` | 403 | `{ "error": "access_denied" }` |
| Rate limit | 429 | `{ "error": "exchange_unavailable" }` |
| Error interno / DB caída | 5xx | `{ "error": "exchange_unavailable" }` |

El cliente (Project Hub) reintenta automáticamente `429`/`5xx`/errores de
red con backoff acotado (250ms, 750ms). **No reintenta 400/401/403** — son
respuestas definitivas, no transitorias.

---

## 5. Seguridad — checklist de implementación

- [ ] `redirect_uri` validado contra whitelist exacta antes de tocar el SSO
      real (§3.2). Esta es la pieza nueva más importante — sin esto, `/start`
      es un open redirect.
- [ ] El ticket se guarda **hasheado**, nunca en claro.
- [ ] Ventana de validez corta (~1 minuto) — solo tiene que sobrevivir un
      redirect y una llamada inmediata.
- [ ] La identidad sale siempre del estado de sesión que Academy ya
      estableció con Google/Microsoft, nunca de un correo/UUID que el
      cliente proponga en el body de `/exchange`.
- [ ] Taxonomía de error indistinguible: ticket inexistente, expirado, ya
      consumido o con verificador incorrecto devuelven todos
      `invalid_ticket`.
- [ ] Nada se registra en logs de éxito o fallo: ni el ticket, ni el
      verificador, ni el `tokenHash`, ni el correo — igual que en el flujo
      de escritorio.
- [ ] `Cache-Control: no-store` en la respuesta de `/exchange` (lleva un
      secreto de un solo uso).
- [ ] `state` se devuelve intacto en el redirect final, sin que Academy lo
      interprete ni lo modifique — Project Hub es quien lo firma y verifica.

## 6. Qué NO hace falta

- Ningún cambio de esquema en `desktop_sso_tickets` ni en
  `consume_desktop_sso_ticket`.
- Ninguna clave nueva del lado de Academy — la lógica de SSO con
  Google/Microsoft ya existe y se reutiliza sin cambios.
- Ningún secreto nuevo compartido con Project Hub: el contrato es HTTP
  público (ticket de un solo uso + PKCE), no una API key.

## 7. Estado del lado Project Hub (ya implementado)

Para que quien implemente esto en Academy pueda probar end-to-end sin
adivinar el contrato del otro lado:

- `GET https://<project-hub>/api/auth/learning/start?returnUrl=...` genera
  `state` + `code_challenge` y redirige a
  `{LEARNING_BASE_URL}/api/auth/web/start?state=...&redirect_uri=.../api/auth/callback/learning&code_challenge=...`.
- `GET https://<project-hub>/api/auth/callback/learning` recibe el retorno,
  hace el POST a `/api/auth/web/exchange` server-to-server, canjea el
  `tokenHash` con `verifyOtp` contra SOFIA, y completa el login local.
- Hoy el endpoint está apagado por interruptor de configuración
  (`LEARNING_SSO_ENABLED=false`) — devuelve 404 en vez de intentar el
  flujo. Se activa configurando `LEARNING_BASE_URL` y
  `LEARNING_SSO_ENABLED=true` una vez que estos dos endpoints existan.

## 8. Verificación end-to-end sugerida

Mismas cuentas de control que se usaron para validar el rollout de
escritorio:

- [ ] Cuenta solo-SSO (sin password en `auth.users`) completa el login.
- [ ] Cuenta con password normal — el flujo de password de Project Hub
      sigue funcionando sin cambios (no debería verse afectado en absoluto).
- [ ] Cuenta sin membresía activa (`organization_users.status != 'active'`)
      → `access_denied`, Project Hub no genera sesión.
- [ ] Ticket reutilizado → segundo intento falla con `invalid_ticket`.
- [ ] Ticket expirado (esperar >1 min) → `invalid_ticket`.
- [ ] `code_verifier` incorrecto → `invalid_ticket`, y el ticket queda
      consumido (no se puede reintentar con el verificador correcto).
- [ ] `redirect_uri` fuera de la whitelist → `400` inmediato en `/start`,
      sin ejecutar SSO.
- [ ] Usuario cancela el consentimiento de Google/Microsoft →
      `error=access_denied` en el redirect, Project Hub muestra el mensaje
      correspondiente sin quedar en un estado roto.

# K-pop Wars — Ranking K-pop estilo outbid.lol

MVP funcional: los fans pujan dinero real para que su grupo tome el
puesto #1. No hay ciclos ni reset — el trono es permanente hasta que
alguien pague más.

## Setup (15-20 min)

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y pega el contenido de `supabase/schema.sql`. Ejecútalo.
3. Ve a **Project Settings > API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (¡no la expongas nunca al cliente!)
4. Inserta algunos grupos de prueba desde el SQL Editor:
   ```sql
   insert into groups (name, fandom_name, slug) values
     ('BLACKPINK', 'BLINK', 'blackpink'),
     ('BTS', 'ARMY', 'bts'),
     ('Stray Kids', 'STAY', 'stray-kids');
   ```

### 2. Stripe
1. Crea una cuenta en [stripe.com](https://stripe.com) (modo test para empezar).
2. Copia tu `Secret key` de **Developers > API keys** → `STRIPE_SECRET_KEY`.
3. Configura el webhook: **Developers > Webhooks > Add endpoint**
   - URL: `https://tu-dominio.com/api/webhook` (usa [ngrok](https://ngrok.com) o `stripe listen` para probar local)
   - Evento a escuchar: `checkout.session.completed`
   - Copia el `Signing secret` → `STRIPE_WEBHOOK_SECRET`

### 3. Variables de entorno
```bash
cp .env.example .env.local
# Llena los valores reales
```

### 4. Instalar y correr
```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Pendiente antes de lanzar a producción real

Esto es un MVP funcional, no un producto listo para procesar dinero
de desconocidos sin supervisión. Antes de abrirlo al público:

- [ ] **Límites de gasto por usuario/día** — ya hay un tope por transacción
      (`BID_LIMITS.MAX_PER_TX_CENTS` en `lib/stripe.ts`), pero falta un
      tope acumulado por tarjeta/usuario en 24h para frenar gasto
      compulsivo, especialmente de menores.
- [ ] **Verificación de identidad de grupos** — decide cómo un artista/
      management "reclama" su perfil oficial (campo `claimed_by_fan`
      ya existe en el schema, falta el flujo de verificación).
- [ ] **Moderación del `supporter_name`** — es texto libre, filtra
      contenido ofensivo antes de mostrarlo en el feed público.
- [ ] **Política de reembolsos** — define reglas claras (ej. "pujas no
      reembolsables salvo error técnico") y ponlas visibles antes del pago.
- [ ] **Términos de servicio** — deja clarísimo que es un "apoyo/tip",
      no una apuesta, y que no hay retorno económico para quien paga.
- [x] El `ActivityFeed.tsx` actual solo loguea en consola los eventos
      Realtime nuevos — falta conectar esa data (necesitas el join con
      `groups`, que Realtime no incluye) y actualizar el estado visual.

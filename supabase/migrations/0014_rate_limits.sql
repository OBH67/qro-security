-- 0014_rate_limits.sql
-- E1.4 / arquitectura.md §9.8: "límite por IP y por correo en una tabla
-- de Postgres (`rate_limits`): 5 solicitudes de servicio por hora por IP,
-- 5 intentos de login por 15 minutos por correo (H2)". Solo se conecta
-- aquí el de servicios (E1) — el de login es H2, panel/auth, fuera de
-- este incremento; la tabla queda lista para ambos usos, distinguidos
-- por `scope`.
--
-- Trade-off ya aceptado en la fase de arquitectura (§9.8): un limitador
-- en Postgres agrega una escritura por intento frente a un Redis más
-- rápido, pero evita un servicio, una cuenta y una llave más que cuidar
-- a este volumen de tráfico.

create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null, -- 'servicio_ip' | 'login_email' (futuro, H2) | …
  key text not null,   -- la IP o el correo que se está limitando
  created_at timestamptz not null default now()
);

-- El limitador cuenta cuántas filas hay para (scope, key) dentro de la
-- ventana de tiempo — este índice es exactamente esa consulta.
create index rate_limits_scope_key_created_idx
  on public.rate_limits (scope, key, created_at desc);

-- Housekeeping: filas viejas no sirven para nada una vez pasada
-- cualquier ventana razonable. No hay cron de limpieza en este
-- incremento (bajo volumen, no urge) — documentado para cuando el
-- panel exista, un cron mensual con `delete where created_at < now() -
-- interval '30 days'` basta.

alter table public.rate_limits enable row level security;
create policy rate_limits_admin_read on public.rate_limits
  for select to authenticated using (public.is_admin());

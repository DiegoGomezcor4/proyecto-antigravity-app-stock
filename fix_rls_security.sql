-- PARCHE DE SEGURIDAD PARA RLS (Row Level Security)
-- =================================================

-- 1. Eliminar políticas inseguras previas
drop policy if exists "Enable access to all users" on products;
drop policy if exists "Enable access to all users" on customers;
drop policy if exists "Enable access to all users" on sales;
drop policy if exists "Public access" on products;
drop policy if exists "Public access" on customers;
drop policy if exists "Public access" on sales;

-- 2. POLÍTICAS PARA LA TABLA 'products'
-- Permitir lectura pública (Catálogo)
create policy "Allow public read access to products"
on products for select
using (true);

-- Permitir escritura solo a usuarios autenticados
create policy "Allow authenticated users to insert products"
on products for insert
to authenticated
with check (true);

create policy "Allow authenticated users to update products"
on products for update
to authenticated
using (true);

create policy "Allow authenticated users to delete products"
on products for delete
to authenticated
using (true);

-- 3. POLÍTICAS PARA LA TABLA 'customers'
-- Bloquear acceso público, solo lectura/escritura para autenticados
create policy "Allow authenticated users to manage customers"
on customers for all
to authenticated
using (true)
with check (true);

-- 4. POLÍTICAS PARA LA TABLA 'sales'
-- Bloquear acceso público, solo lectura/escritura para autenticados
create policy "Allow authenticated users to manage sales"
on sales for all
to authenticated
using (true)
with check (true);

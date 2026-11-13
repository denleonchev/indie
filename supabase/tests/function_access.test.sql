begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

create temporary view project_functions as
select p.oid, p.proname::text as name
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and not exists (
    select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
  );

select is_empty(
  $$
    select name from project_functions
    where has_function_privilege('anon', oid, 'execute')
  $$,
  'a signed-out browser can call no project function'
);

select set_eq(
  $$
    select name from project_functions
    where has_function_privilege('authenticated', oid, 'execute')
  $$,
  array['request_export'],
  'a signed-in browser can call only request_export'
);

select * from finish();

rollback;

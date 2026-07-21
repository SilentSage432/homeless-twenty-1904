-- =============================================================================
-- Homeless Twenty 1904 — Emergency SQL executor (developer console)
-- Migration: 20260720_admin_exec_sql.sql
--
-- SECURITY DEFINER function invoked ONLY by the service-role key from the
-- developer-gated /api/admin/query route. Execute is revoked from anon /
-- authenticated so it can never be reached through the anon/browser client.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  trimmed text := lower(ltrim(coalesce(query, '')));
  affected bigint;
BEGIN
  IF trimmed = '' THEN
    RETURN jsonb_build_object('type', 'command', 'rowCount', 0);
  END IF;

  -- Read statements: wrap in a subquery and aggregate rows to JSON.
  IF trimmed LIKE 'select%'
     OR trimmed LIKE 'with%'
     OR trimmed LIKE 'table %'
     OR trimmed LIKE 'values%' THEN
    EXECUTE format(
      'SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t',
      rtrim(query, E' \n\t;')
    ) INTO result;
    RETURN jsonb_build_object('type', 'rows', 'rows', result);
  END IF;

  -- Write / DDL statements: execute and report affected row count.
  EXECUTE query;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN jsonb_build_object('type', 'command', 'rowCount', affected);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_exec_sql(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exec_sql(text) TO service_role;

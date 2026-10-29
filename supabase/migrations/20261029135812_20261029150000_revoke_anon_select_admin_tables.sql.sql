/*
  # Remove anon SELECT on admin tables

  admin_authorizations and admin_audit_log had anon SELECT grants carried over
  from the original migration. Only authenticated admins need to read these.
*/

REVOKE SELECT ON public.admin_authorizations FROM anon;
REVOKE SELECT ON public.admin_audit_log FROM anon;

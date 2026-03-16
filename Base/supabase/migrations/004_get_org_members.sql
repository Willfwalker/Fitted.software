-- Function to list org members (joined with auth.users for email/name)
-- Security definer: runs as the function owner, but validates caller membership
create or replace function get_org_members(target_org_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  full_name text,
  role text,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Verify caller is a member of the target org
  if not exists (
    select 1 from public.organization_members om
    where om.org_id = target_org_id
      and om.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this organization';
  end if;

  return query
    select
      om.id as member_id,
      om.user_id,
      u.email::text,
      coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::text as full_name,
      om.role::text,
      om.created_at as joined_at
    from public.organization_members om
    join auth.users u on u.id = om.user_id
    where om.org_id = target_org_id
    order by
      case om.role
        when 'OWNER' then 0
        when 'ADMIN' then 1
        when 'MEMBER' then 2
        else 3
      end,
      om.created_at asc;
end;
$$;

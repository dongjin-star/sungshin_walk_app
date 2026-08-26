-- 계정 자기 삭제 RPC — SUPABASE_SERVICE_ROLE_KEY 없이 계정 삭제를 지원한다.
-- security definer로 함수 소유자(마이그레이션을 실행한 postgres 롤) 권한을
-- 빌려 auth.users를 지운다. 호출자는 자기 자신(auth.uid())만 지울 수 있다 —
-- 대상 id를 인자로 받지 않는 것 자체가 소유권 검증이다.
--
-- photos·tags·profiles는 auth.users를 on delete cascade로 참조하므로
-- 이 함수 하나로 함께 정리된다 (0001_init.sql). Storage 객체는 FK로
-- 엮여 있지 않아 호출부(app/api/account/route.ts)에서 먼저 지워야 한다.

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  delete from auth.users where id = v_user;
end;
$$;

revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;

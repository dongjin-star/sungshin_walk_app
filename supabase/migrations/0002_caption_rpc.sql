-- 캡션 호출 레이트리밋 + 태그 부착 RPC — WALK-PRD.md 18.2-3, 17장
-- security invoker로 실행되어 auth.uid() 기준 RLS를 그대로 따른다.
-- 서버리스는 상태가 없으므로 반드시 DB에서 카운트해야 한다.

create or replace function consume_caption_quota(p_limit int default 60)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_calls int;
  v_window timestamptz;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  select caption_calls_1h, calls_window_at into v_calls, v_window
  from profiles where id = v_user
  for update;

  if v_window is null or now() - v_window > interval '1 hour' then
    update profiles set caption_calls_1h = 1, calls_window_at = now() where id = v_user;
    return true;
  end if;

  if v_calls >= p_limit then
    return false;
  end if;

  update profiles set caption_calls_1h = caption_calls_1h + 1 where id = v_user;
  return true;
end;
$$;

-- 캡션 생성 결과의 태그를 붙인다. 기존 태그 재사용 우선(use_count 증가),
-- 새 태그는 새로 만든다. 사진 소유권은 RLS를 통해 이미 auth.uid()로
-- 검증되지만, 여기서도 명시적으로 재확인한다.
create or replace function attach_tags(p_photo_id uuid, p_tag_names text[])
returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_name text;
  v_tag_id uuid;
begin
  if not exists (select 1 from photos where id = p_photo_id and user_id = v_user) then
    raise exception 'photo not found or not owned by caller';
  end if;

  delete from photo_tags where photo_id = p_photo_id;

  foreach v_name in array p_tag_names loop
    if length(trim(v_name)) = 0 then
      continue;
    end if;

    insert into tags (user_id, name, use_count)
    values (v_user, v_name, 1)
    on conflict (user_id, name) do update set use_count = tags.use_count + 1
    returning id into v_tag_id;

    insert into photo_tags (photo_id, tag_id) values (p_photo_id, v_tag_id)
    on conflict do nothing;
  end loop;
end;
$$;

grant execute on function consume_caption_quota(int) to authenticated;
grant execute on function attach_tags(uuid, text[]) to authenticated;

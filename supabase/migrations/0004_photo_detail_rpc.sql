-- 사진 상세 화면 전용 조회 RPC. geography -> lng/lat 변환과 태그 배열
-- 조립을 서버에서 한 번에 끝내 클라이언트 왕복을 줄인다.

create or replace function get_photo_detail(p_photo_id uuid)
returns table (
  id uuid,
  storage_path text,
  lng double precision,
  lat double precision,
  accuracy_m numeric,
  captured_at timestamptz,
  source text,
  user_note text,
  caption_ai text,
  caption_user text,
  mood mood_key,
  mood_edited boolean,
  status text,
  retry_count int,
  tags text[]
)
language sql
security invoker
stable
as $$
  select
    p.id,
    p.storage_path,
    case when p.location is not null then ST_X(p.location::geometry) end,
    case when p.location is not null then ST_Y(p.location::geometry) end,
    p.accuracy_m,
    p.captured_at,
    p.source,
    p.user_note,
    p.caption_ai,
    p.caption_user,
    p.mood,
    p.mood_edited,
    p.status,
    p.retry_count,
    coalesce(
      (select array_agg(t.name order by t.name) from photo_tags pt join tags t on t.id = pt.tag_id where pt.photo_id = p.id),
      array[]::text[]
    )
  from photos p
  where p.id = p_photo_id and p.user_id = auth.uid();
$$;

grant execute on function get_photo_detail(uuid) to authenticated;

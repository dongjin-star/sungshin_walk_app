-- 지도 bbox 쿼리 + 대시보드 집계 RPC — WALK-PRD.md 8장, 11장
-- 요일 계산은 반드시 Asia/Seoul 기준 (밤 9시 이후 사진의 요일이 밀리는
-- 버그를 방지 — PRD 리스크 #9). 집계는 Postgres에서 수행하고 사진을
-- 클라이언트로 통째로 내려받지 않는다.

create or replace function get_photos_in_bbox(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision,
  p_limit int default 500
)
returns table (
  id uuid,
  storage_path text,
  lng double precision,
  lat double precision,
  mood mood_key,
  status text,
  caption text
)
language sql
security invoker
stable
as $$
  select
    p.id,
    p.storage_path,
    ST_X(p.location::geometry) as lng,
    ST_Y(p.location::geometry) as lat,
    p.mood,
    p.status,
    coalesce(p.caption_user, p.caption_ai) as caption
  from photos p
  where p.user_id = auth.uid()
    and p.location is not null
    and p.location::geometry && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  order by p.captured_at desc
  limit p_limit;
$$;

create or replace function dashboard_summary()
returns table (photo_count bigint, day_count bigint, tag_count bigint)
language sql
security invoker
stable
as $$
  select
    count(*) as photo_count,
    count(distinct (captured_at at time zone 'Asia/Seoul')::date) as day_count,
    (select count(*) from tags where user_id = auth.uid()) as tag_count
  from photos
  where user_id = auth.uid();
$$;

-- dow: 0=월 ... 6=일 (isodow 1~7을 0~6으로 이동)
create or replace function dashboard_weekday()
returns table (dow int, photo_count bigint)
language sql
security invoker
stable
as $$
  select
    (extract(isodow from captured_at at time zone 'Asia/Seoul')::int - 1) as dow,
    count(*) as photo_count
  from photos
  where user_id = auth.uid()
  group by 1
  order by 1;
$$;

create or replace function dashboard_mood()
returns table (mood mood_key, photo_count bigint)
language sql
security invoker
stable
as $$
  select mood, count(*) as photo_count
  from photos
  where user_id = auth.uid() and mood is not null
  group by mood;
$$;

create or replace function dashboard_tag_cloud(p_limit int default 30)
returns table (name text, use_count int)
language sql
security invoker
stable
as $$
  select name, use_count
  from tags
  where user_id = auth.uid()
  order by use_count desc
  limit p_limit;
$$;

grant execute on function get_photos_in_bbox(double precision, double precision, double precision, double precision, int) to authenticated;
grant execute on function dashboard_summary() to authenticated;
grant execute on function dashboard_weekday() to authenticated;
grant execute on function dashboard_mood() to authenticated;
grant execute on function dashboard_tag_cloud(int) to authenticated;

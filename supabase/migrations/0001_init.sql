-- 워크크(PINWALK) 초기 스키마 — WALK-PRD.md 16장 기준
-- 모든 테이블에 RLS를 켠다. 예외 없다 (16.1). 조인 테이블(photo_tags)도 포함.

create extension if not exists postgis;

create table if not exists profiles (
  id                uuid primary key references auth.users on delete cascade,
  display_name      text,
  onboarded_at      timestamptz,
  caption_calls_1h  int         not null default 0,
  calls_window_at   timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

do $$ begin
  create type mood_key as enum
    ('calm','warm','lonely','lively','dreamy','fresh','cozy','strange');
exception
  when duplicate_object then null;
end $$;

create table if not exists photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  client_id     uuid unique,                          -- 오프라인 큐 dedupe용 클라이언트 생성 UUID

  storage_path  text not null,
  width         int,
  height        int,

  location      geography(Point, 4326),   -- 촬영 시점 Geolocation (EXIF 아님)
  accuracy_m    numeric,                  -- null = 위치 없음
  captured_at   timestamptz not null,
  source        text not null default 'camera' check (source in ('camera', 'gallery')),

  user_note     text,                     -- "한마디" (선택)

  caption_ai    text,                     -- AI 원본. 절대 덮어쓰지 않음
  caption_user  text,                     -- 사용자 수정본
  mood          mood_key,
  mood_edited   boolean not null default false,

  status        text not null default 'pending'
    check (status in ('queued_offline','pending','generating','ready','failed','no_location')),
  retry_count   int  not null default 0,
  error_code    text,
  prompt_version text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists photos_loc_idx  on photos using gist (location);
create index if not exists photos_time_idx on photos (user_id, captured_at desc);
create index if not exists photos_mood_idx on photos (user_id, mood);

create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  use_count  int  not null default 0,
  unique (user_id, name)
);

create table if not exists photo_tags (
  photo_id uuid references photos on delete cascade,
  tag_id   uuid references tags   on delete cascade,
  primary key (photo_id, tag_id)
);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists photos_set_updated_at on photos;
create trigger photos_set_updated_at
  before update on photos
  for each row execute function set_updated_at();

-- 신규 가입 시 profiles 행 자동 생성
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS -----------------------------------------------------------------

alter table profiles   enable row level security;
alter table photos     enable row level security;
alter table tags       enable row level security;
alter table photo_tags enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own photos" on photos;
create policy "own photos" on photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own tags" on tags;
create policy "own tags" on tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own photo_tags" on photo_tags;
create policy "own photo_tags" on photo_tags
  for all using (
    exists (select 1 from photos p
            where p.id = photo_tags.photo_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from photos p
            where p.id = photo_tags.photo_id and p.user_id = auth.uid())
  );

-- Storage: private 버킷, 서명 URL로만 접근 (public 절대 금지)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "own storage objects" on storage.objects;
create policy "own storage objects" on storage.objects
  for all using (
    bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

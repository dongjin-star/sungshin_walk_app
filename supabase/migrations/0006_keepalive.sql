-- GitHub Actions keep-alive ping 전용 테이블. 앱 스키마와 무관, anon 키로 읽기만 허용.

create table if not exists keepalive (
  id        int primary key default 1,
  pinged_at timestamptz not null default now()
);

insert into keepalive (id) values (1) on conflict (id) do nothing;

alter table keepalive enable row level security;

drop policy if exists "anon can read keepalive" on keepalive;
create policy "anon can read keepalive" on keepalive
  for select using (true);

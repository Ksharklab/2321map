create extension if not exists pgcrypto;
create table if not exists public.profiles(
 id uuid primary key default gen_random_uuid(),
 public_name text not null default '待填写',
 school text not null default '',
 province text not null default '',
 province_adcode text not null default '',
 city text not null default '',
 city_adcode text not null default '',
 lng double precision,
 lat double precision,
 message text not null default '',
 is_visible boolean not null default false,
 is_approved boolean not null default true,
 edit_token_hash text not null unique,
 pin_hash text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

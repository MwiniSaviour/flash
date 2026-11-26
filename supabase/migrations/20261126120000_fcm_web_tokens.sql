-- FCM web tokens share the same table as Web Push and native tokens.
alter table public.notification_tokens
  drop constraint if exists notification_tokens_platform_check;

alter table public.notification_tokens
  add constraint notification_tokens_platform_check
  check (platform in ('web', 'fcm', 'android', 'ios'));

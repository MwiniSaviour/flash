-- Flash — how a business gets paid.
--
-- The platform collects the customer's money through Paystack. Sellers are
-- paid out to the recipient they register here, so the details belong to the
-- business, not to the person's profile.

alter table public.businesses
  add column settlement_bank text not null default '',
  add column settlement_account text not null default '',
  add column settlement_type text not null default 'mobile_money',
  add column transfer_recipient_code text not null default '',
  add column settlement_verified boolean not null default false;

alter table public.businesses
  add constraint businesses_settlement_type_allowed
  check (settlement_type in ('mobile_money', 'nuban'));

comment on column public.businesses.transfer_recipient_code is
  'The Paystack transfer recipient Flash pays after a fulfilled sale.';

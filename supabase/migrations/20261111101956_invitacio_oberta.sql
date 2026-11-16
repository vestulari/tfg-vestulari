-- Data en què el destinatari ha obert la invitació (null = encara sense obrir).
alter table public.invitacions add column oberta_el timestamptz;
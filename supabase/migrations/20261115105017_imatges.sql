-- Imatges de les entitats i dels usuaris. Es guarda la clau de l'objecte a l'R2 (no la URL),
-- perquè les URL són temporals i les genera l'API cada cop que algú té permís per veure la imatge.
alter table public.entitats add column imatge_clau text;
alter table public.usuaris add column imatge_clau text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_photo_url text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_height_cm integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_height_cm integer;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_weight_kg integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_weight_kg integer;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_hair_color text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_hair_color text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_eye_color text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_eye_color text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_appearance text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_appearance text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_orientation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_orientation text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_zodiac_sign text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_zodiac_sign text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_dominant_role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_dominant_role text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_bdsm_preference text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_bdsm_preference text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_smoker text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_smoker text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner1_children text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner2_children text;
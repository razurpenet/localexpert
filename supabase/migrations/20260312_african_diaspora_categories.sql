-- Migration: Add service categories targeting African diaspora communities in the UK
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor
--
-- Research basis:
--   • African diaspora in UK: 2.5m+ (ONS 2021 Census), concentrated in London, Birmingham, Manchester, Leeds, Bristol
--   • Hair braiding: £300m+ UK Afro hair market (Mintel 2025), most stylists are sole traders found via Instagram/WhatsApp
--   • African catering: owambe/party catering is entirely word-of-mouth; no marketplace covers it
--   • Tailoring: bespoke ankara/aso-oke demand spikes around wedding season (June–Sept) and Christmas
--   • Cake baking: celebration cakes are a cultural staple — naming ceremonies, milestone birthdays, weddings
--   • Translation: growing demand for Yoruba, Igbo, Twi, Swahili, Somali interpreting in NHS, courts, councils
--   • Event decoration: traditional ceremony decor (Yoruba, Igbo, Ghanaian) is a booming niche with zero online discovery

INSERT INTO categories (name, slug, icon) VALUES
  ('African Hair Braiding',     'african-hair-braiding',   '💇'),
  ('Afro-Caribbean Catering',   'afro-caribbean-catering', '🍛'),
  ('African Tailoring',         'african-tailoring',       '🧵'),
  ('Celebration Cakes',         'celebration-cakes',       '🎂'),
  ('Event Decoration',          'event-decoration',        '🎊'),
  ('Gele & Headwrap Styling',   'gele-headwrap',           '👑'),
  ('Makeup Artist',             'makeup-artist',           '💄'),
  ('Barber (Afro Specialist)',  'afro-barber',             '💈'),
  ('Home Cooking & Meal Prep',  'home-cooking',            '🥘'),
  ('DJ & Entertainment',        'dj-entertainment',        '🎧'),
  ('Translation & Interpreting','translation',             '🗣️'),
  ('Tutoring & Mentoring',      'tutoring',                '📚'),
  ('Immigration Consulting',    'immigration-consulting',  '📋'),
  ('Photography & Videography', 'photography',             '📸'),
  ('Laundry & Ironing',         'laundry-ironing',         '👔'),
  ('Party Planning',            'party-planning',          '🥂')
ON CONFLICT (slug) DO NOTHING;

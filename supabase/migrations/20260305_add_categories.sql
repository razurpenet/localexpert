-- Migration: Add 12 new data-backed service categories
-- Date: 2026-03-05
-- Research basis:
--   • Locksmith/Roofer/Handyman: 110k/33k/22k monthly UK Google searches
--   • Appliance Repair: DASA shortage report; Right to Repair law boosting demand
--   • Mobile Mechanic: 183k+ UK technician vacancies (Skills England 2025)
--   • Pet Care: UK market £143m → £263m by 2030 (9.7% CAGR); 59% UK HH own pets
--   • Home/Elderly Care: £6.7bn domiciliary care market; 48% providers can't meet demand
--   • Childcare: 50k critical-demand vacancies (Skills England 2025)
--   • Personal Training: consistently in UK in-demand occupations 2025
--   • Pest Control: universal urgent need, profoundly local, hard to discover online
--   • Solar & EV Install: green transition + government targets driving demand
--   • Event Planning: Bark.com fastest-growing category; entirely word-of-mouth today
--   • Driving Instruction: post-COVID waiting lists never fully cleared; ADIs sole traders

INSERT INTO categories (name, slug, icon) VALUES
  ('Locksmith',             'locksmith',          '🔒'),
  ('Roofing',               'roofing',            '🏠'),
  ('Appliance Repair',      'appliance-repair',   '🔌'),
  ('Mobile Mechanic',       'mobile-mechanic',    '🚗'),
  ('Pet Care',              'pet-care',           '🐾'),
  ('Home & Elderly Care',   'home-care',          '🏥'),
  ('Childcare',             'childcare',          '👶'),
  ('Personal Training',     'personal-training',  '💪'),
  ('Pest Control',          'pest-control',       '🐀'),
  ('Solar & EV Install',    'solar-ev',           '☀️'),
  ('Event Planning',        'event-planning',     '🎉'),
  ('Driving Instruction',   'driving-instruction','🚦')
ON CONFLICT (slug) DO NOTHING;

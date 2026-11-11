-- Remove only the previously free Lamine Yamal starter entitlement.
-- Keep every other owned character, coin balance, and player statistic unchanged.
UPDATE public.profiles
SET
  unlocked_characters = array_remove(
    COALESCE(unlocked_characters, ARRAY[]::text[]),
    'yamal-19'
  ),
  equipped_character_id = CASE
    WHEN equipped_character_id = 'yamal-19' THEN
      COALESCE(
        (array_remove(COALESCE(unlocked_characters, ARRAY[]::text[]), 'yamal-19'))[1],
        ''
      )
    ELSE equipped_character_id
  END
WHERE
  'yamal-19' = ANY(COALESCE(unlocked_characters, ARRAY[]::text[]))
  OR equipped_character_id = 'yamal-19';

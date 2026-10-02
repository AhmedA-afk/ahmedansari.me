# Gullak — Google Flow asset prompts

Generate these in Flow (Imagen for stills; Veo only for the optional hero shots), then upload them back here.
I composite everything: the gullak (clay pot in the chest), coins, light, camera, transitions and sound are all done in code,
so **don't ask Flow for the gullak** — characters just wear normal clothes.

## 0. Style line — paste at the start of EVERY prompt

> Japanese anime film style in the spirit of Kyoto Animation and "A Silent Voice": clean delicate line art, soft two-tone cel shading,
> gentle rim light, warm cinematic colour, painterly detail, expressive but natural faces, realistic proportions (not chibi), high detail, 4K.

## 1. Characters (priority order)

Rules for every character image:
- **Plain flat background, solid light grey (#D9D9D9)**, no shadows on the floor, no props, no text — I cut them out.
- Full body, standing, arms relaxed at the sides, 16:9 or square, character large in frame.
- Make one **sheet per character**: front view + three-quarter view side by side, then a second image with 4 face close-ups.
- Keep the same description word-for-word every time (consistency). In Flow, reuse the first good result as the reference ("ingredient") for the rest.

**1a. Him, adult (age 26) — the main character**
> [style line] Character sheet, front view and three-quarter view, of a 26-year-old Indian man, slim build, warm medium-brown skin,
> short messy black hair with soft fringe, kind tired eyes, clean-shaven, wearing a plain mustard-yellow button-up shirt with sleeves
> rolled to the elbows, dark blue jeans, brown shoes. Plain flat light grey background.

Expressions sheet (same character, close-up faces, 2×2 grid): gentle smile · quiet sadness with wet eyes · empty, numb stare · surprised wonder.

Outfit variants (same face/prompt, swap clothes): grey-blue office shirt and grey trousers · dark grey hoodie (the cold arc) · fantasy game armour, deep blue plates with gold trim.

**1b. Him as a child (age 6) and teen (age 14)**
> [style line] Character sheet, front and three-quarter view, of the same boy at age 6 [then: age 14]: warm medium-brown skin,
> messy black hair, big curious eyes, mustard-yellow t-shirt, blue shorts [teen: blue jeans]. Plain flat light grey background.

**1c. The warrior queen (game)**
> [style line] Character sheet, front and three-quarter view, of a tall slender young woman, age 25, bold and striking, sharp confident eyes,
> long black hair in a high ponytail, fantasy armour in deep wine-red and black with gold trim, twin slim blades on her back.
> Plain flat light grey background.

Expressions: confident smirk · laughing mid-fight · cold, contemptuous stare · shouting in anger.

**1d. The office girl (the one who heals him)**
> [style line] Character sheet, front and three-quarter view, of a 25-year-old Indian woman, simple and beautiful, grounded and warm,
> soft round face, gentle eyes, warm brown skin, long dark hair in a loose side braid with a small peach flower, cream cotton kurta with
> mustard-gold border, simple sandals. Plain flat light grey background.

Expressions: bright cheerful smile · curious head-tilt · calm tender look · eyes closed, peaceful.

**1e. Supporting cast (one sheet each, lower priority)**
- Mother, early 40s, Indian, warm smile, maroon cotton saree, hair in a bun, small bindi.
- Father, mid 40s, Indian, grey-flecked short hair, round glasses, grey-blue shirt.
- The friend who cries, 26, Indian woman, shoulder-length bob, lavender kurta.
- The friend who leaves on the train, 26, Indian man, teal t-shirt.
- The manager, late 40s, dark suit, red tie, stern.

## 2. Backgrounds — **no people**, 16:9, wide, 4K

Same style line, then:
1. **Childhood living room, morning:** a warm Indian middle-class living room, cream walls, window with pink curtains and soft sunlight, a low wooden study desk on a red patterned rug, a brown sofa, a floor lamp, books on a shelf, dust motes in the light. *(Please also generate a tall 9:16 version of the same room — the film starts in portrait.)*
2. **School sports field, sunny afternoon:** running track, finish-line posts, stands full of blurred colourful crowd, green hills.
3. **Front of the family home at dusk:** open warm-lit doorway, a quiet street leading to a distant city skyline under a purple-orange sky.
4. **Open-plan office, grey and lifeless:** rows of desks and monitors, big window with city skyline, fluorescent light, wall clock, a little dust.
5. **Train platform at dusk:** empty platform, rails, station lights, a soft orange sky.
6. **City park bench at dusk:** a wooden bench under a street lamp, trees, a path, first stars.
7. **Gamer's bedroom at night:** dark blue walls, neon pink and cyan LED strips, posters, a big monitor glowing.
8. **Fantasy game arena at twilight:** floating rock islands, glowing teal and violet crystals, a huge moon, a magic circle on the stone floor.
9. **Rainy city street at night:** stone steps in front of a building, one cold street lamp, wet reflections, dark windows.
10. **The lit river at sunset — the most important frame:** a calm wide river flowing toward a huge low sun on the right horizon, hundreds of glowing paper lanterns floating on the water, grassy bank in the foreground, distant trees in silhouette, magical warm light. *(Composition: sun on the right, river widening toward the bottom-left.)*

## 3. Optional Veo hero shots (only if credits allow; 5–8 s each, no dialogue, ask for no music)

Use the character sheets as references.
1. Close-up: the man's face as something shatters in front of him — eyes widen, tears form, slow motion, dark desaturated light.
2. Close-up: the office girl gently places her palm on his chest; warm golden light blooms under her hand; he closes his eyes.
3. Wide: the two of them standing side by side at the lantern river at sunset, holding hands, slowly turning their faces to each other and smiling.

## 4. How to send them back
- Name files like `char_hero_adult_sheet.png`, `char_queen_expressions.png`, `bg_10_river.png`, `veo_3_ending.mp4`.
- Upload here in chat, or commit them to `reel/gullak/assets/` on this branch (or to `claude_videos`).
- Start with **1a, 1d, 1c and background 10**: that's enough for me to build the style-test frame and judge the look before you generate the rest.

# Working rules for the Watch Design Studio

## Complications need a movement that drives them

A complication on a dial (date, day, power reserve, small seconds, moon
phase, GMT, chronograph registers, anything a hand or disc must show) is only
designed in when **both** are known:

1. the movement that drives it, by name and calibre; and
2. that this movement fits the case being drawn (diameter, height, stem
   position, dial feet).

The movement in each case is the one in its case record (`movement:` and
`sheet.movement`), for example the Soprod P024 *without date* in the
Time Keeper × Nivada F77: centre seconds, no date, no power reserve, no
small seconds.

If the movement does not drive a complication, or there is no information
that a movement which does would fit the case, **leave the complication out**.
Take the inspiration's theme instead: its palette, numerals, hands, textures,
layout and strap. Say in the design's research note what was left out and why.
Never add a complication and leave the mismatch to a warning.

The app follows the same rule. The Power reserve section and the small
seconds hand are offered only where the case's movement drives them
(`MORE_NEED.powerReserve`, `MORE_ONLY["sub.hand"]`), and the checks
"Date and the movement", "Power reserve and the movement" and "Small seconds
and the movement" must pass for every design in `concepts/`
(tests/phase2.test.cjs).

## Releases

Bump `APP_VERSION` and `package.json` together (`npm version X.Y.Z
--no-git-tag-version`), update the version test in `tests/guided.test.cjs`,
add a README section and a test in `tests/phase2.test.cjs`, and commit only
when `npm test` ends with `# fail 0`.

## Words

Arabic: Case is «قالب», Movement is «محرك». Reference pictures go on grey
backgrounds.

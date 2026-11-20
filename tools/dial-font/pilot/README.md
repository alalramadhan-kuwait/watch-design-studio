# Pilot Study

Figures lifted from IWC's own product photograph of the Big Pilot's Watch 43,
reference IW329301 (straight on, about 150 px a figure; the photograph is not
kept here): the Type A pilot's figures, applied lume, light on a black dial
(`"dark": false`). The hands touch three figures, each freed in its own way
(`spec.json`):

- the 0 of the 10 meets the hour hand's tip: cut out by its box and rebuilt
  from its left half (the 0 is symmetric), its centre line taken near the top
  where the hand does not reach (`mirror_band`);
- the seconds hand crosses the 7's bar: along the hand's path, whatever is
  thinner than the hand is taken away (`unline`) and the seam across the bar
  closed along the bar (`unline_fill`);
- the minute hand's shadow dims the 2's top: that corner brightened back
  (`boost`) inside a wider traced region (`keep_px`), and a spur left by the
  shadow's edge opened away in the build (`open_per`).

Every figure measured square; weight as printed; the 3's flat top sits on the
line; outlines fitted with smooth curves between their corners.

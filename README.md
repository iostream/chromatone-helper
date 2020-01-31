User Reference
==============

[Try the Chromatone Janko Tool!](https://iostream.github.io/chromatone-helper/ "Chromatone Janko Tool by iostream")

You can also use it offline in most web browsers, also on mobile devices! [Just save this link as an HTML file](https://github.com/iostream/chromatone-helper/raw/master/dist/chromatone/chromatone-combined-index.html "Download the Chromatone Janko Tool") and then run it locally in your web browser!

Example of the latest new feature, arpeggios (one feature still is missing), click the link and then click the save button to export as MIDI: [link](https://iostream.github.io/chromatone-helper/#chords=1t12Va+4Vb+6Vc+1t12Vd%2C%0D%0A6+5+1+2%0D%0A&voicing=a%3A+1+5+10+9+10+5+10+5%0D%0Ab%3A+5+10+15+14+15+10+15+10%0D%0Ac%3A+3+9+13+12+13+9+13+9%0D%0Ad%3A+1+8+10+9+10+8+10+8+1+8+10+9+10+8+10+7%0D%0Aa%0D%0A&zebra_root=-17&scale[0]=r1+2+3+4+5+6+7&rhythms=1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1&arp=>*)

[Current development version](https://iostream.github.io/chromatone-helper/v2-dev/ "Chromatone Janko Tool v2 development by iostream")

Voicings
--------

* the last voicing which has no name, becomes the default voicing


Development
===========

How to develop
--------------

For initial setup, run: `npm install`.

For development, run:

```
npm run watch
```

Then open `chromatone-index.html` in your web browser and reload it everytime you changed any source code to see the effects. There is no server side code. The tool runs completely in the web browser.

How to build
------------

```
npm run build
```

Creates `dist/chromatone/chromatone-combined-index.html` which contains everything in one file. This way the tool also works on mobile web browsers!

Feature wishes
--------------
- Actual user reference
- Reaper-DAW integration
- Voicings
   * allow usage of accidentals in voicings
   * allow usage of all chord modifiers also in voicings
   * [x] include voicing in MIDI export
   * enable voicings like this (beginning from comma does not exist yet), examples:
      * 1 3 5 6, -2 (drop 2 voicing)
      * 1 3 5 6, -4 (African jazz voicing I learned on Youtube)
      * how to enable doubling? `1 3 5 6 6, -4` is not possible, because it would interupt the inversions (or change invert() algorithm?)
        maybe `1 3 5 6, -4 4`
   * transposing using intervals: e.g. 1Tb3 (1tb3 should not be possible?), instead of 1t3
   * Bug: Using the voicings definition: `defaultVoicing` leads to endless recursion ("too much recursion" error in Firefox)

- GUI
   * make it possible to switch between note naming modes: `relative` (each note is named by its chord interval, no matter the inversion), `absolute` (shows the actual intervals, starting from the lowest note), and maybe make it so, that the absolute naming can be starting from the highest note
   * better diff to next chord: just superimpose the next chord!
   * render chord specifications next to the chord visualisation and enable modifications of the chord definition via just clicking on the visualisations or symbols next to them (e.g. transpose via `+`,`-`)

- Automatic Inversions
   * better/always working automatic chord transition inversion optimization
   * allow disabling of automatic chord transition inversion optimization (maybe this works using e.g. 1i0)
   * add new mode: optimize for best voice leading

- Chord-Length (first only for MIDI generation)
   * default length of a chord is one bar
   * change length examples:
      * 2 bars, a forth note: `1L2`, `1L1/4`
      * 2,5 bars: `1L2L1/2` or `1L2.5`

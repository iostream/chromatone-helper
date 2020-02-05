User Reference
==============

[Try the Chromatone Janko Tool!](https://iostream.github.io/chromatone-helper/ "Chromatone Janko Tool by iostream")

You can also use it offline in most web browsers, also on mobile devices! [Just save this link as an HTML file](https://github.com/iostream/chromatone-helper/raw/master/dist/chromatone/chromatone-combined-index.html "Download the Chromatone Janko Tool") and then run it locally in your web browser!

Example of one of the latest new features, arpeggios, click the link and then click the save button to export as MIDI: [link](https://iostream.github.io/chromatone-helper/#chords=1t12Va+4Vb+6Vc+1t12Vd%2C%0D%0A6+5+1+2%0D%0A&voicing=a%3A+1+5+10+9+10+5+10+5%0D%0Ab%3A+5+10+15+14+15+10+15+10%0D%0Ac%3A+3+9+13+12+13+9+13+9%0D%0Ad%3A+1+8+10+9+10+8+10+8+1+8+10+9+10+8+10+7%0D%0Aa%0D%0A&zebra_root=-17&scale[0]=r1+2+3+4+5+6+7&rhythms=1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1&arp=>*)

The [Current development version / latest version](https://iostream.github.io/chromatone-helper/v2-dev/ "Chromatone Janko Tool v2 development by iostream") includes many new features, including a new bracket syntax (documentation will follow) for definining chord definitions and new instruments like guitar and ukulele.

Features
--------
- Declarative DSL for creating chord progressions and arpeggios, using:
  - scales, e.g. `1 2 b3 4 5 b6 b7` (in the latest version also using a key)
  - voicings, e.g. `1 3 5 7`
  - rhythms, e.g. `1 1 3 1 2` (optional)
  - arpeggio patterns, e.g. `-1 1 -2 2 -3 3` (optional)
  - chord definitions, combined to a progression, e.g. `2 5 1` (which can reference all of the above)
- Chords are visualized to be played on Chromatone and zebra keyboard (in the latest version also guitar, bass, etc.)
- Reaper-DAW integration (MIDI editor contents get replaced by the tool in realtime when you alter the input)

Development
===========

How to develop
--------------

For initial setup, run: `npm install`.

For development, run:

```
npm run watch
```

Then open `chromatone-index.html` in your web browser and reload it everytime any source code changed to see the effects. There is no server side code. The tool runs completely in the web browser.

How to develop while using the Reaper-DAW integration
-----------------------------------------------------

When using the Reaper-DAW integration while development, the application needs to be served via localhost (because of CORS), hence another file watch becomes handy. After initial setup, run:

```
npm run build_watch
```

It will trigger the build everytime a Javascript file was changed (the trigger does not work for the other source files). This way you only need to reload the page after changing the source to see the effect.


How to build
------------

```
npm run build
```

Creates `dist/chromatone/chromatone-combined-index.html` which contains everything in one file. This way the tool also works on mobile web browsers.

Feature wishes
--------------

**outdated**

- Actual user reference
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

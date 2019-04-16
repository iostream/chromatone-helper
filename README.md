How to develop
--------------

```
npm run watch
```

How to build
------------

```
npm run build
```

Creates `build/chromatone/chromatone-combined-index.html` which contains everything in one file. This way it also works on mobile browsers!

Feature wishes
--------------

- Voicings
   * include voicing in MIDI export
   * enable voicings like this (beginning from comma does not exist yet): 1 3 5 6, -8
  description: what comes after the comma is applied after transposition; the example is an African jazz voicing (I learned on youtube)
   * transposing using intervals: e.g. 1Tb3 (1tb3 should not be possible?), instead of 1t3

- GUI
   * better diff to next chord: superimpose next chord

- Automatic Inversions
   * better/always working automatic chord transition inversion optimization
   * allow disabling of automatic chord transition inversion optimization (maybe this works using e.g. 1i0)

- Presets
   * load first preset at startup

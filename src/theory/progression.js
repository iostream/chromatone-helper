var lib = {}; // gets exported
module.exports = lib;
var t = require("./base.js"),
  f = require("../fingering.js");

/**
 * Idea: add direction bias parameter (up, down, stay close), then remember lowest negative diff and lowest positive diff; if the absolute values of the diffs are the same, choose the biased one,
 *       maybe compare using a handicap for the biased side and make the handycap maybe even configurable
 *
 *
 * return int diff
 */
function calculateDiff(chord1, chord2) {
  var notes1 = chord1.getNotes();
  var notes2 = chord2.getNotes();
  if (notes1.length != notes2.length) {
    console.error("ChromatoneLibProgression.diff - Diffing currently only works with chords of the same length.");
    return 0;
  }

  var diff = 0;
  for (var i=0; i<notes1.length; ++i) {
    diff += (notes1[i].getPosition() - notes2[i].getPosition());
  }

  return Math.abs(diff);
}

function findLowestPosition(chords) {
  // find lowest note position
  var lowestPosition = chords[0].getLowestNote().getPosition();
  chords.forEach(function(chord) {
    var lowestPosition2 = chord.getLowestNote().getPosition();
    if (lowestPosition2 < lowestPosition) {
      lowestPosition = lowestPosition2;
    }
  });
  return lowestPosition;
}

/**
 * chordDefs[]  .. strings of chord definitions relating to the scale
 */
lib.createChordProgression = function(scale, chordDefinitions) {
  var _chordDefs = chordDefinitions;
  var _chords = false;
  var _lowestPosition = false; // lowest chromatic position
  return {
    /**
     * XXX Once fixed they stay fixed.... so this becomes a thing of using it
     * in the right order! must return a copy instead!
     */
    getLowestPosition: function() {
      // lazy init
      if (_lowestPosition === false) {
        _lowestPosition = findLowestPosition(_chords);
      }
      return _lowestPosition;
    },
    getChords: function() {
      // lazy init
      if (_chords !== false) {
        return _chords;
      }

      var progression = [];
      var previousChord = scale.createChord(_chordDefs[0]);
      f.updateFingering(previousChord);
      progression.push(previousChord);
      for (var i=1; i<_chordDefs.length; ++i) {
        var chordDef = _chordDefs[i];
        var chord;
        var explicitInversion = chordDef.getInversion();
        if (explicitInversion > -1) {
          // use the explicitely set inversion
          chord = scale.createChord(chordDef);
        } else {
          // choose inversion automatically
          chord = makeNearestChord(chordDef, previousChord, scale);
        }

        var previousChord = scale.createChord(_chordDefs[i]);

        f.updateFingering(previousChord);
        progression.push(previousChord);
      }
      _chords = progression;
      return _chords;
    }
  }
}

function makeNearestChord(chordDef, previousChord, scale) {
  // XXX TODO This should not alter the chord definition, but this makes no difference right now
  // chordDef = chordDef.clone();

  // get best diff of all the inversions (inversion=0 is in root position)
  var minDiff = calculateDiff(previousChord, scale.createChord(chordDef));
  var bestInversion = 0, bestTransposed = 0, transposed = 0;
  var voicingLength = chordDef.getVoicing().getVoices1().length;
  for (var inversion = 1; inversion < voicingLength; ++inversion) {
    chordDef.setInversion(inversion);
    var chord = scale.createChord(chordDef);
    // if the chord before started lower, transpose one octave down to give the inversions any chance of getting closer

    // TODO this is not working too well!
    // if (previousChord.getChordDefinition().getStep() < chordDef.getStep()) {
    if (previousChord.getLowestNote().getPosition() < chord.getLowestNote().getPosition()) {
    // if (previousChord.getNotes()[0].getPosition() < chord.getStep()) {
    // if (chordDefs[i - 1] < chordDef) {
      transposed = -12;
      chord.transpose(transposed);
    }
    var diff = calculateDiff(previousChord, chord);
    if (diff < minDiff) {
      minDiff = diff;
      bestInversion = inversion;
      bestTransposed = transposed;
    }
  }
  chordDef.setInversion(bestInversion);
  var chord = scale.createChord(chordDef)
  chord.transpose(bestTransposed);
}

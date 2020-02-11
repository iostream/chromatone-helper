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
 *
 */
lib.createChordProgression = function(chordDefinitions) {
  var _chordDefs = chordDefinitions;
  var _chords = false;
  var _lowestPosition = false; // lowest chromatic position
  return {
    /**
     * XXX Once fixed they stay fixed.... so this becomes a thing of using it
     * in the right order! must return a co py instead!
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
      var previousChord = _chordDefs[0].createChord();
      f.updateFingering(previousChord);
      progression.push(previousChord);
      for (var i=1; i<_chordDefs.length; ++i) {
        var chordDef = _chordDefs[i];
        var chord;
        if (chordDef.getInversionOptimization() === '0') {
          // use the explicitely set inversion
          chord = chordDef.createChord();
        } else {
          // choose inversion automatically
          chord = makeNearestChord(chordDef, previousChord);
        }

        f.updateFingering(chord);
        progression.push(chord);
        previousChord = chord;
      }
      _chords = progression;
      return _chords;
    }
  }
}

function makeNearestChord(chordDef, previousChord) {
  var direction = chordDef.getDirection();
  if (!nearestChordTypeStrategies.hasOwnProperty(direction)) {
    console.warn("makeNearestChord() - Ignoring unknown direction: " + direction);
    direction = 's';
  }
  return nearestChordTypeStrategies[direction].apply(null, arguments);
}

var nearestChordTypeStrategies = {
  /**
   * same
   * TODO: now this is just the previously only existing strategy, not what it actually needs to be
   */
  's': function (chordDef, previousChord) {
    // get best diff of all the inversions (inversion=0 is in root position)
    // XXX TODO This should not alter the chord definition, but this makes no difference right now
    var minDiff = calculateDiff(previousChord, chordDef.createChord());
    var bestInversion = 0, bestTransposed = 0, transposed = 0;
    var voicingLength = chordDef.getVoicing().getVoices1().length;
    for (var inversion = 1; inversion < voicingLength; ++inversion) {
      chordDef.setInversion(inversion);
      var chord = chordDef.createChord();
      // if the chord before started lower, transpose one octave down to give the inversions any chance of getting closer

      if (previousChord.getLowestNote().getPosition() < chord.getLowestNote().getPosition()) {
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
    chordDef.transpose(bestTransposed);
    var chord = chordDef.createChord();
    return chord;
  },
  /**
   * The highest note moves up or stays the same.
   */
  'u': function (chordDef, previousChord) {
    var chord = nearestChordTypeStrategies.s(chordDef, previousChord);
    chordDef = chord.getChordDefinition();
    while (previousChord.getHighestNote().getPosition() > chord.getHighestNote().getPosition()) {
      chordDef.setInversion(chordDef.getInversion() + 1);
      chord = chordDef.createChord();
    }
    return chord;
  },
  /**
   * The highest note moves down or stays the same.
   */
  'd': function /* lowest note goes down */ (chordDef, previousChord) {
    var chord = nearestChordTypeStrategies.s(chordDef, previousChord);
    chordDef = chord.getChordDefinition();
    while (previousChord.getHighestNote().getPosition() < chord.getHighestNote().getPosition()) {
      chordDef.setInversion(chordDef.getInversion() - 1);
      chord = chordDef.createChord();
    }
    return chord;
  },
};

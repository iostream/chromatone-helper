var ChromatoneLibProgression = {};
(function(lib, t, f) {
  console.log("    \"    \"  \"  ChromatoneLibProgression  !");
  
  /**
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
    // TODO not sure yet, if this will work out too well
    return Math.abs(diff);
  }
  
  /**
   * Lowest note of progression gets the position 0
   * 
   * return array progression altered input
   */
  function fix(progression) {
    if (progression.length < 2) {
      return progression;
    }
    
    // find lowest note (that's overkill, by now, because the notes are ordered)
    var lowestPosition = Number.MAX_SAFE_INTEGER;
    for (var i=0; i<progression.length; ++i) {
      var notes = progression[i].getNotes();
      for (var j=0; j<notes.length; ++j) {
        var note = notes[j];
        if (note.getPosition() < lowestPosition) {
          lowestPosition = note.getPosition();
        }      
      }    
    }
    
    // already fixed
    if (lowestPosition == 0) {
      return progression;
    }
    
    // transpose the progression, so it's fixed
    for (var i=0; i<progression.length; ++i) {
      var chord = progression[i];
      chord.transpose(-lowestPosition);
    }
    
    return progression;
  }
  
  
  /**
   * scale[]      .. note objects
   * chordDefs[]  .. strings of chord definitions relating to the scale
   * chordLength  .. how many notes per chord
   */
  lib.createChordProgression = function(scale, chordDefs, chordLength) {
    chordLength = chordLength || 4;
    if (chordDefs.length === 0) {
      return [];
    }
    if (chordDefs.length < 2) {
      return [/*wuuuuuutt*/];
    }

    var progression = [];
    var transposeAll = 0;
    
    // first very simple: first chord is always in root position
    var previousChord = scale.createChord(chordDefs[0], chordLength);
    f.updateFingering(previousChord);
    progression.push(previousChord);
    for (var i=1; i<chordDefs.length; ++i) {
      var chordDef = chordDefs[i];
      // get best diff of all the inversions (inversion=0 is in root position)
      var minDiff = calculateDiff(previousChord, scale.createChord(chordDef, chordLength));
      var bestInversion = 0, bestTransposed = 0, transposed = 0;
      for (var inversion = 1; inversion < chordLength; ++inversion) {
        var chord = scale.createChord(chordDef, chordLength, inversion);
        // if the chord before started lower, transpose one octave down to give the inversions any chance of getting closer
        
        // TODO this is not working too well!
        if (previousChord.getNotes()[0].getPosition() < chordDef) {
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
      var previousChord = scale.createChord(chordDefs[i], chordLength, bestInversion);
      previousChord.transpose(bestTransposed);
      f.updateFingering(previousChord);
      progression.push(previousChord);
    }
    return fix(progression);
  };
  
})(ChromatoneLibProgression, ChromatoneLibTheory, ChromatoneLibFingering);
 

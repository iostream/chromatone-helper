var ChromatoneLibProgression = {};
(function(lib, t, f) {
  console.log("    \"    \"  \"  ChromatoneLibProgression  !");
  
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
    // TODO not sure yet, if this will work out too well
    return Math.abs(diff);
  }
  
  /**
   * Lowest note of progression gets the position 0.
   * 
   * return array progression of chords = altered input
   */
  function fix(chords) {
    if (chords.length < 2) {
      return chords;
    }
    
    // find lowest note position
    var lowestPosition = chords[0].getLowestNote().getPosition();
    chords.forEach(function(chord) {
      var lowestPosition2 = chord.getLowestNote().getPosition();
      if (lowestPosition2 < lowestPosition) {
        lowestPosition = lowestPosition2;
      }
    });
    
    // already fixed
    if (lowestPosition == 0) {
      return chords;
    }
    
    // transpose the progression, so it's fixed
    for (var i=0; i<chords.length; ++i) {
      chords[i].transpose(-lowestPosition);
    }
    
    return chords;
  }
  
  /**
   * scale[]      .. note objects
   * chordDefs[]  .. strings of chord definitions relating to the scale
   * chordLength  .. how many notes per chord
   */
  lib.createChordProgression = function(scale, chordDefs) {
    if (chordDefs.length === 0) {
      return [];
    }
    if (chordDefs.length < 2) {
      return [/*wuuuuuutt*/];
    }

    var progression = [];
    var transposeAll = 0;
    
    var previousChord = scale.createChord(chordDefs[0]);
    f.updateFingering(previousChord);
    progression.push(previousChord);
    for (var i=1; i<chordDefs.length; ++i) {
      var chordDef = chordDefs[i];
      // get best diff of all the inversions (inversion=0 is in root position)
      var minDiff = calculateDiff(previousChord, scale.createChord(chordDef));
      var bestInversion = 0, bestTransposed = 0, transposed = 0;
      var voicingLength = chordDef.getVoicing().length;
      for (var inversion = 1; inversion < voicingLength; ++inversion) {
        chordDef.setInversion(inversion);
        var chord = scale.createChord(chordDef);
        // if the chord before started lower, transpose one octave down to give the inversions any chance of getting closer
        
        // TODO this is not working too well!
        if (previousChord.getNotes()[0].getPosition() < chordDef.getStep()) {
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
      chordDefs[i].setInversion(bestInversion);
      var previousChord = scale.createChord(chordDefs[i]);
      previousChord.transpose(bestTransposed);
      f.updateFingering(previousChord);
      progression.push(previousChord);
    }
    return fix(progression);
  };
    
  /**
   * @see https://stackoverflow.com/questions/23451726/saving-binary-data-as-file-using-javascript-from-a-browser
   */
  var saveByteArray = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, name) {
      //var blob = new Blob([data]/*, {type: "octet/stream"}*/),
      var blob = new Blob([data], {type: "audio/midi"}),
        url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  }());
  
  /**
   * @see https://stackoverflow.com/questions/23451726/saving-binary-data-as-file-using-javascript-from-a-browser
   */
  var saveDataUri = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    // a.style = "display: none";
    a.text = "MIDI";
    return function (dataUri, name) {
      a.href = dataUri;
      a.download = name;
      a.click();
    };
  }());
  
  /**
   * TODO move function somewhere else!
   * 
   * @see https://github.com/grimmdude/MidiWriterJS
   * 
   * @return string
   */
  lib.createMidi = function(chords) {
    var basePitch = 60;
    
    var MidiWriter = require("MidiWriter");
    
    // Start with a new track
    var track = new MidiWriter.Track();

    // Define an instrument (optional):
    track.addEvent(new MidiWriter.ProgramChangeEvent({instrument : 1}));

    // Generate a data URI
    var write = new MidiWriter.Writer([track]);
    console.log(write.dataUri());
    
    var time = 0;
    chords.forEach(function(chord) {
      var pitches = chord.getNotes().map(function(note) {
        return note.getPosition() + basePitch;
      });
      var notes = new MidiWriter.NoteEvent({pitch: pitches, duration: '1', velocity: 90});
      track.addEvent(notes);
    });
    
    saveDataUri(write.dataUri(), "test.mid");
  }
  
})(ChromatoneLibProgression, ChromatoneLibTheory, ChromatoneLibFingering);
 

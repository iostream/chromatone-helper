var lib = {};
module.exports = lib;

var notesLib = require("./notes.js");

var WHITESPACE_REGEX = /\s+/;

/**
 * notesAfterShift is an in/out parameter.
 */
function transposeToMatchKey(notesBeforeShift, notesAfterShift) {

}

/**
 * @param String|notesObject definition
 * @return scale
 */
lib.createScale = function(definition) {
  var notesObject = notesLib.parseNotesObject(definition);
  var _notes = notesObject.getNotes();
  var _keyPosition = notesObject.getKeyPosition();
  var _keyName = notesObject.getKeyName();

  // the root can be anywhere in the scale:
  var _rootNoteIndex = _notes.findIndex(function(note) { return note.isRoot(); });
  // if there is no explicit root, the first note becomes the root:
  if (_rootNoteIndex < 0) {
    _rootNoteIndex = 0;
    if (_notes.length > 0) {
      _notes[0].setRoot(true);
    }
  }

  return {
    getNotes: function() {
      return _notes;
    },
    /**
     * @return can be null
     */
    getRootNote: function() {
      return _notes[_rootNoteIndex];
    },
    shift: function(steps, invert) {
      var invert = invert || false;
      if (steps == 0) {
        return;
      }

      // also the root notes of all notes get shifted
      this.getRootNote().setRoot(false);

      var firstPositionBeforeShifting = _notes[0].getPosition();

      // do the shift
      if (steps > 0) {
        for (var i = 0; i < steps; ++i) {
          var note = _notes.shift();
          var previousNote = _notes[Math.abs((i - 1) % _notes.length)];
          do {
            note.transpose(12);
          } while(previousNote.getPosition() > note.getPosition());
          _notes.push(note);
        }
      } else {
        for (var i = 0; i < Math.abs(steps); ++i) {
          var previousNote = _notes[(i + 1) % _notes.length];
          var note = _notes.pop();
          do {
            note.transpose(-12);
          } while(previousNote.getPosition() < note.getPosition());
          _notes.unshift(note);
        }
      }

      // set the new chromatic roots after transposing, so they are not affected by it
      rootNote = this.getRootNote();
      rootNote.setRoot(true);

      // rewrite the chromatic intervals, so they make sense again
      var rootPosition = _notes[0].getPosition();
      _notes.forEach(function (note) {
        note.setChromaticInterval(note.getPosition() - rootPosition);
        previousPosition = note.getPosition();
      });

      // rewrite the positions, so the root has the same position like before
      if (!invert) {
        var positionDifference = firstPositionBeforeShifting - _notes[0].getPosition();
        _notes.forEach(function (note) {
          note.setPosition(note.getPosition() + positionDifference);
        });
      }
      // console.log("scale.shift(): " + oldNotes.join(" ") + " shifted " + steps + " times -> " + _notes.join(" ") + " notesSiftedButOldNames: " + notesSiftedButOldNames);
    },
    transpose: function(semitones) {
      for (var i=0; i<_notes.length; ++i) {
        _notes[i].transpose(semitones);
      }
    },
    clone: function() {
      var newNotes = _notes.map(function(note) {
        return note.clone();
      });
      return lib.createScale(notesLib.createNotesObject(newNotes, _keyPosition, _keyName));
    },
    toString: function() {
      var str = "";
      for (var i=0; i<_notes.length; ++i) {
        str += (_notes[i].toString() + " ");
      }
      return str.trim() + ' k=' + _keyName;
    }
  };
}

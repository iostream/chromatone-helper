var lib = {};
module.exports = lib;

var notesLib = require("./notes.js");
var chordLib = require("./chord.js");

var WHITESPACE_REGEX = /\s+/;

/**
 * @param String definition
 * @return scale
 */
lib.createScale = function(definition) {
  var _notes = notesLib.parseNotes(definition);

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
    createChord: function(chordDef) {
      return chordLib.createChord(chordDef, this);
    },
    shift: function(steps) {
      if (steps == 0) {
        return;
      }

      // also the root notes of all notes get shifted
      this.getRootNote().setRoot(false);

      // do the shift
      if (steps > 0) {
        for (var i = 0; i < steps; ++i) {
          var note = _notes.shift();
          var previousNote = _notes[Math.abs((i - 1) % _notes.length)];
          do {
            note.transpose(12);
          } while(previousNote.getPosition() > note.getPosition());
          _notes.push(note);
          lastNote = note;
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
      newChromaticRoot = rootNote.getPosition();
      this.setChromaticRoot(newChromaticRoot);

      // console.log("scale.shift(): " + oldNotes.join(" ") + " shifted " + steps + " times -> " + _notes.join(" ") + " notesSiftedButOldNames: " + notesSiftedButOldNames);
    },
    setChromaticRoot: function(newChromaticRoot) {
      for (var i = 0; i < _notes.length; ++i) {
        _notes[i].setChromaticRoot(newChromaticRoot);
      }
    },
    transpose: function(semitones) {
      for (var i=0; i<_notes.length; ++i) {
        _notes[i].transpose(semitones);
      }
    },
    clone: function() {
      var newNotes = [];
      for (var i=0; i<_notes.length; ++i)  {
        newNotes.push(_notes[i].clone());
      }
      return lib.createScale(newNotes);
    },
    toString: function() {
      var str = "";
      for (var i=0; i<_notes.length; ++i) {
        str += (_notes[i].toString() + " ");
      }
      return str.trim();
    }
  };
}

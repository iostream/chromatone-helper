var lib = {};
module.exports = lib;

var notesLib = require("./notes.js");

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
    /**
     * @param chordDef
     */
    createChord: function(chordDef) {
      // TODO can we do this better?
      if (typeof(chordDef.getScale()) !== "undefined" && chordDef.getScale() !== this) {
        return chordDef.getScale().createChord(chordDef);
      }

      // TODO this is now kind of a mess here!?
      var _inversion = 0; // <- gets initialized by calling invert() later
      var _step = chordDef.getStep();
      var _voicing = chordDef.getVoicing();
      var _scale = this;
      var _fixedOffset = 0;
      var _chordDef = chordDef;

      var chordScaleNotes = this.getNotes();
      if (_step > 0) {
        var tempScale = this.clone()
        tempScale.shift(_step);
        chordScaleNotes = tempScale.getNotes();
        _scale = tempScale;
      }

      function createNotesByVoices(voices, scaleNotes) {
        var notes = [];
        for (var i = 0; i < voices.length; ++i) {
          // add cloned notes, so changing the chord's notes won't change the scale's notes
          var noteIndex = voices[i] % scaleNotes.length;
          var noteTransposition = Math.floor(voices[i] / scaleNotes.length) * 12;
          var note = scaleNotes[noteIndex].clone();

          if (noteTransposition !== 0) {
            note.transpose(noteTransposition);
            // alter chromatic root, so the interval names also "change registers"
            note.setChromaticRoot(note.getChromaticRoot() - noteTransposition);
          }

          notes.push(note);
        }
        return notes;
      }

      var _chordNotes = createNotesByVoices(_voicing.getVoices1(), chordScaleNotes);

      // console.log("createChord() - ", _chordNotes.map(function(note){ return note.toString() }).join(", "));

      var _name = chordDef.toString();

      var chord = {
        getNotes: function() {
          // voices2 are added after inversion...
          var notes = _chordNotes.slice(0);
          var voices2 = _voicing.getVoices2();

          for (var i in voices2) {
            if (!voices2.hasOwnProperty(i)) {
              continue;
            }

            // TODO add second voicing part.... but exactly how ....?
            var notesForVoices2 = _scale.getNotes();
            if (_step > 0) {
              // TODO there is something wrong here...
              var tempScale = _scale.clone();
              tempScale.shift(_step);
              tempScale.setChromaticRoot(notes[0].getPosition());
              notesForVoices2 = tempScale.getNotes();
            }
          }
          notes = notes.concat(createNotesByVoices(_voicing.getVoices2(), notesForVoices2));

          return notes;
        },
        // TODO I dont like how the find methods are implemented
        getHighestNote: function() {
          return this.findHighestNote();
        },
        getLowestNote: function() {
          return this.findLowestNote();
        },
        findHighestNote: function() {
          return this.getNotes().reduce(
            function(highestNote, note) {
              if (highestNote === null || note.getPosition() > highestNote.getPosition()) {
                highestNote = note;
              }
              return highestNote;
            },
            null
          );
        },
        findLowestNote: function() {
          return this.getNotes().reduce(
            function(lowestNote, note) {
              if (lowestNote === null || note.getPosition() < lowestNote.getPosition()) {
                lowestNote = note;
              }
              return lowestNote;
            },
            null
          );
        },
        getFixedOffset: function() {
          return _fixedOffset;
        },
        setFixedOffset: function(fixedOffset) {
          _fixedOffset = fixedOffset;
        },
        invert: function() {
          var notes = _chordNotes;

          if (notes.length < 2) {
            // this would result in the same "chord"
            return;
          }

          // lowest note becomes the highest note
          var lowestNote = notes.shift();
          var highestNote = notes[notes.length - 1];
          while (lowestNote.getPosition() <= highestNote.getPosition()) {
            lowestNote.transpose(12);
          }
          notes.push(lowestNote);

          // new lowest note interval is the new chromatic root for all notes
          var newChromaticRoot = notes[0].getPosition();
          for (var i=0; i < notes.length; ++i) {
            notes[i].setChromaticRoot(newChromaticRoot);
          }

          _inversion = (_inversion + 1) % notes.length;
        },
        transpose: function(semitones) {
          if (semitones == 0) {
            return;
          }
          for (var i=0; i<_chordNotes.length; ++i) {
            _chordNotes[i].transpose(semitones);
          }
        },
        /**
         * "Fixing" is like transposing, but there is a remainder, what got transposed -> _fixedOffset
         */
        fix: function(semitones) {
          this.transpose(semitones);
          _fixedOffset = semitones;
        },
        getName: function() {
          return _name + (_inversion > 0 ? (" " + _inversion): "");
        },
        getChordDefinition: function() {
          return _chordDef;
        }
      };

      // execute stuff the chord definition tells...

      // inversion
      for (var i=0; i<chordDef.getInversion(); ++i) {
        chord.invert();
      }

      // transposition
      chord.transpose(chordDef.getTransposition());

      return chord;
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

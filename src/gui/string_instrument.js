var lib = {};
module.exports = lib;

var notesLib = require("../theory/notes.js");

var stringInstrumentTemplate = document.getElementById("templates").getElementsByClassName("string-instrument")[0];

var types = {
  // name: [stringBaseNotes, fretCount]
  guitar: [notesLib.parseNotes('1 4 b7 b10 12 15 k=E3'), 15],
  bass_guitar: [notesLib.parseNotes('1 4 b7 b10 k=E2'), 15]
};

/**
 * Returns false if the type is unknown.
 */
lib.createStringInstrumentByType = function(typeName) {
  if (types.hasOwnProperty(typeName)) {
    return lib.createStringInstrument.apply(null, types[typeName]);
  }
  return false;
};

var debug = false;
/**
 * An array of pitches/notes provide the base pitches (object.getPosition())
 * of the strings. One note per pitch. .g. bass would be 1 4 b7 b10
 */
lib.createStringInstrument = function(stringBaseNotes, fretCount) {
  var _container = stringInstrumentTemplate.cloneNode(true);
  var _fretBoard = _container.getElementsByClassName("strings")[0];

  var instrument = {
    getElement: function() {
      return _container;
    },
    add: function(notes, description) {
      var notes = notesLib.parseNotes(notes);
      if (debug) {
        console.log("StringInstrument - Adding notes: ", notes.map(function(note){ return note.toString(); }));
      }

      // add each
      for (var i = 0; i < notes.length; ++i) {
        var note = notes[i];
        if (!addNote(note, _fretBoard)) {
          console.warn("Could not find button to light by note \"" + note.toString() + "\" (position=" + note.getPosition() + ")");
        }
      }

      // mark notes which are in different registers
      for (var i = 0; i < notes.length; ++i) {
        var note = notes[i];
        // upper register
        var position = note.getPosition();
        for (;;) {
            position += 12;
            if (!addNote(note, _fretBoard, position)) {
              break;
            }
        }
        // lower register
        var position = note.getPosition();
        for (;;) {
            position -= 12;
            if (!addNote(note, _fretBoard, position)) {
              break;
            }
        }
      }
    },
    addDiff: function(notes) {
      // noop
    },
    clone: function() {
      console.error("StringInstrument.clone() is not implemented");
      // TODO return construct(keyboard.cloneNode(true));
    }
  };

  stringBaseNotes.reverse().forEach(function(note) {
    var string = createString();
    _fretBoard.appendChild(string);
    var chromatic = note.getPosition();
    for (var i = 0; i < fretCount; ++i) {
      string.appendChild(createFret(chromatic++));
    }
  });

  return instrument;
}

function createString() {
  var string = document.createElement("div");
  return string;
}

function createFret(chromatic) {
  var fret = document.createElement("span");
  // c<chromaticPosition>
  fret.className = "c" + chromatic;
  return fret;
}

function addNote(note, fretBoard, alternativePosition) {
  var position = alternativePosition || note.getPosition();
  var isDifferentRegister = typeof(alternativePosition) !== 'undefined';

  // find buttons to light
  var className = "c" + position;
  var noteEls = fretBoard.getElementsByClassName(className);
  if (noteEls.length === 0) {
    // This should happen pretty often? What could be done better?
    return false;
  }
  for (var j = 0; j < noteEls.length; ++j) {
    markNoteElement(noteEls[j], note, isDifferentRegister);
  }
}

function markNoteElement(noteEl, note, isDifferentRegister) {
  if (isDifferentRegister && noteEl.classList.contains('selected')) {
    // do nothing, if this is a different register and the note is already
    // marked
    return;
  }

  // add label
  var name = note.findIntervalName();
  if (isDifferentRegister) {
    name = '(' + name + ')';
  }
  noteEl.setAttribute("title", name);
  noteEl.innerHTML = '<p class="note-text">' + name + "</p>";
  noteEl.classList.add("selected");

  // mark root
  if (note.isRoot()) {
    noteEl.classList.add("root");
  }
}

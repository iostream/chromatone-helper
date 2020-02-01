var lib = {};
module.exports = lib;

// TODO include hiding of notes in different register:
function hideNotesOfDifferentRegister(hide) {
  var els = document.querySelectorAll(".selected.alt");
  for (var i = 0; i < els.length; ++i) {
    if (hide) {
      if (!els[i].classList.contains('ignore')) {
        els[i].className += " ignore";
      }
    } else {
      if (els[i].classList.contains('ignore')) {
        els[i].classList.remove('ignore');
      }
    }

  }
}

var notesLib = require("../theory/notes.js");

var stringInstrumentTemplate = document.getElementById("templates").getElementsByClassName("string-instrument")[0];

var types = {
  // name: [stringBaseNotes, fretCount]
  guitar: [notesLib.parseNotes('1 4 b7 b10 12 15 k=E3').reverse(), 17], // guitar bar chord voicing: 1 5 8 10 12 (but better use drop voicing -> using octaves in arp pattern)
  bass_guitar: [notesLib.parseNotes('1 4 b7 b10 k=E2').reverse(), 17],
  concert_ukulele: [notesLib.parseNotes('8 4 6 10 k=G4').reverse(), 11],
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
  var _stringPitches = stringBaseNotes;
  var _container = stringInstrumentTemplate.cloneNode(true);
  var _fretBoard = _container.getElementsByClassName("strings")[0];
  var _fretCount = fretCount;

  var instrument = {
    getElement: function() {
      return _container;
    },
    add: function(notes, description) {
      var notes = notesLib.parseNotes(notes);
      if (debug) {
        console.log("StringInstrument - Adding notes: ", notes.map(function(note){ return note.toString(); }));
      }

      // highlight each pitch which actually exists on the board while also
      // highlighting the pitches which are in a different register
      // (this is brute force, but works for all kinds of fretted string instruments with constant fret count (no banjo))
      _stringPitches.forEach(function(stringPitch) {
        var stringPosition = stringPitch.getPosition();
        var relativeStringPosition = stringPosition % 12;
        notes.forEach(function(pitchToAdd) {
          var position = pitchToAdd.getPosition();
          // check for all registers
          var stringRegister = -1;
          var relativePosition = position % 12;
          for (;;) {
            stringRegister += 1;
            positionOnString = (relativePosition - relativeStringPosition) + stringRegister * 12;
            if (positionOnString < 0) {
              continue;
            }
            if (_fretCount <= positionOnString) {
              break;
            }
            if (!addNote(pitchToAdd, _fretBoard, stringPosition + positionOnString)) {
              console.error("Could not find button (which should be impossible to happen!!) to light by note \"" + note.toString() + "\" (position=" + note.getPosition() + ")");
            }

          }
        });
      });
      // also mark notes which are in different registers....
    },
    addDiff: function(notes) {
      // noop
    },
    clone: function() {
      console.error("StringInstrument.clone() is not implemented");
      // TODO return construct(keyboard.cloneNode(true));
    }
  };

  _stringPitches.forEach(function(pitch) {
    var string = createString();
    _fretBoard.appendChild(string);
    var chromatic = pitch.getPosition();
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
  var isDifferentRegister = position !==  note.getPosition();

  // find buttons to light
  var className = "c" + position;
  var noteEls = fretBoard.getElementsByClassName(className);
  if (noteEls.length === 0) {
    return false;
  }
  for (var j = 0; j < noteEls.length; ++j) {
    markNoteElement(noteEls[j], note, isDifferentRegister);
  }
  return true;
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
    noteEl.classList.add("alt");
  }
  noteEl.setAttribute("title", name);
  noteEl.innerHTML = '<p class="note-text">' + name + "</p>";
  noteEl.classList.add("selected");

  // mark root
  if (note.isRoot()) {
    noteEl.classList.add("root");
  }
}

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
  var _fretBoard = _container.getElementsByClassName('frets')[0];
  var _fretCount = fretCount;
  var _frets = [];

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
      _stringPitches.forEach(function(stringPitch, stringIndex) {
        var relativeStringPosition = stringPitch.getPosition() % 12;
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

            var isDifferentRegister = position !== stringPitch.getPosition() + positionOnString;
            markNoteElement(_frets[positionOnString].getElementsByTagName('p')[stringIndex], pitchToAdd, isDifferentRegister);
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

  var string;
  var stringCount = _stringPitches.length;
  for (var i = 0; i < fretCount; ++i) {
    var fret = createFret(i);
    _frets.push(fret);
    for (var j = 0; j < stringCount; ++j) {
      fret.appendChild(createString());
    }
    _fretBoard.appendChild(fret);
  }
  return instrument;
}

function createString() {
  var el = document.createElement("p");
  return el;
}

var markingsPerFret = {
  // fret index => count of markings
  0: 2, 3: 1, 5: 1, 7: 1, 9: 1
};
function createFret(index) {
  var el = document.createElement("span");
  el.className = 'fret';
  if (index > 0) {
    // XXX Does this makes sense enough?
    el.style.width = 40 - ((index ) * 1.7) + "px";

    if (markingsPerFret.hasOwnProperty(index % 12)) {
      var marking = document.createElement("span");
      if (markingsPerFret[index % 12] > 1) {
        marking.className = "mark2";
      } else {
        marking.className = "mark";
      }
      el.appendChild(marking);
    }
  }
  return el;
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
  noteEl.innerHTML = '<span class="note-text">' + name + "</span>";
  noteEl.classList.add("selected");

  // mark root
  if (note.isRoot()) {
    noteEl.classList.add("root");
  }
}

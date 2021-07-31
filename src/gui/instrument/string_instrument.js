var lib = {};
module.exports = lib;

var notesLib = require("../../theory/notes.js");

var stringInstrumentTemplate = document.getElementById("templates").getElementsByClassName("string-instrument")[0];

var types = {
  // name: [stringBaseNotes, stringGauges, fretCount]
  guitar: [notesLib.parseNotes('15 12 b10 b7 4 1 E2'), [.01, .0135, .017, .026, .036, .048], 17], // guitar bar chord voicing: 1 5 8 10 12 (but better use drop voicing -> using octaves in arp pattern)
  bass_guitar: [notesLib.parseNotes('b10 b7 4 1 E1'), [.045, .06, .08 , .1], 17],
  concert_ukulele: [notesLib.parseNotes('10 6 4 8 G4'), [.022, .026, .029, .024], 11],
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

// TODO refactor this, so this is not needed! E.g. first create an instrument
// template and then add chords to it, which creates the user interface then....
var initializedStyles = {};

var debug = false;
/**
 * An array of pitches/notes provide the base pitches (object.getPosition())
 * of the strings. One note per pitch. .g. bass would be 1 4 b7 b10.
 *
 * Each string has also a gauge/thickness (in inch) which is just for better immersion.
 */
lib.createStringInstrument = function(stringBaseNotes, gauges, fretCount) {
  var _stringPitches = stringBaseNotes;
  var _container = stringInstrumentTemplate.cloneNode(true);
  var _fretBoard = _container.getElementsByClassName('frets')[0];
  var _fretCount = fretCount;
  var _frets = [];
  var _markedNoteElements = [];
  // all chords get a style applied using this class; its name contains
  // everything which makes the style unique
  var _className = 's' + gauges.join("-").replace(/\./g, '');
  _container.classList.add(_className);
  if (!initializedStyles.hasOwnProperty(_className)) {
    // initialize style only once
    var style = document.createElement('style');
    style.type = 'text/css';
    var head = document.head || document.getElementsByTagName('head')[0];
    head.append(style);
    var css = "";
    gauges.forEach(function(gauge, string) {
      css += "." + _className + " .fret p:nth-last-child(" + (gauges.length - string) + ") { "
        + "background-size: 1px " + gauge + "in;"
      + "}\n";
    });
    style.appendChild(document.createTextNode(css));
    initializedStyles[_className] = true;
  }

  function markNoteElement(noteEl, note, isDifferentRegister, allIntervals) {
    var selected = noteEl.classList.contains('selected');
    if (isDifferentRegister && selected && !allIntervals) {
      // do nothing, if this is a different register and the note is already
      // marked
      return;
    }

    // add label
    var name = note.findIntervalName();
    if (isDifferentRegister) {
      name = '(' + name + ')';
    }

    if (selected && allIntervals) {
      // append to existing name
      var existingName = noteEl.getAttribute("title");
      name = existingName + "/" + name;
    }

    noteEl.setAttribute("title", name);
    var nameEl = document.createElement('span');
    nameEl.className = 'note-text';
    nameEl.textContent = name;
    noteEl.appendChild(nameEl);

    noteEl.classList.add("selected");

    // mark root
    if (note.isRoot()) {
      noteEl.classList.add("root");
    }

    _markedNoteElements.push([note.getPosition(), noteEl]);
  }

  var instrument = {
    getElement: function() {
      return _container;
    },
    clear: function() {
      var button;
      var selectedButtons = _container.getElementsByClassName('selected');
      while (selectedButtons.length) {
        button = selectedButtons[0];
        button.innerHTML = '';
        button.title = '';
        button.classList.remove('selected');
        button.classList.remove('root');
      }
    },
    add: function(notes, description, options) {
      var notes = notesLib.parseNotes(notes);
      if (debug) {
        console.log("StringInstrument - Adding notes: ", notes.map(function(note){ return note.toString(); }));
      }

      // add description
      if (typeof description !== "undefined") {
        var descriptionEl = _container.getElementsByClassName("description");
        if (descriptionEl.length > 0) {
          descriptionEl[0].textContent = description;
        }
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
            if (options.all_registers || !isDifferentRegister) {
              markNoteElement(_frets[positionOnString].getElementsByTagName('p')[stringIndex], pitchToAdd, isDifferentRegister, options.all_intervals);
            }
          }
        });
      });
    },
    highlightPitch: function(pitch) {
      _markedNoteElements.forEach(function(noteElArray) {
        if (noteElArray[0] === pitch.getPosition()) {
          noteElArray[1].classList.add('played');
        }
      });
    },
    dehighlightPitch: function(pitch) {
      _markedNoteElements.forEach(function(noteElArray) {
        if (noteElArray[0] === pitch.getPosition()) {
          noteElArray[1].classList.remove('played');
        }
      });
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
  // relative fret index => count of markings
  0: 2, 3: 1, 5: 1, 7: 1, 9: 1
};
function createFret(index) {
  var el = document.createElement("span");
  el.className = 'fret';
  if (index > 0) {
    // Change width depending on position of the fret
    // XXX Does this makes sense enough?
    el.style.width = 40 - ((index ) * 1.7) + "px";

    // mark some frets
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

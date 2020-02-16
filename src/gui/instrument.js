var lib = {};
module.exports = lib;

var keyboard = require("./keyboard.js");
var zebra = require("./zebra.js");
var stringInstrument = require("./string_instrument.js");

function $_(id) { return document.getElementById(id); }
var chordTemplate = $_("templates").getElementsByClassName("chord")[0],
  chordGroupTemplate = $_("templates").getElementsByClassName("chord-group")[0],
  chordReferenceGroupTemplate = $_("templates").getElementsByClassName("chord-reference-group")[0],
  chordSection = $_("chords");

/**
 * Creates a common proxy to all kind of instruments. The proxy also implements
 * some features, so the actual instrument implementations can be simple.
 */
lib.createInstrument = function(options, parentElement) {
  return createInstrument1(options, parentElement);
}

/**
 * Creates one new instrument GUI per chord.
 */
function createInstrument1(options, parentElement) {
  var _options = options;
  var _factory = createInstrumentFactory(options);
  var _parentElement = parentElement;
  var _lastInstrument = false;

  var instrument = {
    // XXX This is the first mode: add one new GUI per chordDef
    addChord: function(chord) {
      var instrument = _factory.create(
        chord.getLowestNote().getPosition(),
        chord.getHighestNote().getPosition(),
      );

      var name;
      if (typeof chord.getName !== "undefined") {
        name = chord.getName();
      }
      instrument.add(chord, name, _options);

      if (_lastInstrument) {
        _lastInstrument.addDiff(chord);
      }
      _lastInstrument = instrument;
      _parentElement.appendChild(instrument.getElement());
    },
    addChordProgressionUsingChordDefinitionComposit: function(progression, chordDefinitionComposit) {
      var chords = progression.getChords();
      var chordsCopy = chords.slice();
      chordDefinitionComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
        addChordsRecursive(chords, chordDefinitionOrComposit2);
      });
    }
  };

  function addChordsRecursive(chords, chordDefinitionOrComposit) {
    if (typeof chordDefinitionOrComposit.getChildren === "function") {
      var groupElement = createChordReferenceGroup(chordDefinitionOrComposit.getName(), _parentElement);
      chordDefinitionOrComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
        addChordsRecursive(chords, chordDefinitionOrComposit2);
      });
      _parentElement.appendChild(groupElement);
    } else {
      var chord = chords.shift();
      instrument.addChord(chord);
    }
  }

  return instrument;
}

function createInstrumentFactory(options) {
  var type = options.type || 'chromatic';

  switch(type) {
    case 'chromatic':
      return {
        create: function(lowestPosition, highestPosition) {
          return keyboard.createKeyboard(lowestPosition, highestPosition, 4);
        }
      };
      break;
    case 'zebra':
      return {
        create: function(lowestPosition, highestPosition) {
          return zebra.createZebraKeyboard(lowestPosition, highestPosition);
        }
      };
      break;
    default:
      return {
        create: function(lowestPosition, highestPosition) {
          var instrument = stringInstrument.createStringInstrumentByType(type);
          if (!instrument) {
            console.error("create() - Unknown instrument type: " + type);
            return;
          }
          return instrument;
        }
      };
      break;
  }
}

function createChordReferenceGroup(title, section) {
  var groupEl = section.appendChild(chordReferenceGroupTemplate.cloneNode(true)),
    titleEl = groupEl.getElementsByClassName("title")[0] || false;

  if (titleEl && title) {
    // XXX TODO use text node instead of innerHTML
    titleEl.innerHTML = title;
  }
  return groupEl;
}

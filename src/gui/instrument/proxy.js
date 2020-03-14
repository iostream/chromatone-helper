var lib = {};
module.exports = lib;

var factoryLib = require('./factory.js');

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
  var _factory = factoryLib.createInstrumentFactory(options);
  var _parentElement = parentElement;
  var _instruments = []; // <- one instrument per chord

  var instrument = {
    // XXX This is the first mode: add one new GUI per chordDef
    addChord: function(chord, progression) {
      var instrument = _factory.create(
        progression.getLowestPosition(),
        chord.getHighestNote().getPosition()
      );

      var name;
      if (typeof chord.getName !== "undefined") {
        name = chord.getName();
      }
      instrument.add(chord, name, _options);

      if (_instruments.length > 0) {
        // add diff to last added instrument
        _instruments[_instruments.length - 1 ].addDiff(chord);
      }
      _instruments.push(instrument);
      _parentElement.appendChild(instrument.getElement());
    },
    highlightEvent: function(event, chordIndex, dehighlight) {
      if (chordIndex >= _instruments.length) {
        return;
      }
      if (event.isRest()) {
        return;
      }
      var instrument = _instruments[chordIndex];

      if (dehighlight) {
        event.getPitches().forEach(function(pitch) {
          instrument.dehighlightPitch(pitch);
        });
      } else {
        event.getPitches().forEach(function(pitch) {
          instrument.highlightPitch(pitch);
        });
      }
    },
    dehighlightEvent: function(event, chordIndex) {
      return this.highlightEvent(event, chordIndex, true);
    },
    addChordProgressionUsingChordDefinitionComposite: function(progression, chordDefinitionComposite) {
      var chordsCopy = progression.getChords().slice();
      chordDefinitionComposite.getChildren().forEach(function(chordDefinitionOrComposite2) {
        addChordsRecursive(chordsCopy, chordDefinitionOrComposite2, progression);
      });
    }
  };

  function addChordsRecursive(chords, chordDefinitionOrComposite, progression) {
    if (typeof chordDefinitionOrComposite.getChildren === "function") {
      var groupElement = createChordReferenceGroup(chordDefinitionOrComposite.getName(), _parentElement);
      chordDefinitionOrComposite.getChildren().forEach(function(chordDefinitionOrComposite2) {
        addChordsRecursive(chords, chordDefinitionOrComposite2, progression);
      });
      _parentElement.appendChild(groupElement);
    } else {
      var chord = chords.shift();
      instrument.addChord(chord, progression);
    }
  }

  return instrument;
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

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
lib.createInstrument = function(options, parentElement, sequencer) {
  if (options.type === 'piano_roll') {
    return createWorldInstrument(options, parentElement);
  }
  if (options.compact) {
    return createCompactInstrument(options, parentElement);
  }
  return createInstrument1(options, parentElement, sequencer);
}

/**
 * Everything is shown always.
 */
function createWorldInstrument(options, parentElement) {
  var _parentElement = parentElement;
  var _instrument;

  return {
    addChordProgressionUsingChordDefinitionComposite: function(progression, chordDefinitionComposite, events) {
      // create one instrument which fits the whole progression...
      var lengthInQN = 0;
      events.forEach(function(eventList) {
        eventList.forEach(function(event) {
          lengthInQN += event.getLengthInQN();
        });
      });

      var factory = factoryLib.createInstrumentFactory(options);
      _instrument = factory.create(progression.getLowestPosition(), progression.getHighestPosition(), lengthInQN);

      // add all arpeggiated events
      events.forEach(function(eventList) {
        eventList.forEach(function(e) {
          _instrument.addEvent(e);
        });
      });

      _parentElement.appendChild(_instrument.getElement());
    },
    highlightEvent: function(event, chordIndex, quarterNotes) {
      _instrument.highlightEvent(event, quarterNotes);
    },
    dehighlightEvent: function(event, chordIndex, quarterNotes) {
      _instrument.dehighlightEvent(event, quarterNotes);
    }
  };
}
/**
 * All chords are shown on the same instrument and only one at a time.
 */
function createCompactInstrument(options, parentElement) {
  var _options = options;
  var _parentElement = parentElement;
  var _chords;
  var _instrument;
  var _chordIndex = -1;

  function highlightEvent(event, chordIndex, dehighlight) {
    if (!_chords || chordIndex >= _chords.length) {
      return;
    }

    // update currently shown chord if needed
    if (_chordIndex != chordIndex) {
      // TODO also remove last chord
      var chord = _chords[chordIndex];
      _instrument.clear();
      _instrument.add(chord, chord.getName(), _options);
      _chordIndex = chordIndex;
    }

    if (event.isRest()) {
      return;
    }

    if (dehighlight) {
      event.getPitches().forEach(function(pitch) {
        _instrument.dehighlightPitch(pitch);
      });
    } else {
      event.getPitches().forEach(function(pitch) {
        _instrument.highlightPitch(pitch);
      });
    }
  }

  return {
    addChordProgressionUsingChordDefinitionComposite: function(progression, chordDefinitionComposite) {
      _chords = progression.getChords();
      var factory = factoryLib.createInstrumentFactory(options);
      // create one instrument which fits the whole progression:
      _instrument = factory.create(progression.getLowestPosition(), progression.getHighestPosition());
      _parentElement.appendChild(_instrument.getElement());
    },
    addChord: function(chord, progression) {
      // noop, initially there is nothing to be seen
    },
    highlightEvent: function(event, chordIndex) {
      highlightEvent(event, chordIndex);
    },
    dehighlightEvent: function(event, chordIndex) {
      highlightEvent(event, chordIndex, true);
    }
  };
}

/**
 * Creates one new instrument GUI per chord.
 */
function createInstrument1(options, parentElement, sequencer) {
  var _options = options;
  var _factory = factoryLib.createInstrumentFactory(options);
  var _parentElement = parentElement;
  var _instruments = []; // <- one instrument per chord

  _parentElement.addEventListener('click', function(event) {
    var target = event.target;
    var chordIndex = -1;
    while (target.className !== _parentElement.className) {
      if (target.getAttribute('data-i')) {
         sequencer.setChordIndex(target.getAttribute('data-i'));
         return;
      }
      target = target.parentNode;
    };
  });

  function highlightEvent(event, chordIndex, dehighlight) {
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
  }

  var instrument = {
    // XXX This is the first mode: add one new GUI per chordDef
    addChord: function(chord, progression) {
      var instrument = _factory.create(
        progression.getLowestPosition(),
        chord.getHighestNote().getPosition()
      );

      instrument.add(chord, chord.getName(), _options);

      if (_instruments.length > 0) {
        // add diff to last added instrument
        _instruments[_instruments.length - 1 ].addDiff(chord);
      }
      instrument.getElement().setAttribute('data-i', _instruments.length);
      _instruments.push(instrument);
      _parentElement.appendChild(instrument.getElement());
    },
    highlightEvent: function(event, chordIndex) {
      highlightEvent(event, chordIndex);
    },
    dehighlightEvent: function(event, chordIndex) {
      highlightEvent(event, chordIndex, true);
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
    titleEl.textContent = title;
  }
  return groupEl;
}

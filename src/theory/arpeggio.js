var lib = {};
module.exports = lib;

var recursiveParser = require("../recursive_parser.js");

var WHITESPACE_REGEX = /\s+/;

/**
* Returns an array of arrays of note indexes.
*/
function createNoteIndexesByPitchIndexArray(notes) {
  var groupedNoteIndexes = {};
  // group the notes by their chromatic position
  notes.forEach(function(note, index) {
    if (!Array.isArray(groupedNoteIndexes[note.getPosition()])) {
      // create
      groupedNoteIndexes[note.getPosition()] = [index];
    } else {
      // append
      groupedNoteIndexes[note.getPosition()].push(index);
    }
  });

  // convert to array (XXX could use Object.values() ??)
  var pitches = [];
  for (var position in groupedNoteIndexes) {
    if (!groupedNoteIndexes.hasOwnProperty(position)) {
      continue;
    }
    pitches.push(groupedNoteIndexes[position]);
  }

  // order by pitch
  pitches.sort(function(noteIndexes1, noteIndexes2) {
    return notes[noteIndexes1[0]].getPosition() - notes[noteIndexes2[0]].getPosition();
  });

  return pitches;
}

function createArpeggioPattern(internalPitchIterators) {
  var _internalPitchIterators = internalPitchIterators;
  var pattern = {
    // iterator which iterates over all internal pitch iteratorers
    createPitchIterator: function(chord) {
      var _notes = chord.getNotes();
      var _currentPitchIteratorIndex = -1;
      var _currentPitchIterator;
      var _chord = chord;
      var _state = {
        voicingIndexesByPitchIndex: createNoteIndexesByPitchIndexArray(chord.getNotes()),
        voicingIndex: -1, // index within the chord notes
        pitchIndex: -1, // index within voicingIndexesByPitchIndex
        noteIndex: -1, // index within the index array of voicingIndexesByPitchIndex[aPitchIndex]
        incrementVoicingIndex: function () {
          this.voicingIndex = (this.voicingIndex + 1) % _notes.length;
          var foundNoteIndex;
          // find the oressponding values for this.pitchIndex and this.noteIndex
          this.pitchIndex = this.voicingIndexesByPitchIndex.indexOf(function(voicingIndexes) {
              var noteIndex = voicingIndexes.indexOf(function(voicingIndex) {
                return voicingIndex === this.voicingIndex;
              });
              if (noteIndex !== -1) {
                foundNoteIndex = noteIndex;
                return true;
              }
              return false;
          });
          this.noteIndex = foundNoteIndex;
          return this.voicingIndex;
        },
        /** Also returns the note */
        nextPitchByIndex: function(pitchIndex) {
          var voicingIndexes = this.voicingIndexesByPitchIndex[pitchIndex % this.voicingIndexesByPitchIndex.length];
          if (this.voicingIndex === -1) {
            // start with first note of voicing which has the pitch
            this.noteIndex = 0;
          } else if (this.pitchIndex === pitchIndex) {
            // this is the same pitch like the one before, so
            // use the next available note which has the same pitch
            this.noteIndex = (this.noteIndex + 1) % voicingIndexes.length;
          } else {
            // find the first note of the needed pitch which comes first after the last used note
            var smallestDiff = -1, bestNoteIndex;
            voicingIndexes.forEach(function(voicingIndex, noteIndex) {
              var diff;
              if (this.voicingIndex > voicingIndex) {
                diff = (voicingIndex + _notes.length) - this.voicingIndex;
              } else {
                diff = voicingIndex - this.voicingIndex;
              }
              if (smallestDiff === -1 || diff < smallestDiff) {
                smallestDiff = diff;
                bestNoteIndex = noteIndex;
              }
            });
            this.noteIndex = bestNoteIndex;
          }
          this.pitchIndex = pitchIndex;
          this.voicingIndex = voicingIndexes[this.noteIndex];

          return _notes[this.voicingIndex];
        },
        reset: function() {
          this.voicingIndex = -1;
          this.pitchIndex = -1;
          this.noteIndex = -1;
        }
      };

      return {
        nextPitches: function() {
          var pitches;
          if (!_currentPitchIterator || !Array.isArray(pitches = _currentPitchIterator.nextPitches(_chord, _state))) {
            // advance to next (or first) iterator
            _currentPitchIteratorIndex = (_currentPitchIteratorIndex + 1) % _internalPitchIterators.length;
            _currentPitchIterator = _internalPitchIterators[_currentPitchIteratorIndex];
            _currentPitchIterator.reset();

            // one completed round of all internal pitch iterators also resets the state
            if (_currentPitchIteratorIndex === 0) {
              _state.reset();
            }

            pitches = _currentPitchIterator.nextPitches(_chord, _state);
          }
          if (!Array.isArray(pitches)) {
            console.error("nextPitches() - Could not get the next pitches, which should always be possible.");
          }
          return pitches;
        }
      };
    },
    getInternalPitchIterators: function() {
      return _internalPitchIterators;
    },
    clone: function() {
      return createArpeggioPattern(_internalPitchIterators.slice());
    },
    addPattern: function(otherPattern) {
      var indexOfFirstAddedIterator = _internalPitchIterators.length;
      _internalPitchIterators = _internalPitchIterators.concat(otherPattern.getInternalPitchIterators());
      // the beginning of a new pattern shall always reset the state:
      _internalPitchIterators[indexOfFirstAddedIterator] = createStateResettingInternalPitchIteratorDecorator(
        _internalPitchIterators[indexOfFirstAddedIterator]
      );
    }
  };
  return pattern;
}

function createPlaceholderInternalPitchIterator(arpPatternAsString) {
  if (arpPatternAsString !== ">*" && arpPatternAsString != ">*_") {
    console.error("Cannot interpret unknown placeholder arpeggio event definition: : " + arpPatternAsString);
    return;
  }

  var _actualIterator;
  var _playAtTheSameTime = arpPatternAsString.indexOf("_") !== -1;

  function createActualInternalPitchIterator(chord) {
    var steps = [];
    for (var i = 0; i < chord.getNotes().length; ++i) {
      steps.push(getNextVoicingPitchStep());
    }
    return createStepsInternalPitchIterator(steps, _playAtTheSameTime);
  }

  return {
    nextPitches: function(chord, status) {
      if (!_actualIterator) {
        _actualIterator = createActualInternalPitchIterator(chord);
      }
      return _actualIterator.nextPitches(chord, status);
    },
    reset: function () {
      _actualIterator = null;
    }
  }
}

function createStepsInternalPitchIterator(steps, atTheSameTime) {
  if (!steps || !steps.length) {
    console.error("createStepsInternalPitchIterator() - steps must not be empty!");
    return;
  }
  var _index = 0;
  var _steps = steps;
  var _atTheSameTime = atTheSameTime;
  return {
    nextPitches: function(chord, status) {
      if (_atTheSameTime) {
          if (_index === 0) {
            _index = 1;
            // collect all pitches, but filter out duplicate pitches
            var knownPositions = {};
            var pitches = [];
            _steps.forEach(function(step) {
              var pitch = step.getPitch(chord, status);
              if (!knownPositions[pitch.getPosition()]) {
                knownPositions[pitch.getPosition()] = true;
                pitches.push(pitch);
              }
            });
            return pitches;
          }
          return false;
      }
      // return false, if there are no more steps left
      if (_index >= _steps.length) {
        return false;
      }
      // get and advance step
      var step = _steps[_index++];
      return [step.getPitch(chord, status)];
    },
    reset: function () {
      _index = 0;
    }
  };
}

/**
 * This internal decorator iterator always resets the state before it returns its first pitch.
 */
function createStateResettingInternalPitchIteratorDecorator(wrappedIterator) {
  var _wrappedIterator = wrappedIterator;
  var _resetStatusOnNextPitches = true;
  return {
    nextPitches: function(chord, status) {
      if (_resetStatusOnNextPitches) {
        status.reset();
        _resetStatusOnNextPitches = false;
      }
      return _wrappedIterator.nextPitches(chord, status);
    },
    reset: function () {
      _wrappedIterator.reset();
      _resetStatusOnNextPitches = true;
    }
  }
}

/**
 * Returns events being rests or pitch events.
 */
lib.arpeggiate = function(progression, defaultRhythmPattern, defaultArpeggioPattern) {
  var events = []; // <- the result
  var patternPos = 0;
  progression.getChords().forEach(function(chord) {
    var notes = chord.getNotes();
    if (notes.length == 0) {
      return;
    }
    var nextPattern = chord.getChordDefinition().getRhythmPattern() || defaultRhythmPattern;
    var nextArpPattern = chord.getChordDefinition().getArpeggioPattern() || defaultArpeggioPattern;
    var pitchIterator = nextArpPattern.createPitchIterator(chord);
    nextPattern.getEvents().forEach(function(event) {
      if (event.isRest()) {
        events.push(event);
      } else {
        var nextPitches = pitchIterator.nextPitches(chord);
        events.push(createPitchEvent(event, nextPitches));
      }
    });
  });
  return events;
}

function createPitch(note) {
  var _pitch = note.getPosition();
  return {
      getPosition: function() {
        return _pitch;
      }
  }
}

var nextVoicingPitchStep = {
  getPitch: function(chord, status) {
    var notes = chord.getNotes();
    var voicingIndex = status.incrementVoicingIndex();
    return createPitch(notes[voicingIndex]);
  }
};

function getNextVoicingPitchStep() {
    return nextVoicingPitchStep;
}

/**
 * Returns undefined, if no valid string was passed to parse.
 */
function createPitchByRelativePitchIndexStep(pitchIndex) {
  var _pitchIndex = parseInt(pitchIndex);
  if (isNaN(pitchIndex)) {
    return;
  }
  // make index 0 based
  --_pitchIndex;
  return {
    getPitch: function(chord, status) {
      var note = status.nextPitchByIndex(_pitchIndex);
      return createPitch(note);
    }
  };
}

function createArpeggioStep(token) {
  if (token === ">") {
    return getNextVoicingPitchStep();
  } else {
    return createPitchByRelativePitchIndexStep(token);
  }
}

/**
 * Format examples with descriptions:
 *
 * "1 2 3" means: play lowest note, then second from lowest and then play the third note from lowest to highest of the voicing
 * "1_2_3" means: play lowest etc. notes at the same time
 * "1_2 3" means: play first and second at them same time and then the third
 * ">" means: play the next note of the note played before within the voicing, (if used as the first token, then the first note of the voicing after inversion is used)
 * ">*" gets replaced with as many > as there are notes in the voicing
 * ">*_" like ">*" but all pitches are played at the same time
 */
function parseArpeggioPattern(patternAsString, referenceResolver) {
  var internalPitchIterators = [];
  var pattern = createArpeggioPattern(internalPitchIterators);
  patternAsString.trim().split(WHITESPACE_REGEX).forEach(function(token) {
    if (token.indexOf("*") !== -1) {
      internalPitchIterators.push(createPlaceholderInternalPitchIterator(token));
      return;
    }
    var arpSteps;
    var subTokens = token.trim().split("_");
    if (subTokens.length > 1) {
      arpSteps = subTokens.map(function(subToken) {
        var step = createArpeggioStep(subToken);
        if (!step) {
          console.error("parseArpeggioPattern() - Error parsing token as arpeggio step: " + subToken);
        }
        return step;
      });
    } else {
      var step = createArpeggioStep(token);
      if (!step) {
        // try to parse as a reference
        var referencedPattern = referenceResolver.resolveReference(token);
        if (referencedPattern) {
          pattern.addPattern(referencedPattern);
          return;
        }
      } else {
        arpSteps = [step];
      }
    }
    if (arpSteps.length > 0) {
      internalPitchIterators.push(createStepsInternalPitchIterator(arpSteps, true));
    }
  });
  return pattern;
}

function createPitchEvent(event, pitches) {
  var pitchEvent = event.clone();
  var _pitches = pitches;
  pitchEvent.getPitches = function() {
    return _pitches;
  }
  return pitchEvent;
}

var arpeggioParserDelegate = {
  getName: function() {
    return "Arpeggios";
  },
  parseThing: function(singleLineString, referenceResolver) {
    return parseArpeggioPattern(singleLineString, referenceResolver);
  },
  addNoNameThing: function(arpeggioPattern, referenceMap) {
    // the last rhythm without a name becomes the default rhythm
    referenceMap.defaultArpeggioPattern = arpeggioPattern;
  }
};

lib.parseArpeggioPatterns = function(multiLineString) {
  return recursiveParser.parseThingsRecursive(multiLineString, arpeggioParserDelegate);
};

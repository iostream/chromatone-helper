var lib = {};
module.exports = lib;

var recursiveParser = require("../recursive_parser.js");

var WHITESPACE_REGEX = /\s+/;

var LEGATO = 0;
var TENUTO = 1;

var lengthArticulationMappings = {
  legato: LEGATO,
  l: LEGATO,
  tenuto: TENUTO,
  t: TENUTO
};

function createDefaultArticulation() {
  return createArticulation(TENUTO);
}

function createArticulation(lengthArticulation) {
  var _lengthArticulation = lengthArticulation;
  return {
    getLengthArticulation: function() {
      return _lengthArticulation;
    },
    /**
     * returns true, if there was something to be applied (= a valid input)
     */
    applyToken: function(articulationAsString) {
      if (typeof lengthArticulationMappings[articulationAsString] !== "undefined") {
        _lengthArticulation = lengthArticulationMappings[articulationAsString];
        return true;
      }
      return false;
    },
    clone: function() {
      return createArticulation(_lengthArticulation);
    }
  };
}

function createRhythmPattern(length, events, quarterNoteCount) {
  var _patternLength = length;
  var _events = events;
  var _quarterNoteCount = quarterNoteCount;
  var _defaultArticulation = createDefaultArticulation();

  // TODO Use articulations or delete the code for it!
  // apply the tokens to the articulations object while it works from last to first
  // while (tokens.length > 0 && _defaultArticulation.applyToken(tokens[tokens.length - 1])) {
    // remove applied token
  //  tokens.pop();
  // }

  var pattern = {
    getEvents: function() {
      return _events;
    },
    applyOption: function(key, value) {
      if (key === "q") {
        var valueAsFloat = parseFloat(value);
        if (isNaN(valueAsFloat)) {
          console.error("applyOption() - Ignoring invalid float option value: " + key + "=" + value);
          return;
        }
        _quarterNoteCount = valueAsFloat;
      } else {
        console.error("applyOption() - Ignoring unknown option key: " + key);
      }
    },
    getDefaultArticulation: function() {
      return _defaultArticulation;
    },
    /* Makes only sense, when used by child events, because they way patterns are merged. */
    getQuarterNoteCount: function() {
      return _quarterNoteCount;
    },
    /* Makes only sense, when used by child events, because they way patterns are merged. */
    getLength: function() {
      return _patternLength;
    },
    setLength: function(patternLength) {
      _patternLength = patternLength;
    },
    addPattern: function(otherPattern) {
      _events = _events.concat(otherPattern.getEvents());
    },
    clone: function() {
      // actually the only thing which gets used if the clones is the list of events
      return createRhythmPattern(_patternLength, _events.slice(), _quarterNoteCount);
    }
  };

  return pattern;
}

/**
 * Format of one rhythm pattern:
 *
 * A list of integer numbers each taking up length witihin the rhythm pattern
 * proportional to its value.
 * Total length is the sum of all values.
 *
 *  - breaks: e.g. "!1"
 */
function parseRhythmPattern(patternAsString, referenceResolver) {
  var patternLength = 0;
  var events = [];
  // default quarter note length of a pattern is 4
  var pattern = createRhythmPattern(patternLength, events, 4);
  var defaultArticulation = pattern.getDefaultArticulation();

  var tokens = patternAsString.trim().split(WHITESPACE_REGEX);

  tokens.forEach(function(token) {
    // try to parse event
    var event = parseEvent(token, pattern, defaultArticulation);
    if (event !== false) {
      patternLength += event.getLength();
      events.push(event);
    } else {
      // try to parse option
      var parts = token.split("=");
      if (parts.length === 2) {
        pattern.applyOption(parts[0], parts[1]);
      } else {
        // try to resolve as reference
        var rhythmPattern = referenceResolver.resolveReference(token);
        // and merge it into the rhythm
        if (rhythmPattern) {
          // this works, because the added events still reference their original
          // patterns, so what these events return for their length in quarter notes
          // still stays the same
          pattern.addPattern(rhythmPattern);
        }
      }
    }
  });
  pattern.setLength(patternLength);
  return pattern;
}

/**
 * Returns false if eventAsString is nothing valid to be parsed.
 */
function parseEvent(eventAsString, pattern, defaultArticulation) {
  if (eventAsString.length == 0) {
    return false;
  }
  var eventAsStringBeingParsed = eventAsString;
  var isRest = false;
  var value = 0;

  if (eventAsStringBeingParsed[0] == "!") {
    isRest = true;
    eventAsStringBeingParsed = eventAsStringBeingParsed.substr(1);
  }

  value = parseFloat(eventAsStringBeingParsed);
  if (isNaN(value)) {
    return false;
  }

  var articulation = defaultArticulation.clone();

  // maybe add articulation
  // XXX only works for one shorthand
  articulation.applyToken(eventAsStringBeingParsed[eventAsStringBeingParsed.length - 1]);

  return createEventObject(value, isRest, pattern, articulation);
}

function createEventObject(length, isRest, pattern, articulation) {
  var _length = length;
  var _isRest = isRest;
  var _articulation = articulation;
  var _pattern = pattern;
  return {
    /**
     * The duration of the whole event
     */
    getLength: function() {
      return _length;
    },
    isRest: function() {
      return _isRest;
    },
    /**
     * returns the length in quarter notes
     */
    getLengthInQN: function() {
      return (_length / _pattern.getLength()) * _pattern.getQuarterNoteCount();
    },
    clone: function() {
      return createEventObject(_length, _isRest, _pattern, _articulation);
    }
  };
}

var rhythmParserDelegate = {
  getName: function() {
    return "Rhythms";
  },
  parseThing: function(singleLineString, referenceResolver) {
    return parseRhythmPattern(singleLineString, referenceResolver);
  },
  addNoNameThing: function(rhythmPattern, referenceMap) {
    // the last rhythm without a name becomes the default rhythm
    referenceMap.defaultRhythmPattern = rhythmPattern;
  }
};

lib.parseRhythmPatterns = function(multilineString) {
  var map = recursiveParser.parseThingsRecursive(multilineString, rhythmParserDelegate);
  // assure a default rhythm pattern
  if (!map.defaultRhythmPattern) {
    // use the first named pattern
    var defaultPattern;
    for (var key in map) {
      if (map.hasOwnProperty(key)) {
        map.defaultRhythmPattern = map[key];
        break;
      }
    }
  }
  return map;
};

lib.parseRhythmPattern = parseRhythmPattern;
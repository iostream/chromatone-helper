var lib = {};
module.exports = lib;

var voicingLib = require("./voicing.js");
var recursiveParser = require("../recursive_parser.js");

var REGEX_COUNT_SCALE = /\*/g;

function resolveRhythmPattern(rhythmReference, rhythmPatterns, chordDefString) {
  if (!rhythmPatterns[rhythmReference]) {
    console.warn("Unknown rhythm reference \"" + rhythmReference + "\" used in chord definition \"" + chordDefString  + "\"");
    return;
  }
  return rhythmPatterns[rhythmReference];
}

/**
 * Returns false if there is no valid chord definition to be parsed.
 */
function parseChordDefinition(chordDef, voicings, scales, rhythmPatterns, arpeggioPatterns) {
  var _step = parseInt(chordDef.trim());
  if (isNaN(_step)) {
    return false;
  }

  // make step 0 based
  --_step;

  voicings = voicings || {defaultVoicing: "1 3 5"};
  var defaultVoicing = voicings.defaultVoicing;
  // parse shall return the chord definition, when chord defs are passed
  if (typeof(chordDef.getInversion) === "function") {
    // TODO FIXME shouldn't these functions return copies?
    return chordDef;
  }

  /**
   * returns an array of integers values used within the chord definition being parsed which have the given key.
   *
   * Example chord definition with an int parameter: 1
   */
  function parseIntParameters(key, defaultValue, description) {
    var parameterValues = [];
    var defaultValues = [defaultValue];

    var searchIndex = 0;
    while (chordDef.length > searchIndex) {
      var index = chordDef.indexOf(key, searchIndex);
      if (index === -1) {
        // stop, there is nothing to see here
        if (parameterValues.length === 0) {
          return defaultValues;
        }
        return parameterValues;
      }
      var parameterValue = parseInt(chordDef.substring(index + 1));
      if (isNaN(parameterValue)) {
        console.error("parseChordDefinition.parseIntParameter() - Could not parse " + description + " out of: " + chordDef);
        return defaultValues;
      }
      parameterValues.push(parameterValue);
      searchIndex = index + 1;
    }

    if (parameterValues.length === 0) {
      return defaultValues;
    }

    return parameterValues;
  }

  /**
   * Some rules:
   * - All string parameters must be at the end of the string.
   * - keys must be in higher case
   * - values must be in lowercase
   *
   * Examples: (key is "V")
   *
   * 1*t5VaVtension
   * 1*t5VaVb7      // TODO maybe having them (b7, b5, b3 as defauls fallbacks available all time would be best! OR not! because it interfers with a1, a2; b1, b2, b3)
   */
  function parseStringParameters(key, defaultValue, description) {
    var parameterValues = [];

    var searchIndex = 0;
    while (chordDef.length > searchIndex) {
      searchIndex = chordDef.indexOf(key, searchIndex);
      if (searchIndex === -1) {
        // stop, there is nothing to see here
        if (parameterValues.length === 0) {
          return [defaultValue];
        }
        return parameterValues;
      }

      var valueStartIndex = searchIndex + 1;

      // find end of value: everything which comes after the key as long as it is lower case
      while (chordDef.length > (searchIndex + 1) && chordDef[searchIndex + 1].toLowerCase() === chordDef[searchIndex + 1]) {
        ++searchIndex;
      }

      ++searchIndex;

      var value = chordDef.substring(valueStartIndex, searchIndex);
      if (value.length > 0) {
        parameterValues.push(value);
      }
    }

    return parameterValues;
  }

  var _chordDef = "" + chordDef;

  // any parameter can be used multiple times and the result just gets
  // reduced to one value, basically allows for easier input and also hopefully reading
  function sum(a, b) { return a + b; };
  var _inversion = parseIntParameters("i", 0, "inversion").reduce(sum, 0);
  var _transposition = parseIntParameters("t", 0, "transposition").reduce(sum, 0);
  var _scale;

  // set scale reference...
  var scaleIndex = (_chordDef.match(REGEX_COUNT_SCALE) || []).length;
  if (scales.length > scaleIndex) {
    _scale = scales[scaleIndex];
  } else {
    console.error("Cannot assign scale to chord definition \"" +  _chordDef + "\", because there are currently only " + scales.length + " scales available.");
    if (scales.length > 0) {
      _scale = scales[0];
    }
  }

  function mergeVoices(combinedVoicing, voicing) {
    var voice;
    for (var i in voicing) {
      if (!voicing.hasOwnProperty(i)) {
        continue;
      }
      voice = voicing[i];
      combinedVoicing[voice] = voice;
    }
  }

  var _rhythmPattern;
  var rhythmPatternReferences = parseStringParameters("R", null, "rhythms");
  if (rhythmPatternReferences.length == 1) {
    if (rhythmPatternReferences[0] !== null) {
      _rhythmPattern = resolveRhythmPattern(rhythmPatternReferences[0], rhythmPatterns, chordDef);
    }
  } else if (rhythmPatternReferences.length > 1) {
    rhythmPatternReferences.forEach(function(patternReference) {
      var pattern = resolveRhythmPattern(patternReference, rhythmPatterns, chordDef);
      if (!pattern) {
        return;
      }
      if (!_rhythmPattern) {
        _rhythmPattern = pattern.clone();
        return;
      }
      _rhythmPattern.addPattern(pattern);
    });
  }

  var _voicing = parseStringParameters("V", defaultVoicing, "voicings")
    // map voicing references to actual voicings
    .map(function(voicingReference) {
      if (voicingLib.isVoicing(voicingReference)) {
        return voicingReference;
      }
      if (Array.isArray(voicingReference)) {
        return voicingReference;
      }
      if(voicings[voicingReference]) {
        return voicings[voicingReference];
      }
      console.warn("Unknown voicing reference \"" + voicingReference + "\" used in chord definition \"" + chordDef  + "\"");
      return defaultVoicing;
    })
    // if more than one voicing was used, they need to be merged
    // TODO does this already work as expected?
    .reduce(function(a, b) {
      var combinedVoicing = {};
      mergeVoices(combinedVoicing, a);
      mergeVoices(combinedVoicing, b);
      return combinedVoicing;
    });

  if (!_voicing) {
    _voicing = defaultVoicing;
  }

  return {
    toString: function() {
      return _chordDef;
    },
    getStep: function() {
      return _step;
    },
    getInversion: function() {
      return _inversion;
    },
    setInversion: function(inversion) {
      _inversion = inversion;
    },
    getTransposition: function() {
      return _transposition;
    },
    getVoicing: function() {
      return _voicing;
    },
    setVoicing: function(voicing) {
      _voicing = voicing;
    },
    getScale: function() {
      return _scale;
    },
    getRhythmPattern: function() {
      return _rhythmPattern;
    }
  };
}

/**
 * Returns an array of chord definitions.
 */
function parseChordDefinitionsLine(singleLineString, voicings, scales, rhythmPatterns, arpeggioPatterns, referencResolver) {
  var defaultVoicing = voicings.defaultVoicing;
  if (typeof singleLineString !== "string") {
    console.error("parseChordDefinitions() - Only strings can be parsed");
    return [];
  }

  var chordDefObjects = [];
  singleLineString.trim().split(/\s+/).forEach(function(token) {
    // try to parse as chord definition
    var chordDef = parseChordDefinition(token, voicings, scales, rhythmPatterns, arpeggioPatterns);
    if (chordDef !== false) {
      chordDefObjects.push(chordDef);
      return;
    }
    // try as a reference
    var chordDefinitions = referencResolver.resolveReference(token);
    if (Array.isArray(chordDefinitions)) {
      // add all referenced chord definitions
      chordDefObjects = chordDefObjects.concat(chordDefinitions);
    }
  });
  return chordDefObjects;
};

/**
 * The parsed thing of the created parser delegate is an array of chord definitions.
 */
function createChordDefinitionsParserDelegate(voicings, scales, rhythmPatterns, arpeggioPatterns) {
  var _voicings = voicings;
  var _scales = scales;
  var _rhythmPatterns = rhythmPatterns;
  var _arpeggioPatterns = arpeggioPatterns;

  return {
    chordDefinitions: [],
    getName: function() {
      return "Chord Definitions";
    },
    parseThing: function(singleLineString, referencResolver) {
      return parseChordDefinitionsLine(singleLineString, _voicings, _scales, _rhythmPatterns, _arpeggioPatterns, referencResolver);
    },
    addNoNameThing: function(chordDefinitions, referenceMap) {
      // all chord definitions without a name become part of the result
      this.chordDefinitions = this.chordDefinitions.concat(chordDefinitions);
    }
  };
};

/**
 * All lines of chord definitions which have no name are accumulated and are
 * returned.
 */
lib.parseChordDefinitions = function(multiLineString, voicings, scales, rhythmPatterns, arpeggioPatterns) {
  var parserDelegate = createChordDefinitionsParserDelegate(voicings, scales, rhythmPatterns, arpeggioPatterns);
  recursiveParser.parseThingsRecursive(multiLineString, parserDelegate);
  return parserDelegate.chordDefinitions;
}

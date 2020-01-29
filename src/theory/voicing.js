var lib = {};
module.exports = lib;

var recursiveParser = require("../recursive_parser.js");

var WHITESPACE_REGEX = /\s+/;

/**
 * returns false if there is no voice (so this should be a reference)
 */
function parseVoice(voiceString) {
  var parsedVoice = parseInt(voiceString);
  if (isNaN(parsedVoice)) {
    return false;
  }
  // make 0 based
  return parsedVoice - 1;
}

/**
 * Voicings are written using 1 based indexes, internally voicings are 0 based.
 *
 * Examples for valid voicing strings:
 *
 * 1 3 5
 * 1 3 5 7, 8
 */
function parseVoicing(voicingString, referenceResolver) {
  var voicing = createVoicing([], []);
  var parts = voicingString.split(",");

  // for each voice or voicing reference
  parts[0].trim().split(WHITESPACE_REGEX).forEach(function(voiceOrVoicingReference) {
    var voice = parseVoice(voiceOrVoicingReference);
    if (voice !== false) {
      voicing.addVoice1(voice);
    } else {
      voicing.addVoicing1(referenceResolver.resolveReference(voiceOrVoicingReference));
    }
  });

  if (parts.length > 1) {
    parts[0].trim().split(WHITESPACE_REGEX).forEach(function(voiceOrVoicingReference) {
      var voice = parseVoice(voiceOrVoicingReference);
      if (voice !== false) {
        voicing.addVoice2(voice);
      } else {
        voicing.addVoicing2(referenceResolver.resolveReference(voiceOrVoicingReference));
      }
    });
  }

  return voicing;
}

/**
 * Creates a voicing object.
 * voices1 .. get inverted
 * voices2 .. get applied after inversion
 */
function createVoicing(voices1, voices2) {
  var _voices1 = voices1;
  var _voices2 = voices2 || [];
  return {
    getVoices1: function() { return _voices1; },
    getVoices2: function() { return _voices2; },
    // add one voice at a time...
    addVoice1: function(voice1) { _voices1.push(voice1); },
    addVoice2: function(voice2) { _voices2.push(voice2); },
    // add many voices at a time using (using this interface this can potentially be optimized/tweaked)
    addVoicing1: function(voicing) { _voices1 = _voices1.concat(voicing.getVoices1()); },
    addVoicing2: function(voicing) { _voices2 = _voices2.concat(voicing.getVoices2()); },
    // for debugging:
    asString: function() { return _voices1.join(" ") + (_voices2.length > 0 ? ", " : "") + _voices2.join(" "); }
  };
}

var voicingParserDelegate = {
  getName: function() {
    return "Voicings";
  },
  parseThing: function(singleLineString, referencResolver) {
    return parseVoicing(singleLineString, referencResolver);
  },
  addNoNameThing: function(voicing, referenceMap) {
    // the last voicing without a name becomes the default voicing
    referenceMap.defaultVoicing = voicing;
  }
};

/**
 * voicingsString .. multiline string
 *
 * @return A mapping of voicing names to voicing objects.
 *         There is always a voicing by the name `defaultVoicing`.
 */
lib.parseVoicings = function(voicingsString) {
  return recursiveParser.parseThingsRecursive(voicingsString, voicingParserDelegate);
}

lib.isVoicing = function(object) {
  return typeof object.getVoices1 === "function";
}

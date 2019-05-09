var lib = {};
module.exports = lib;

var LINES_REGEX = /[^\r\n]+/g;
var WHITESPACE_REGEX = /\s+/;

/**
 * returns voicing (array of 0 based ints)
 */
function resolveVoicingReference(voicingReference, voicings) {
  // resolve voicing reference
  var voicing = voicings[voicingReference];
  if (typeof voicing === "undefined") {
    // TODO what is best to do here?
    console.error("resolveVoicingReference() - Undeclared voicing reference used: " + voicingReference);
    return [];
  }
  
  // already resolved?
  if (Array.isArray(voicing)) {
    return voicing;
  }
  
  // resolve
  voicings[voicingReference] = parseVoicing(voicing, voicings);
  
  return voicings[voicingReference];
}

/**
 * voiceString .. can be a voice, e.g. 3 or a non-numeric reference to one to many voices, e.g. a TODO
 */
function parseVoices(voiceString, voicings) {
  // try to parse voice 
  var voices = [];
  var parsedVoice = parseInt(voiceString);
  if (!isNaN(parsedVoice)) {
    // make 0 based, hence -1
    return [parsedVoice - 1];
  }
  // resolve references
  return resolveVoicingReference(voiceString, voicings);
}

/**
 * Voicings are written using 1 based indexes, internally voicings are 0 based.
 * 
 * Examples for valid voicing strings:
 * 
 * 1 3 5
 * 1 3 5 7, 8
 */
function parseVoicing(voicingString, voicings) {
  // TODO reuse parseChordDefinitions?
  var voices1 = [], voices2 = [], voicingString1;
  var parts = voicingString.split(",");
  voicingString1 = parts[0];
  
  // for each voice or voicing reference
  voicingString1.trim().split(WHITESPACE_REGEX).forEach(function(voiceOrVoicingReference) {
    voices1 = voices1.concat(parseVoices(voiceOrVoicingReference, voicings));
  });
  
  if (parts.length > 1) {
    voices2 = parseVoices(parts[1]);
  }
  
  return createVoicing(voices1, voices2);
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
    getVoices2: function() { return _voices2; }
  };
}

/**
 * voicingsString .. multiline string
 * 
 * @return A mapping of voicing names to voicing objects.
 *         There is always a voicing by the name `defaultVoicing`.
 */
lib.parseVoicings = function(voicingsString) {
  // first just initialize voicings with the unparsed strings, parsing and resolving references follows later,
  // because first all definitions are required to be known
  var voicings = {defaultVoicing: ""},
    // split by lines
    voicingDefinitions = voicingsString.match(LINES_REGEX) || [];
  voicingDefinitions.forEach(function(definition){
    var split = definition.trim().split(":");
    if (split.length > 2) {
      console.error("parseVoicings() - Ignoring voicing definition: " + definition);
      return;
    }
    if (split.length == 1) {
      // the last voicing which has no name, becomes the default voicing
      voicings.defaultVoicing = split[0].trim();
      return;
    }
    voicings[split[0].trim()] = split[1].trim();
  });
  
  // parse and resolve references
  for (var key in voicings) {
    if (!voicings.hasOwnProperty(key)) {
      continue;
    }
    if (!Array.isArray(voicings[key])) {
      voicings[key] = parseVoicing(voicings[key], voicings);
    }
  }
  
  return voicings;
}

lib.isVoicing = function(object) {
  return typeof object.getVoices1 === "function";
}

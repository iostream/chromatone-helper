var lib = {};
module.exports = lib;

var LINES_REGEX = /[^\r\n]+/g;
var WHITESPACE_REGEX = /\s+/;

/**
 * returns the voicing object by its voicing reference name
 */
function resolveVoicingReference(voicingReference, voicings) {
  // resolve voicing reference
  var voicing = voicings[voicingReference];
  if (typeof voicing === "undefined") {
    // TODO what is best to do here?
    console.error("resolveVoicingReference() - Undeclared voicing reference used: " + voicingReference);
    return;
  }

  // already resolved?
  if (lib.isVoicing(voicing)) {
    return voicing;
  }

  // resolve
  voicings[voicingReference] = parseVoicing(voicing, voicings);

  return voicings[voicingReference];
}

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
function parseVoicing(voicingString, voicings) {
  var voicing = createVoicing([], []);
  var parts = voicingString.split(",");

  // for each voice or voicing reference
  parts[0].trim().split(WHITESPACE_REGEX).forEach(function(voiceOrVoicingReference) {
    var voice = parseVoice(voiceOrVoicingReference, voicings);
    if (voice !== false) {
      voicing.addVoice1(voice);
    } else {
      voicing.addVoicing1(resolveVoicingReference(voiceOrVoicingReference, voicings));
    }
  });

  if (parts.length > 1) {
    parts[0].trim().split(WHITESPACE_REGEX).forEach(function(voiceOrVoicingReference) {
      var voice = parseVoice(voiceOrVoicingReference, voicings);
      if (voice !== false) {
        voicing.addVoice2(voice);
      } else {
        voicing.addVoicing2(resolveVoicingReference(voiceOrVoicingReference, voicings));
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

/**
 * voicingsString .. multiline string
 *
 * @return A mapping of voicing names to voicing objects.
 *         There is always a voicing by the name `defaultVoicing`.
 */
lib.parseVoicings = function(voicingsString) {
  // first just initialize voicings with the unparsed strings, parsing and resolving references follows later,
  // because first all definitions are required to be known
  var voicings = {defaultVoicing: ""};
  if (voicingsString.trim() === "") {
    return voicings;
  }
  // split by lines
  var voicingDefinitions = voicingsString.match(LINES_REGEX) || [];
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
    if (!lib.isVoicing(voicings[key])) {
      voicings[key] = parseVoicing(voicings[key], voicings);
    }
  }

  // debugging
  // for (var refName in voicings) {
  //   if (!voicings.hasOwnProperty(refName)) {
  //     continue;
  //   }
  //   console.log("parseVoicings()", refName, voicings[refName].asString());
  // }

  return voicings;
}

lib.isVoicing = function(object) {
  return typeof object.getVoices1 === "function";
}

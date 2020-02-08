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
  var _normalizedVoices1;
  var _dirty = true;

  function init() {
    _normalizedVoices1 = normalizeVoices(_voices1);
    _dirty = false;
  }
  return {
    createNotes: function(scale, inversion) {
      if (_dirty) { init(); }
      var notes = createNotesByVoices(_normalizedVoices1, scale.getNotes());
      if (inversion != 0) {
        invertNotes(notes, inversion);
      }
      // TODO voices2 are added after inversion...!?
      // XXX also see createArpeggioNotes() !

      return notes;
    },
    createInvertedArpeggioNotes: function(scale, inversion) {
      var notes = createNotesByVoices(_voices1, scale.getNotes());
      if (inversion != 0) {
        invertNotes(notes, inversion);
      }
      return notes;
    },
    /**
     * These make the difference when using ">" in arpeggio patterns....
     */
    createArpeggioNotes: function(scale, inversion) {
      // return this.createInvertedArpeggioNotes(scale, inversion);

      // XXX
      if (_dirty) { init(); }

      var notes = this.createNotes(scale, inversion);

      // create mapping between voices and notes, this works, because
      // createNotes() uses the normalized voicing, so every voice is contained
      // exactly one time within notes
      var voiceToNoteMap = new Map();
      notes.forEach(function(note) {
        voiceToNoteMap.set(note.getVoice(), note);
      });

      var arpeggioNotes = [];
      _voices1.forEach(function(voice) {
        arpeggioNotes.push(voiceToNoteMap.get(voice));
      });

      return arpeggioNotes;
    },
    getVoices1: function() { return _voices1; },
    getVoices2: function() { return _voices2; },
    // add one voice at a time...
    addVoice1: function(voice1) { _voices1.push(voice1); _dirty = true; },
    addVoice2: function(voice2) { _voices2.push(voice2); _dirty = true; },
    // add many voices at a time using (using this interface this can potentially be optimized/tweaked)
    addVoicing1: function(voicing) { _voices1 = _voices1.concat(voicing.getVoices1()); _dirty = true; },
    addVoicing2: function(voicing) { _voices2 = _voices2.concat(voicing.getVoices2()); _dirty = true; },
    addPattern: function(voicing) { this.addVoicing1(voicing); this.addVoicing2(voicing); _dirty = true; },
    // for debugging:
    asString: function() { return _voices1.join(" ") + (_voices2.length > 0 ? ", " : "") + _voices2.join(" "); },
    clone: function() {
      return createVoicing(_voices1, _voices2);
    }
  };
}

function createNotesByVoices(voices, scaleNotes) {
 var notes = [];
 for (var i = 0; i < voices.length; ++i) {
   // add cloned notes, so changing the chord's notes won't change the scale's notes
   var noteIndex = voices[i] % scaleNotes.length;
   var noteTransposition = Math.floor(voices[i] / scaleNotes.length) * 12;
   var note = scaleNotes[noteIndex].clone();
   note.setVoice(voices[i]);

   if (noteTransposition !== 0) {
     note.transpose(noteTransposition);
     note.setChromaticInterval(note.getChromaticInterval() + noteTransposition);
   }

   notes.push(note);
 }
 return notes;
}

/**
 * Voices can be used to make "free flowing" arpeggios, e.g. 8 3 8 5 1 5 8 3.
 * This makes sense for using ">", ">*" in arpegguio patterns, but inverting
 * these kind of voicings doesn't makes sense. This is "normalizing" for. The
 * example output would be: 1 3 5 8. It is ordered and duplicates are removed.
 */
function normalizeVoices(voices) {
  if (!Array.isArray(voices) || voices.length === 0) {
    return [];
  }
  // like: sort | uniq (from https://stackoverflow.com/questions/11688692/how-to-create-a-list-of-unique-items-in-javascript)
  return voices.slice(0).sort().filter(function(value, index, array) {
      return (index === 0) || (value !== array[index - 1]);
  });
}

/**
 * notes is an in/out parameter.
 * Inversions can be negative and there are more inversions than note count - 1.
 */
function invertNotes(notes, inversion) {
  // simple and effective....
  if (inversion > 0) {
    var highestNote = notes[notes.length - 1];
    for (var i = 0; i < inversion; ++i) {
      var note = notes.shift();
      while (note.getPosition() <= highestNote.getPosition()) {
        note.transpose(12);
      }
      highestNote = note;
      notes.push(note);
    }
  } else {
    inversion = Math.abs(inversion);
    for (var i = 0; i < inversion; ++i) {
      var note = notes.pop();
      var lowestNote = notes[0];
      while (note.getPosition() >= lowestNote.getPosition()) {
        note.transpose(-12);
      }
      lowestNote = note;
      notes.unshift(note);
    }
  }
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

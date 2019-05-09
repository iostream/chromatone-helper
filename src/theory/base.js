var lib = {};
module.exports = lib;

console.log("Welcome to the Chromatone Helper            !");

var voicingLib = require("./voicing.js");
lib.parseVoicings = voicingLib.parseVoicings;
lib.isVoicing = voicingLib.isVoicing;

// -- diatonic (~0-24) to chromatic notes (0-11) mapping of major scale
// TODO enable bigger intervals
var majorNotes = [
// -- 1-7:
  0, 2, 4, 5, 7, 9, 11,
//  -- 8  9  10  11  12  13  14 
  0+12, 2+12, 4+12, 5+12, 7+12, 9+12, 11+12,
// -- 15
  0+12+12
];

var WHITESPACE_REGEX = /\s+/;

function parseChordDefinition(chordDef, voicings) {
  voicings = voicings || {defaultVoicing: ""};
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
  var _scale; // <- optional
  var _step = parseInt(chordDef.trim()) - 1;
  // any parameter can be used multiple times and the result just gets
  // reduced to one value, basically allows for easier input and also hopefully reading
  function sum(a, b) { return a + b; };
  var _inversion = parseIntParameters("i", 0, "inversion").reduce(sum, 0);
  var _transposition = parseIntParameters("t", 0, "transposition").reduce(sum, 0);
  
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
  
  var _voicing = parseStringParameters("V", defaultVoicing, "voicings")
    // map voicing references to actual voicings
    .map(function(voicingReference) {
      if (lib.isVoicing(voicingReference)) {
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

  if (isNaN(_step)) {
    console.error("parseChordDefinition() - Could not parse step out of: " + chordDef);
    _step = 0;
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
    setScale: function(scale) {
      _scale = scale;
    }
  };
}

lib.parseChordDefinitions = function(chordDefs, voicings) {
  var defaultVoicing = voicings.defaultVoicing;
  if (Array.isArray(chordDefs)) {
    return chordDefs.map(function(chordDef) {
      return parseChordDefinition(chordDef, voicings);
    });
  }
  if (typeof chordDefs !== "string") {
    console.error("parseChordDefinitions() - Only strings can be parsed");
    return [];
  }
  
  var chordDefObjects = [];
  chordDefs.trim().split(/\s+/).forEach(function(chordDef) {
    chordDefObjects.push(parseChordDefinition(chordDef, voicings));
  });
  
  return chordDefObjects;
};

/**
 * TODO Make lookups in intervalNameMap and fallback also work for higher than contained intervals, e.g. if b3 is contained, also b11 should also work
 * 
 * int interval    .. chromatic interval, 0 based
 * int root        .. absolute chromatic root position, 0 based (used for interval naming)
 * intervalNameMap .. Map of chromatic interval (int|string) to interval name (string).
 *                    The fallback always uses flatted intervals.
 *
 * @return a string or the string "error"
 */
function findIntervalName(interval, intervalNameMap) {
  if (typeof intervalNameMap !== "undefined" && typeof intervalNameMap[interval] === "string") {
    return intervalNameMap[interval];
  }
  
  if (interval < 0) {
    console.warn("findIntervalName() - negative interval: " + interval);
    interval += 12;
  }
  
  // fallback
  for (var i = 0; i < majorNotes.length; ++i) {
    if (majorNotes[i] == interval) {
      return "" + (i + 1);
    }
    // that's a bit silly?...
    if (majorNotes[i] - 1 == interval) {
      return "b" + (i + 1);
    }
  }
  
  console.error("findIntervalName() could not find name for interval=" + interval + " in scale ", intervalNameMap, " and automatic conversion also failed!");
  
  return "error";
}

/** used by parseNote() to make interval names **/
var sharp = "#";
var flat = "b";

/**
 * noteDefinition
 * parsedInterval .. optional {ref:"string"} output parameter; can be used to extract a shiny name out of the dirty noteDefinition
 * @return object note
 */
function parseNote(noteDefinition, parsedInterval) {
  var _chromaticRoot = 0,
    intervalNameMap = {};
  
  var note = noteDefinition;
  if (typeof(note) === "undefined") {
    return parseNote("1e");
  }
  if (typeof note !== "string") {
    console.error("parseNote() - Can only parse strings!", note);
    return parseNote("1e");
  }
  if (note==="") {
    return parseNote("1e");
  }
  
  // TODO make this these checks more efficient
  var _marks = [note.indexOf("e") !== -1];
  var _isRoot = note.indexOf("r") !== -1;
  var _isUp = note.indexOf("+") !== -1;
  
  // find interval
  var interval = 1;
  var index = 0;
  var sharps = (note.match(/#/g) || []).length;
  var flats = (note.match(/b/g) || []).length;
  do {
    var input = parseInt(note.substr(index));
    if (!isNaN(input)) {
      // base interval found
      interval = input;
      break;
    }
    if (index >= note.length) {
      // end of string
      break;
    }
    ++index;
  } while (true);
  
  if (typeof parsedInterval !== "undefined" && parsedInterval.ref !== "undefined") {
    parsedInterval.ref = sharp.repeat(sharps) + flat.repeat(flats) + interval;
  }
  
  if (typeof majorNotes[interval - 1] === "undefined") {
    console.error("parseNote() - I have no mapping for major note: " + interval);
  }
  var _chromaticInterval = majorNotes[interval - 1] + sharps - flats;
  
  return {
    getChromaticInterval: function () {
      return _chromaticInterval - _chromaticRoot;
    },
    getPosition: function() {
      return _chromaticInterval;
    },
    setPosition: function(position) {
      _chromaticInterval = position;
    },
    isUp: function() {
      return _isUp;
    },
    setUp: function(isUp) {
     _isUp = isUp; 
    },
    /** int|string mark index or name based lookup */
    hasMark: function(mark) {
      var positionInt = parseInt(mark);
      if (isNaN(positionInt)) {
        if (typeof mark === "undefined") {
          return false;
        }
        
      } else {
        if (position >= _marks.length) {
          return false;
        }
        return _marks[position];
      }
    },
    setIntervalNameMap: function(map) {
      intervalNameMap = map;
    },
    findIntervalName: function() {
      return findIntervalName(this.getChromaticInterval(), intervalNameMap);
    },
    toString: function() {
      var ret = (_isRoot ? "r" : "") + this.findIntervalName() + (_isUp ? "+" : "") + (this.hasMark("e") ? "e" : "");
      // console.log("note.toString() - " + ret);
      return ret;
    },
    isRoot: function() {
      return _isRoot;
    },
    setRoot: function(isRoot) {
      _isRoot = isRoot;
    },
    /** Needed for findIntervalName(), isRoot() marks the actual root! */
    setChromaticRoot(chromaticRoot) {
      _chromaticRoot = chromaticRoot;
    },
    getChromaticRoot() {
      return _chromaticRoot;
    },
    transpose: function(semitones) {
      _chromaticInterval += semitones;
      _chromaticRoot += semitones;
    },
    clone: function() {
      var copy = parseNote(this.toString());
      copy.setIntervalNameMap(intervalNameMap);
      copy.setChromaticRoot(this.getChromaticRoot());
      copy.setPosition(this.getPosition());
      return copy;
    }
  }
}
lib.parseNote = parseNote;

/**
  * @param notes valid input examples: 
  *          ["1 2 r4 6"]
  *          "1 2 r4 6"
  *          ["1",  2 , "r4", "6"]
  *          an object which has the function getNotes
  *          ["1", "2", "r4", "6"]  (= output format)
  * @param intervalNameMap optional out parameter @see findIntervalName()
  */
function parseNotes(notes, intervalNameMap, recursion) {
  intervalNameMap = intervalNameMap || {};
  
  function createNote(noteDef) {
    var parsedName = {ref: ""};
    var note = parseNote(noteDef, parsedName);
    
    // TODO handle conflicts
    intervalNameMap[note.getChromaticInterval()] = parsedName.ref;
    
    // notes which were parsed in a group will share the same names by default:
    note.setIntervalNameMap(intervalNameMap);
    
    return note;
  }
  
  // this method is a mess!
  recursion = recursion || false;
  var c = notes;
  if (typeof c === "undefined") {
    return [];
  }
  
  if (typeof c.getNotes === "function") {
    return notes.getNotes();
  }
  
  if (typeof c === "string") {
    c = c.trim();
    if (c === "") {
      return [];
    }
    if (c.search(WHITESPACE_REGEX) !== -1) {
      var parts = c.split(WHITESPACE_REGEX);
      for (var i=0; i < parts.length; ++i) {
        parts[i] = createNote(parts[i]);
      }
      return parts;
    } else {
      return [createNote(c)];
    }
  }
  
  if (typeof c === "number") {
    return parseNote(""+c);
  }

  if (Array.isArray(c) && !recursion) {
    var outputNotes = [];
    
    for (var i=0; i < c.length; ++i) {
      outputNotes = outputNotes.concat(parseNotes(c[i], intervalNameMap, true));
    }
    return outputNotes;
  }
  
  // TODO is this actually needed?
  var out = c;
  if (recursion && !Array.isArray(c)) {
    out = [c];
  }
  
  return out;
}
lib.parseNotes = parseNotes;

/**
 * TODO Never tested nor used, should be unfinished
 * Returns array of arrays by splitting by comma.
 *
 * output examples:
 *   * [note1, note2, note3]
 *   * [ [note1, note2, note3], [note4, note5] ]
 *   * [ [note1, note2, note3] ]
 *   * []
 */
lib.parseNotesList = function(notesList) {
  if (typeof(notesList) === "string") {
    var result = notesList.trim().split(",");
    for (var i=0; i<parts.length; ++i) {
      result[i] = parseNotes(result[i]);
    }
    return result;
  }
  if (Array.isArray(notesList)) {
    var result = [];
    for (var i=0; i<notesList.length; ++i) {
      result.push(parseNotes(notesList[i]));
    }
    return result;
  }
  console.warn("parseNotesList - don't know how to parse, returning empty array.", notesList);
  return [];
};

/**
 * @param String definition
 * @return scale
 */
function createScale(definition) {
  var notes = parseNotes(definition);
  
  return {
    getNotes: function() {
      return notes;
    },
    
    /**
     * @param chordDef
     */
    createChord: function(chordDef) {
      // TODO can we do this better?
      if (typeof(chordDef.getScale()) !== "undefined" && chordDef.getScale() !== this) {
        return chordDef.getScale().createChord(chordDef);
      }
      
      // TODO this is now kind of a mess here!?
      var _inversion = 0; // <- gets initialized by calling invert() later
      var _step = chordDef.getStep();
      var _voicing = chordDef.getVoicing();
      
      var chordScaleNotes = this.getNotes();
      if (_step > 0) {  
        var tempScale = this.clone()
        tempScale.shift(_step);
        chordScaleNotes = tempScale.getNotes();
      }
      
      function createNotesByVoices(voices, scaleNotes) {
        var notes = [];
        for (var i = 0; i < voices.length; ++i) {
          // add cloned notes, so changing the chord's notes won't change the scale's notes
          var noteIndex = voices[i] % scaleNotes.length;
          var noteTransposition = Math.floor(voices[i] / scaleNotes.length) * 12;
          var note = scaleNotes[noteIndex].clone();
          // mark the root
          if (voices[i] % scaleNotes.length === 0) {
            note.setRoot(true);
          }
          if (noteTransposition !== 0) {
            note.transpose(noteTransposition);
            note.setChromaticRoot(note.getChromaticRoot() - noteTransposition);
          }
          notes.push(note);
        }
        return notes;
      }
      
      var _chordNotes = createNotesByVoices(_voicing.getVoices1(), chordScaleNotes);
      
      // console.log("createChord() - ", _chordNotes.map(function(note){ return note.toString() }).join(", "));
      
      var _name = chordDef.toString();
      
      var chord = {
        getNotes: function() {
          // voices2 are added after inversion...
          var notes = _chordNotes.slice(0);
          var voices2 = _voicing.getVoices2();
          
          for (var i in voices2) {
            if (!voices2.hasOwnProperty(i)) {
              continue;
            }
            // TODO add .... but exactly how ....?
          }
          return notes;
        },
        // TODO I dont like how the find methods are implemented
        getHighestNote: function() {
          return this.findHighestNote();
        },
        getLowestNote: function() {
          return this.findLowestNote();
        },
        findHighestNote: function() {
          return this.getNotes().reduce(
            function(highestNote, note) {
              if (highestNote === null || note.getPosition() > highestNote.getPosition()) {
                highestNote = note;
              }
              return highestNote;
            },
            null
          );
        },
        findLowestNote: function() {
          return this.getNotes().reduce(
            function(lowestNote, note) {
              if (lowestNote === null || note.getPosition() < lowestNote.getPosition()) {
                lowestNote = note;
              }
              return lowestNote;
            },
            null
          );
        },
        invert: function() {
          var notes = _chordNotes;
          
          if (notes.length < 2) {
            // this would result in the same "chord"
            return;
          }
          
          // lowest note becomes the highest note
          var lowestNote = notes.shift();
          var highestNote = notes[notes.length - 1];
          while (lowestNote.getPosition() <= highestNote.getPosition()) {
            lowestNote.transpose(12);
          }
          notes.push(lowestNote);
          
          // new lowest note interval is the new chromatic root for all notes
          var newChromaticRoot = notes[0].getPosition();
          for (var i=0; i < notes.length; ++i) {
            notes[i].setChromaticRoot(newChromaticRoot);
          }
          
          _inversion = (_inversion + 1) % notes.length;
        },
        transpose: function(semitones) {
          if (semitones == 0) {
            return;
          }
          for (var i=0; i<_chordNotes.length; ++i) {
            _chordNotes[i].transpose(semitones);
          }
        },
        getName: function() {
          return _name + (_inversion > 0 ? (" " + _inversion): "");
        }
      };
      
      // execute stuff the chord definition tells...
      
      // inversion
      for (var i=0; i<chordDef.getInversion(); ++i) {
        chord.invert();
      }
      
      // transposition
      chord.transpose(chordDef.getTransposition());
      
      return chord;
    },
    shift: function(steps) {        
      if (steps == 0) {
        return;
      }
      
      // also the root notes of all chords notes get shifted
      var newChromaticRoot;

      // do the shift
      if (steps > 0) {
        //newChromaticRoot = notes[steps % notes.length].getPosition();
        for (var i = 0; i < steps; ++i) {
          var note = notes.shift();
          // TODO does it also depend on the other scale notes, maybe sometimes even more than 12 are required or are the different algorithms? I mean, maybe.... look it up man.
          note.transpose(12);
          notes.push(note);
        }
      } else {
        // newChromaticRoot = notes[(notes.length + steps) % notes.length].getPosition();
        for (var i = 0; i < Math.abs(steps); ++i) {
          var note = notes.pop();
          // TODO does it also depend on the other scale notes, maybe sometimes even more than 12 are required or are the different algorithms? I mean, maybe.... look it up man.
          note.transpose(-12);
          notes.unshift(note);
        }
      }
      
      newChromaticRoot = notes[0].getPosition();
      // set the new chromatic roots after transposing, so they are not affected by it
      for (var i = 0; i < notes.length; ++i) {
        notes[i].setChromaticRoot(newChromaticRoot);
      }
      
      // console.log("scale.shift(): " + oldNotes.join(" ") + " shifted " + steps + " times -> " + notes.join(" ") + " notesSiftedButOldNames: " + notesSiftedButOldNames);
    },
    transpose: function(semitones) {
      for (var i=0; i<notes.length; ++i) {
        notes[i].transpose(semitones);
      }
    },
    clone: function() {
      var newNotes = [];
      for (var i=0; i<notes.length; ++i)  {
        newNotes.push(notes[i].clone());
      }
      return createScale(newNotes);
    },
    toString: function() {
      var str = "";
      for (var i=0; i<notes.length; ++i) {
        str += (notes[i].toString() + " ");
      }
      return str.trim();
    }
  };
}
lib.createScale = createScale;

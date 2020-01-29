var lib = {};
module.exports = lib;
/**
* TODO find better names for the functions and the file
*/

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
    do {
      interval += 12;
    } while(interval < 0);
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

  var _voice;
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
    setChromaticRoot: function(chromaticRoot) {
      _chromaticRoot = chromaticRoot;
    },
    getChromaticRoot: function() {
      return _chromaticRoot;
    },
    transpose: function(semitones) {
      _chromaticInterval += semitones;
      _chromaticRoot += semitones;
    },
    // Optionally a note can know its voice!
    // TODO This could be used in an  alternative note naming mode: "voices"
    // (instead of the interval)
    getVoice: function() {
      return _voice;
    },
    setVoice: function(voice)  {
      _voice = voice;
    },
    clone: function() {
      var copy = parseNote(this.toString());
      copy.setIntervalNameMap(intervalNameMap);
      copy.setChromaticRoot(this.getChromaticRoot());
      copy.setPosition(this.getPosition());
      copy.setVoice(this.getVoice());
      return copy;
    }
  }
}
lib.parseNote = parseNote;

/**
  * TODO if notes is a chord, then altering the returned notes would alter the chord
  *
  * @param notes valid input examples:
  *          ["1 2 r4 6"]
  *          "1 2 r4 6"
  *          ["1",  2 , "r4", "6"]
  *          an object which has the function getNotes
  *          ["1", "2", "r4", "6"]  (= output format)
  * @param intervalNameMap optional out parameter @see findIntervalName()
  *
  * @return an array of note objects
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

  // see TODO of function
  //if (typeof c.getNotes === "function" && typeof c.clone === "function") {
  //  return notes.clone().getNotes();
  //}
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

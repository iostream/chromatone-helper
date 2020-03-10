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

// mapping between letter and relative chromatic root
var letters = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
var letterMap = {};
letters.forEach(function(letter, index) {
  letterMap[letter] = majorNotes[index];
});
var defaultRegister = 4;

/**
 * Returns the chromatic position of the tonic of the key.
 */
function parseKeyPosition(keyName) {
  var register = defaultRegister;
  var pos = 0;
  var letter = keyName[pos].toLowerCase();
  if (!letterMap.hasOwnProperty(letter)) {
    console.error('parseKeyPosition() - Cannot parse unknown letter: ' + letter + ' (of ' + keyName + ')');
    return 60;
  }
  var relativeRoot = letterMap[letter];

  ++pos;
  // apply flats and sharps and register
  while (pos < keyName.length) {
    var char = keyName[pos];
    if (char == flat) {
      relativeRoot -= 1;
      ++pos;
    } else if (char == sharp) {
      relativeRoot += 1;
      ++pos;
    } else {
      register = parseInt(keyName.substring(pos));
      if (isNaN(register)) {
        register = defaultRegister;
        console.error('parseKeyPosition() - Cannot parse register: ' + keyName[pos] + ' (of ' + keyName + ')');
      }
      // whatever comes after the register would be ignored
      break;
    }
  }

  // c0 = 12
  return 12 + (register * 12) + relativeRoot;
}

// mapping (in form of a sparce array) between relative chromatic positions of the first octave and letters
var chromaticKeyMap = {};
for (var i = 0; i < 7; ++i) {
  chromaticKeyMap[majorNotes[i]] = letters[i];
}

lib.findKeyName = function(keyPosition, preferB) {
  var relativeKeyPosition = keyPosition % 12;
  var register = Math.floor(keyPosition / 12) - 1;
  if (chromaticKeyMap.hasOwnProperty(relativeKeyPosition)) {
    return chromaticKeyMap[relativeKeyPosition].toUpperCase() + register;
  }
  var nextIndex = (relativeKeyPosition + 1) % 7;
  if (chromaticKeyMap[nextIndex] === keyPosition) {
    return chromaticKeyMap[nextIndex].toUpperCase() + register;
  }
  var previousIndex = (relativeKeyPosition == 0) ? 7 : relativeKeyPosition - 1;
  if (chromaticKeyMap[previousIndex] === keyPosition) {
    return chromaticKeyMap[previousIndex].toUpperCase() + register;
  }
  if (preferB) {
    return chromaticKeyMap[nextIndex].toUpperCase() + 'b' + register;
  } else {
    return chromaticKeyMap[previousIndex].toUpperCase() + '#' + register;
  }
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
    do {
      interval += 12;
    } while(interval < 0);
  }

  // fallback
  for (var i = 0; i < majorNotes.length; ++i) {
    var relativeInterval = interval % 12;
    if (majorNotes[i] == relativeInterval || majorNotes[i] - 1 == relativeInterval) {
      var add = 7 * (Math.floor(interval / 12)); // the major scale has 7 notes
      if (majorNotes[i] - 1 == interval) {
        return "b" + (i + 1 + add);
      }
      return "" + (i + 1 + add);
    }
  }

  console.error("findIntervalName() could not find name for interval=" + interval + " in scale ", intervalNameMap, " and automatic conversion also failed!");

  return "error";
}

/** used by parseNote() to make interval names **/
var sharp = "#";
var flat = "b";

/**
 * noteDefinition .. basically describes an interval
 * rootPosition .. chromatic position of the key the note is in
 * parsedInterval .. optional {ref:"string"} output parameter; can be used to extract a shiny name out of the dirty noteDefinition
 * @return object note
 */
function parseNote(noteDefinition, rootPosition, parsedInterval) {
  // TODO refactor how the note names are determined, make and cleaner and more flexible!
  var intervalNameMap = {};
  var _position = rootPosition;
  var _rootPosition = rootPosition;

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
  _position += _chromaticInterval;

  var _voice;
  return {
    getChromaticInterval: function () {
      return _chromaticInterval;
    },
    getPosition: function() {
      return _position;
    },
    setPosition: function(position) {
      _position = position;
    },
    setChromaticInterval: function(chromaticInterval) {
      _chromaticInterval = chromaticInterval;
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
    transpose: function(semitones) {
      _position += semitones;
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
      var copy = parseNote(this.toString(), _rootPosition);
      copy.setIntervalNameMap(intervalNameMap);
      copy.setVoice(this.getVoice());
      copy.setPosition(_position);
      return copy;
    }
  }
}
lib.parseNote = parseNote;

lib.parseNotes = function(notes) {
  if (typeof(notes.getNotes) === 'function') {
    return notes.getNotes();
  }
  return lib.parseNotesObject(notes).getNotes();
};

function createNotesObject(notes, keyPosition, keyName) {
  var _notes = notes;
  var _keyPosition = keyPosition;
  var _keyName = keyName;
  return {
    getNotes: function() { return _notes; },
    getKeyPosition: function() { return _keyPosition; }, // <- returns the chromatic position
    getKeyName: function() { return _keyName; }
  };
}

lib.createNotesObject = createNotesObject;

var defaultKeyName = 'C4';
var defaultKeyPosition = parseKeyPosition(defaultKeyName);
/**
  * TODO if notes is a chord, then altering the returned notes would alter the chord
  *
  * using e.g. "k=d" or "k=eb" sets the key (root note of scale) using letter musical nomenclature.
  * per default the register is 4 (c4 = middle c), but it can be changed using an
  * integer at the end, e.g. "a#2".
  *
  * @param notes valid input examples:
  *          "1 2 r4 6"
  *          "1 2 r4 6 k=c#3"
  *          a note object    (-> it gets returned)
  * @param intervalNameMap optional out parameter @see findIntervalName()
  *
  * @return an array of note objects
  */
lib.parseNotesObject = function(notesLine, intervalNameMap) {
  intervalNameMap = intervalNameMap || {};
  if (isNotesObject(notesLine)) {
    return notesLine;
  }
  // TODO is this robust or masking possible errors?
  if (typeof(notesLine) !== "string") {
    console.error('parseNotesObject() - Cannot handle object type of line: ' + typeof(notesLine));
    return createNotesObject("", defaultKeyPosition, defaultKeyName);
  }
  notesLine = notesLine.trim();
  return parseLineOfNotes(notesLine);

  function parseLineOfNotes(line) {
    var parts = line.split(WHITESPACE_REGEX);
    if (parts.length == 0) {
      return [];
    }
    // middle default is middle c
    var keyName = defaultKeyName;
    var keyPosition = defaultKeyPosition;
    var lastPart = parts[parts.length - 1];
    var option = lastPart.split('=');
    if (option.length > 1) {
      if (option[0] == 'k') {
        keyName = option[1];
        keyPosition = parseKeyPosition(keyName);
      } else {
        console.warn('parseLineOfNotes() - Unknown option used: ' + option[0]  + ' (of ' + keyName + ')');
      }
      parts.pop();
    } else if (isNaN(parseInt(lastPart)) && lastPart[0] != 'b') {
      // alternative for k=E#, just write the key after the notes, like:
      // 1 2 3 4 5 6 7 E#
      // the key B must be written using a big letter, otherwise if there is
      // a pitch at the end starting with b (e.g. b7), it would set the key to B7
      keyName = lastPart;
      keyPosition = parseKeyPosition(lastPart);
      parts.pop();
    }
    for (var i = 0; i < parts.length; ++i) {
      parts[i] = createNote(parts[i], keyPosition);
    }
    return createNotesObject(parts, keyPosition, keyName);
  }

  function createNote(noteDef, chromaticRoot) {
    var parsedName = {ref: ""};
    var note = parseNote(noteDef, chromaticRoot, parsedName);

    // TODO handle conflicts
    intervalNameMap[note.getChromaticInterval()] = parsedName.ref;

    // notes which were parsed in a group will share the same names by default:
    note.setIntervalNameMap(intervalNameMap);

    return note;
  }
}

function isNotesObject(object) {
  return typeof(object.getKeyPosition) === 'function';
}

var ChromatoneLibTheory = {};
(function(lib) {
  console.log("Welcome to the Chromatone Helper            !");
    
  // -- diatonic (~0-24) to chromatic notes (0-11) mapping of major scale
  // TODO enable bigger intervals
  var majorNotes = [
  // -- existing steps 1-7:
    0, 2, 4, 5, 7, 9, 11,
  //  -- the "exotic" ones:
  //  -- 8  9  A  B  C  D  E 
    0, 2, 4, 5, 7, 9, 11,
  // -- F
    0
  ];
  
  function parseChordDefinition(chordDef) {
    var _step = parseInt(chordDef.trim()) - 1;
    var _inversion = 0;
    
    var index = chordDef.indexOf("i");
    if (index !== -1 && chordDef.length >= index) {
      _inversion = parseInt(chordDef.substring(index + 1));
      if (isNaN(_inversion)) {
        console.error("parseChordDefinition() - Could not parse inversion out of: " + chordDef);
        _inversion = 0;
      }
    }
    
    if (isNaN(_step)) {
      console.error("parseChordDefinition() - Could not parse step out of: " + chordDef);
      _step = 0;
    }
    
    return {
      getStep: function() {
        return _step;
      },
      getInversion: function() {
        return _inversion;
      },
      setInversion: function(inversion) {
        _inversion = inversion;
      }
    };
  }
  
  lib.parseChordDefinitions = function(chordDefs) {
    if (typeof chordDefs !== "string") {
      console.error("parseChordDefinitions() - Only strings can be parsed");
      return [];
    }
    
    var chordDefObjects = [];
    chordDefs.trim().split(" ").forEach(function(chordDef) {
      chordDefObjects.push(parseChordDefinition(chordDef));
    });
    
    return chordDefObjects;
  };
  
  /**
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
      if (c.indexOf(" ") != -1) {
        var parts = (c.trim()).split(" ");
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
   * TODO Never tested, should be not finished
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
       * @param int optional count of notes
       * @param int optional inversion (only 0..count-1 makes sense)
       */
      createChord: function(chordDef, count) {
        // TODO this is now kind of a mess here!
        count = count || 4;
        var _inversion = 0;
        var _step = chordDef.getStep();
        
        var chordScaleNotes = this.getNotes();
        if (_step > 0) {
          var tempScale = this.clone()
          tempScale.shift(_step);
          chordScaleNotes = tempScale.getNotes();
        }
        
        var chordNotes = [];
        for (var i = 0; i < count; ++i) {
          // add cloned notes, so changing the chord's notes won't change the scale's notes
          var note = chordScaleNotes[(i * 2) % chordScaleNotes.length].clone();
          note.setRoot(false);
          chordNotes.push(note);
        }
        
        // first chord note becomes the root
        chordNotes[0].setRoot(true);
        
        // console.log("createChord() - ", chordNotes.map(function(note){ return note.toString() }).join(", "));
        
        var chord = {
          getNotes: function() {
            return chordNotes;
          },
          invert: function() {
            var notes = this.getNotes();
            
            if (notes.length < 2) {
              // this would result in the same "chord"
              return;
            }
            
            // lowest note becomes the highest note
            var lowestNote = notes.shift();
            lowestNote.transpose(12);
            notes.push(lowestNote);
            
            // new lowest note interval is the new chromatic root for all notes
            var newChromaticRoot = notes[0].getPosition();
            for (var i=0; i < notes.length; ++i) {
              notes[i].setChromaticRoot(newChromaticRoot);
            }
            
            _inversion = (_inversion + 1) % notes.length;
          },
          transpose: function(semitones) {
            for (var i=0; i<chordNotes.length; ++i) {
              chordNotes[i].transpose(semitones);
            }
          },
          getName: function() {
            return (_step + 1) + (_inversion > 0 ? (" " + _inversion): "");
          }
        };
        
        // invert as needed
        for (var i=0; i<chordDef.getInversion(); ++i) {
          chord.invert();
        }
        
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
      clone: function () {
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
  
})(ChromatoneLibTheory);

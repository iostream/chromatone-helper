var ChromatoneLibGUI = {};
(function(lib, tLib) {
     console.log("    \"    \"  \"  ChromatoneLibGUI       !");

  /** 
   * Basic lib stuff...
   */
  function $_(id) { return document.getElementById(id); }

  /**
   * References to DOM elements...
   */
  var chordTemplate = $_("templates").getElementsByClassName("chord")[0],
    chordGroupTemplate = $_("templates").getElementsByClassName("chord-group")[0],
    chromaticKeyboardTemplate = $_("templates").getElementsByClassName("chromatic")[0],
    interactiveFormTemplate = $_("templates").getElementsByClassName("interactive-form")[0],
    chordSection = $_("chords"),
    interactiveSection = $_("interactive");
    
  /**
   * Chromatone lib stuff... TODO FIX IT IT DOES NOT WORK AS INTENDED!!1
   */
  function createChromaticKeyboard(rows, columns) {
    var keyboard = chromaticKeyboardTemplate.cloneNode(true);
    var keyArea = keyboard.getElementsByClassName("keys")[0];
    
    for (var row=0; row < rows; ++row) {
      var chromatic = 0;
      // the first shall never be a cross row (because of the cut out parts there)
      var isCrossRow = row % 2 === rows % 2;
      var rowEl = document.createElement("div");
      // TODO refactor this mess now!
      var rowIteration = Math.floor(rows / 2) - Math.floor(row / 2);
      if (isCrossRow) {
        --rowIteration;
      }
      // rows % 2
      // e.g. class="row x i1" -> second iteration of the cross row
      if (isCrossRow) {
        rowEl.className = "row i" + rowIteration + " x";
        chromatic = 1;
      } else {
        rowEl.className = "row i" + rowIteration;
      }
      var rowColumnCount = isCrossRow ? columns - 1 : columns;
      for (var column = 0; column < rowColumnCount; ++column) {
        var button = document.createElement("span");
        // c<chromaticPosition>
        // r<row>
        button.className = "c" + chromatic;
        rowEl.appendChild(button);
        chromatic += 2;
      }
      keyArea.appendChild(rowEl);
    }
    
    var debug = false;
    function construct(keyboard) {
      return {
        getElement: function() {
          return keyboard;
        },
        add: function(notes, description) {
          var notes = tLib.parseNotes(notes);
          if (debug) {
            console.log("ChromaticKeyboard - Adding notes: ", notes.map(function(note){ return note.toString(); }));
          }
          
          // add each
          var firstNoteIsOnCrossRow = notes.length > 0 && (notes[0].getPosition() % 2) === 1;
          for (var i=0; i<notes.length; ++i) {
            var note = notes[i];
            var absoluteChromatic = note.getPosition();
            var iteration = note.isUp() ? 1 : 0;
            if (i !== 0 && firstNoteIsOnCrossRow && (absoluteChromatic % 2) === 0) {
              ++iteration;
            }

            // find buttons to light
            var query = ".row.i" + iteration + " span.c" + absoluteChromatic;
            var noteEl = keyboard.querySelector(query);
            if (noteEl === null || typeof noteEl === "undefined") {
              console.error("Could not find button to light by note \"" + note.toString() + "\" using query " + query); 
              continue;
            } 
            // add label
            noteEl.innerHTML = '<div class="note-text">' + note.findIntervalName() + "</div>";
            noteEl.classList.add("selected");
            // mark root
            if (note.isRoot()) {
              noteEl.classList.add("root");
            }
          }
          
          // add description
          if (typeof description !== "undefined") {
            var descriptionEl = keyboard.getElementsByClassName("description");
            if (descriptionEl.length > 0) {
              descriptionEl[0].innerHTML = description;
            }
          }
        },
        clone: function() {
          return construct(keyboard.cloneNode(true));
        }
      };
    }
    
    return construct(keyboard);
  }
  lib.createKeyboard = createChromaticKeyboard;

  /**
   * GUI related stuff...
   */

  function createSizeOptimizedChromaticKeyboard(notes, rows) {
    rows = rows || 4;
    notes = tLib.parseNotes(notes);
    if (notes.length < 2) {
      // TODO ääääähhhmmmmm
      return createChromaticKeyboard(3, 7);
    }
    // find highest note (also in the overkill version)
    var highestPosition = notes[0].getPosition();
    for (var i=1; i<notes.length; ++i) {
      if (notes[i].getPosition() > highestPosition) {
        highestPosition = notes[i].getPosition();
      }
    }
    
    return createChromaticKeyboard(rows, Math.ceil(highestPosition / 2));
  }

  function addChord(chord, parent, keyboardTemplate) {
    parent = parent || chordSection;
    var k; // <- keyboard
    if (typeof(keyboardTemplate) !== "undefined") {
      k = keyboardTemplate.clone();
    } else {
      // var k = createChromaticKeyboard(3, 7);
      var k = createSizeOptimizedChromaticKeyboard(chord);
      // k = createChromaticKeyboard(5, 14); 
    }
    var name;
    if (typeof chord.getName !== "undefined") {
      name = chord.getName();
    }
    k.add(chord, name);    
    parent.appendChild(k.getElement());
  }
  lib.addChord = addChord;

  function addChordGroup(chords, title, section, keyboardTemplate) {
    section = section || chordSection; 
    var groupEl = section.appendChild(chordGroupTemplate.cloneNode(true)),
      titleEl = groupEl.getElementsByClassName("title")[0] || false;
    if (titleEl && title) {
      titleEl.innerHTML = title;
    }
      
    if (!Array.isArray(chords)) {
      // make the array out of the string:
      var chordDefinitions = chords.trim().split(",");
      chords = [];
      for (var i = 0; i < chordDefinitions.length; ++i) {
        chords.push(tLib.parseNotes(chordDefinitions[i]));
      }
    }
    
    for (var i = 0; i < chords.length; ++i) {
      addChord(chords[i], groupEl, keyboardTemplate);
    }
  }
  lib.addChordGroup = addChordGroup;
  
  function addBreak() {
      chordSection.appendChild(document.createElement("br"));
  }
  lib.addBreak = addBreak;
  
  lib.addForm = function(submitFunction, section) {
    section = section || interactiveSection;
    var formGroupEl = section.appendChild(interactiveFormTemplate.cloneNode(true)),
    form = formGroupEl.getElementsByClassName("form")[0];
    resultSection = formGroupEl.getElementsByClassName("result")[0];

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      
      var scale = tLib.createScale(form.scale.value);
      var chordDefs = form.chords.value.trim().split(" ");
      
      // make chordDefs 0 based!
      chordDefs = chordDefs.map(function(def){
        return parseInt(def) - 1;
      });
      
      resultSection.innerHTML = "";
      submitFunction(scale, chordDefs, resultSection);
    }, false);
  };
})(ChromatoneLibGUI, ChromatoneLibTheory);

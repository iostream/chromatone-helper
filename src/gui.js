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
   * 
   */
  function createChromaticKeyboard(rows, columns) {
    var keyboard = chromaticKeyboardTemplate.cloneNode(true);
    var keyArea = keyboard.getElementsByClassName("keys")[0];
    
    var rowIteration = 0;
    for (var row=0; row < rows; ++row) {
      var chromatic = 0;
      // the first shall never be a cross row (because of the cut out parts there)
      var isCrossRow = !!(row % 2);
      var rowEl = document.createElement("div");
      
      // e.g. class="row x i1" -> second iteration of the cross row
      if (isCrossRow) {
        rowEl.className = "row i" + Math.floor(rowIteration) + " x";
        chromatic = 1;
      } else {
        rowEl.className = "row i" + Math.floor(rowIteration);
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
      
      keyArea.insertBefore(rowEl, keyArea.firstChild);
      
      rowIteration += 0.5;
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
        addDiff: function(notes) {
          notes = tLib.parseNotes(notes);
          // get all selected notes
          var noteEls = keyboard.getElementsByClassName("selected");
          // query their positions and wrap them each together with their position in an array
          var noteArrays = [];
          for (var i=0; i<noteEls.length; ++i) {
            noteArrays.push([noteEls[i], parseInt(noteEls[i].className.substring(1))]);
          }
          // order them
          noteArrays.sort(function(a, b) { return b[1] - a[1]; });
          // add the diffs
          for (var i=0; i<notes.length; ++i) {
            var el = noteArrays.pop();
            var diff = notes[i].getPosition() - el[1];
            // do not mark no differences ... yet
            if (diff === 0) {
              continue;
            }
            // use half notes, because smaller numbers are faster to comprehend
            var text = diff / 2;
            // build and append dom element
            var diffEl = document.createElement("div");
            diffEl.className = "diff";
            diffEl.appendChild(document.createTextNode(text));
            el[0].appendChild(diffEl);
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
    
    return createChromaticKeyboard(rows, Math.ceil(highestPosition / 2 + 1));
  }

  function addChord(chord, parent, keyboardTemplate) {
    parent = parent || chordSection;
    keyboardTemplate = keyboardTemplate || null;
    var k; // <- keyboard
    if (keyboardTemplate !== null) {
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
    
    return k;
  }
  lib.addChord = addChord;

  function addChordGroup(chords, title, section, keyboardTemplate, nextChordAfterGroup) {
    section = section || chordSection;
    nextChordAfterGroup = nextChordAfterGroup || null;

    var groupEl = section.appendChild(chordGroupTemplate.cloneNode(true)),
      titleEl = groupEl.getElementsByClassName("title")[0] || false;
      
    if (titleEl && title) {
      titleEl.innerHTML = title;
    }
    
    // TODO legacy code?
    if (!Array.isArray(chords)) {
      // make the array out of the string:
      var chordDefinitions = chords.trim().split(",");
      chords = [];
      for (var i = 0; i < chordDefinitions.length; ++i) {
        chords.push(tLib.parseNotes(chordDefinitions[i]));
      }
    }

    for (var i = 0; i < chords.length; ++i) {
      // add chord to the new keyboard
      var keyboard = addChord(chords[i], groupEl, keyboardTemplate);
      var nextChord = chords[(i + 1) % chords.length];
      
      // mark differences between voicings/notes, won't work all the time, because it's very simple:
      // last chord of group and nextChordAfterGroup was passed?
      if (i === chords.length - 1 && nextChordAfterGroup !== null) {
        nextChord = nextChordAfterGroup;
      }
      keyboard.addDiff(nextChord);
    }
  }
  lib.addChordGroup = addChordGroup;
  
  function addBreak(section) {
    section = section || chordSection;
    section.appendChild(document.createElement("br"));
  }
  lib.addBreak = addBreak;
  
  function initPresets(presets, presetSelectElementOrElements, elements) {
    var presetSelectElements = presetSelectElementOrElements;
    if (!Array.isArray(presetSelectElements)) {
      presetSelectElements = [presetSelectElements];
    }
    
    presetSelectElements.forEach(function(presetEl) {
      for (var i=0; i<presets.length; ++i) {
        var preset = presets[i];
        var option = presetEl.appendChild(document.createElement("option"));
        option.value = i;
        option.innerHTML = preset
          .map(function(v){
            return Array.isArray(v) ? v.join(", ") : v;
          })  
          .join(" -> ");
      }
      presetEl.addEventListener("change", function(event) {
        var preset = presets[presetEl.value];
        for (var i=0; i < elements.length; ++i) {
          var elementOrElements = elements[i];
          if (typeof elementOrElements.length !== "undefined") {
            if (!Array.isArray(preset[i])) {
              console.error("initPresets () - Preset not set up right!");
              continue;
            }
            // TODO This is the place where elements need to be deleted/created if the scale count gonna be dynamic (currently there are only 2 scales)
            var index = 0;
            preset[i].forEach(function(presetValue) {
              if (typeof elementOrElements[index] === "undefined") {
                console.error("It's not possible to load so many scales yet: " + (index + 1));
              } else {
                elementOrElements[index].value = presetValue;
              }
              ++index;
            });
            
          } else {
            elementOrElements.value = preset[i];
          }
        }
      });
    });  
  }
  
  /**
   * TODO This is very messy now!
   * 
   * presets .. array of arrays
   */
  lib.addForm = function(submitFunction, presets, voicingPresets, scalePresets, section) {
    section = section || interactiveSection;
    var formGroupEl = section.appendChild(interactiveFormTemplate.cloneNode(true)),
      form = formGroupEl.getElementsByClassName("form")[0],
      resultSection = formGroupEl.getElementsByClassName("result")[0],
      scaleElement = formGroupEl.getElementsByClassName("scale_container")[0],
      scalesElement = formGroupEl.getElementsByClassName("scales")[0],
      chordsElement = formGroupEl.getElementsByClassName("chords")[0];
    
    function submitForm() { form.update.click(); }
    
    [form.preset, form.voicing_preset, form.chords, form.voicing].forEach(function(element) {
      element.addEventListener("change", function() {
        // via the setTimeout the form gets submitted after also the input's event listeners have done their work
        setTimeout(function() { submitForm(); });
      });
    });

    function shiftScale(direction, element) {
      var scale = tLib.createScale(element.value);
      if (scale.getNotes().length < 2) {
        return;
      }
      scale.shift(direction);
      element.value = scale.toString();
      form.update.click();
    }

    function createScaleContainer(rootElement) {
      rootElement = rootElement || scaleElement.cloneNode(true);
      var scaleContainer = {root: rootElement};
      scaleContainer.input = scaleContainer.root.getElementsByClassName("scale")[0];
      scaleContainer.preset = scaleContainer.root.getElementsByClassName("preset")[0];
      return scaleContainer;
    }
    
    var scaleContainers = [];

    /**
     * TODO better would be: addScale() and removeScale(), these are also the
     *      two functions to use this in the GUI (and it will also be triggered by nedded scales by referencing them in
     *      chord definitions)
     * 
     * paintScales initializes scaleContainers and rebuilds all the scale related form input elements etc.
     * (this is brute force and silly but is also more powerful than anything optimized) 
     * 
     * int scaleCount
     */
    function paintScales(scaleCount) {
      if (scaleCount < 1) {
        console.error("repaintScales() - at least one scaleCount is required, not: " + scaleCount);
        return;
      }
      // create and add all scales:
      scaleContainers = [createScaleContainer(scaleElement)];
      for (var i=1; i<scaleCount; ++i) {
        var c = createScaleContainer();
        scaleContainers.push(c);
        // form.insertBefore(c.root, scaleContainers[i - 1].root.nextSibling);
        scalesElement.appendChild(c.root);
      }
      
      scaleContainers.forEach(function(c) {
        // shift scales through all their modes by "<" and ">" buttons
        c.root.querySelectorAll('input[type="button"]').forEach(function(button) {
          if (button.value == "<") {
            button.addEventListener("click", function() { shiftScale(-1, c.input); });
          } else {
            button.addEventListener("click", function() { shiftScale(1, c.input); });
          }
        });
        // each scale comes with handy presets for jump starting everything
        initPresets(scalePresets, c.preset, [c.input]);
        // update result after changing a scale
        c.input.addEventListener("change", submitForm);
      });

    }

    paintScales(2);

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      
      var scales = [];
      scaleContainers.forEach(function(c) {
        var scale = tLib.createScale(c.input.value)
        if (scale.getNotes().length > 0) {
          scales.push(scale);
        }
      });
      
      var chordDefs = form.chords.value;
      var voicing = tLib.parseVoicing(form.voicing.value);
      
      // validate inputs aka only submit valid data
      if (scales.length == 0 || scales[0].getNotes().length == 0 || chordDefs.trim().length == 0 || voicing.length === 0) {
        return;
      }
      
      // repaint all
      resultSection.innerHTML = "";
      submitFunction(scales, chordDefs, voicing, resultSection);
    }, false);
    
    initPresets(presets, form.preset, [form.getElementsByClassName("scale"), form.chords]);
    initPresets(voicingPresets, form.voicing_preset, [form.voicing]);
  };
})(ChromatoneLibGUI, ChromatoneLibTheory);

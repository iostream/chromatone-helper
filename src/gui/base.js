var lib = {};
module.exports = lib;

var formSerialize = require('form-serialize');
var tLib = require("../theory/base.js");
var rhythmLib = require("../theory/rhythm.js");
var arpeggioLib = require("../theory/arpeggio.js");
var zebra = require("./zebra.js");

/**
 * Basic lib stuff...
 */
function $_(id) { return document.getElementById(id); }

/**
 * References to DOM elements...
 */
var chordTemplate = $_("templates").getElementsByClassName("chord")[0],
  chordGroupTemplate = $_("templates").getElementsByClassName("chord-group")[0],
  chordReferenceGroupTemplate = $_("templates").getElementsByClassName("chord-reference-group")[0],
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
    // the first shall never be a cross row (because of the cut out parts there)
    var isCrossRow = !!(row % 2);
    var rowEl = document.createElement("div");
    var chromatic = 0;
    // e.g. class="row x i1" -> second iteration of cross rows
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
          if (!el) {
            console.error("addDiff() - Missing note on keyboard for note " + notes[i].toString());
            continue;
          }
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

function addChord(chord, parent, zebraRoot, nextChord) {
  parent = parent || chordSection;
  var k; // <- keyboard
  // currently only integer root notes work for zebra root notes:
  if (!isNaN(zebraRoot)) {
    k = zebra.createZebraKeyboard(chord.getHighestNote().getPosition() + 1, zebraRoot, chord.getFixedOffset());
  } else {
    k = createChromaticKeyboard(4, Math.ceil(chord.getHighestNote().getPosition() / 2 + 1));
  }

  var name;
  if (typeof chord.getName !== "undefined") {
    name = chord.getName();
  }
  k.add(chord, name);

  if (nextChord) {
    k.addDiff(nextChord);
  }

  parent.appendChild(k.getElement());

  return k;
}
lib.addChord = addChord;

function createChordReferenceGroup(title, section) {
  var groupEl = section.appendChild(chordReferenceGroupTemplate.cloneNode(true)),
    titleEl = groupEl.getElementsByClassName("title")[0] || false;

  if (titleEl && title) {
    titleEl.innerHTML = title;
  }
  return groupEl;
}

function addChordGroup(chords, title, section, nextChordAfterGroup, zebraRoot) {
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
    var keyboard = addChord(chords[i], groupEl, zebraRoot);
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

function addChordsRecursive(chords, chordDefinitionOrComposit, parentElement, zebraRoot) {
  if (typeof chordDefinitionOrComposit.getChildren === "function") {
    var groupElement = createChordReferenceGroup(chordDefinitionOrComposit.getName(), parentElement);
    chordDefinitionOrComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
      addChordsRecursive(chords, chordDefinitionOrComposit2, groupElement, zebraRoot);
    });
    parentElement.appendChild(groupElement);
  } else {
    var chord = chords.shift();
    var nextChord = chords.length > 0 ? chords[0] : false;
    addChord(chord, parentElement, zebraRoot, nextChord);
  }
}

lib.addChordsUsingChordDefinitionComposit = function(chords, chordDefinitionComposit, zebraRoot, parentElement) {
  var chordsCopy = chords.slice();
  parentElement = parentElement || chordSection;
  chordDefinitionComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
    addChordsRecursive(chords, chordDefinitionOrComposit2, parentElement, zebraRoot);
  });
}

function addBreak(section) {
  section = section || chordSection;
  section.appendChild(document.createElement("br"));
}
lib.addBreak = addBreak;

/**
 * presets[]                        .. the presets to be initialized
 * presetSelectElementOrElements|[] .. select element or elements which are used to switch between the different presets
 * elements[]                       .. the elements, the preset values get assigned to when a preset is selected
 */
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
        if (typeof elementOrElements === "function") {
          elementOrElements = elementOrElements(preset[i]);
        }
        if (Array.isArray(elementOrElements)) {
          if (!Array.isArray(preset[i])) {
            console.error("initPresets () - Preset not set up right!");
            continue;
          }
          var index = 0;
          preset[i].forEach(function(presetValue) {
            if (typeof elementOrElements[index] === "undefined") {
              console.error("initPresets () - Preset not set up right: " + (index + 1));
            } else {
              applyPresetValue(elementOrElements[index], presetValue);
            }
            ++index;
          });

        } else {
          applyPresetValue(elementOrElements, preset[i]);
        }
      }
      presetEl.form.update.click();
    });
  });
}

function applyPresetValue(element, presetValue) {
  if (typeof(presetValue) === "undefined") {
    element.value = "";
    return;
  }
  element.value = presetValue;
}

/**
 * TODO This is very messy now!
 *
 * presets .. array of arrays
 */
lib.addForm = function(submitFunction, presets, chordPresets, voicingPresets, scalePresets, rhythmPatternPresets, arpeggioPatternPresets, section) {
  section = section || interactiveSection;
  var formGroupEl = section.appendChild(interactiveFormTemplate.cloneNode(true)),
    form = formGroupEl.getElementsByClassName("form")[0],
    resultSection = formGroupEl.getElementsByClassName("result")[0],
    scaleElementTemplate = formGroupEl.getElementsByClassName("scale_container")[0],
    scalesElement = formGroupEl.getElementsByClassName("scales")[0];

  scaleElementTemplate.style = "display:none";

  function submitForm() { form.update.click(); }

  [form.chords, form.voicing, form.zebra_root, form.rhythms, form.arp].forEach(function(element) {
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

  function createScaleContainer(index, rootElement) {
    rootElement = rootElement || scaleElementTemplate.cloneNode(true);
    rootElement.style = '';
    var scaleContainer = {root: rootElement};
    scaleContainer.input = scaleContainer.root.getElementsByClassName("scale")[0];
    scaleContainer.preset = scaleContainer.root.getElementsByClassName("preset")[0];
    scaleContainer.input.name += ("[" + index + "]");
    scaleContainer.root.querySelector("label").innerHTML = "scale " + "*".repeat(index);
    return scaleContainer;
  }

  var scaleContainers = [];

  function addScaleGUI() {
    var c = createScaleContainer(scaleContainers.length);
    scaleContainers.push(c);
    scalesElement.appendChild(c.root);

    // shift scales through all their modes by "<" and ">" buttons
    c.root.querySelectorAll('input[type="button"]').forEach(function(button) {
      if (button.value == "<") {
        button.addEventListener("click", function() { shiftScale(-1, c.input); });
      } else {
        button.addEventListener("click", function() { shiftScale(1, c.input); });
      }
    });
    // each scale comes with handy presets for jump starting everything:
    initPresets(scalePresets, c.preset, [c.input]);
    // update result after changing the scale text input
    c.input.addEventListener("change", submitForm);
  }

  function popScaleGUI() {
    // skip removing of a scale if it is the last one, so there always is at
    // least one scale left
    if (scaleContainers.length <= 1) {
      return;
    }
    var c = scaleContainers.pop();
    scalesElement.removeChild(c.root);
  }

  // initially there is only one scale available
  addScaleGUI();

  form.add_scale.addEventListener("click", function() {addScaleGUI(); updateSerializedFormOfLocation(); });
  form.pop_scale.addEventListener("click", function() {popScaleGUI(); updateSerializedFormOfLocation(); });

  // TODO refactor to pass options to submitForm(), instead using generateMidi variable
  var generateMidi = false; // <- flag which triggers midi generation after the next form submit
  form.generate_midi.addEventListener("click", function(event) {
    generateMidi = true;
    submitForm();
  });

  var presetElements = form.querySelectorAll(".preset");
  function enablePresets(enabled) {
    presetElements.forEach(function(element) {
      element.disabled = !enabled;
    });
  }

  var serializedForm = null;
  form.addEventListener("submit", function(event) {
    event.preventDefault();

    // disable the preset elements while serializing, so they are ignored for serializing
    enablePresets(false);
    var newSerializedForm = formSerialize(form);
    enablePresets(true);

    var scales = [];
    scaleContainers.forEach(function(c) {
      var scale = tLib.createScale(c.input.value);
      if (scale.getNotes().length > 0) {
        scales.push(scale);
      }
    });

    var chordDefs = form.chords.value;
    var voicings = tLib.parseVoicings(form.voicing.value);

    var rhythmPatterns;
    if (form.rhythms.value.trim().length > 0) {
      rhythmPatterns = rhythmLib.parseRhythmPatterns(form.rhythms.value);
    }
    if (!rhythmPatterns || !rhythmPatterns.defaultRhythmPattern) {
      rhythmPatterns = rhythmLib.parseRhythmPatterns("1");
    }

    var arpeggioPatterns;
    if (form.arp.value.trim().length > 0) {
      arpeggioPatterns = arpeggioLib.parseArpeggioPatterns(form.arp.value);
    }
    if (!arpeggioPatterns || !arpeggioPatterns.defaultArpeggioPattern) {
      arpeggioPatterns = arpeggioLib.parseArpeggioPatterns(">*_");
    }

    // validate inputs aka only submit valid data
    if (scales.length == 0 || scales[0].getNotes().length == 0 || chordDefs.trim().length == 0) {
      return;
    }

    var zebraRoot = parseInt(form.zebra_root.value);
    var options = {
      zebraRoot: zebraRoot,
      generateMidi: generateMidi,
      uploadToDAW: form.upload_to_daw.checked,
      serializedForm: newSerializedForm
    };

    // reset flags
    generateMidi = false;

    // repaint all
    resultSection.innerHTML = "";
    submitFunction(scales, chordDefs, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection);

    serializedForm = newSerializedForm;
    updateSerializedFormOfLocation();
  }, false);

  function updateSerializedFormOfLocation() {
    // using URL, so this won't work in IE 11 :
    var url = new URL("#" + serializedForm, document.location.href);
    document.location.href = url;
  }

  initPresets(
    presets,
    form.preset,
    [
      function(preset) { // returns the scale form elements
        // add as many scale GUIs as needed
        while (preset.length > scaleContainers.length) {
          addScaleGUI();
        }
        // remove unneeded scales
        while (scaleContainers.length > preset.length) {
          popScaleGUI();
        }
        return scaleContainers.map(function(c) { return c.input; });
      },
      form.chords,
      form.voicing
    ]
  );
  initPresets(chordPresets, form.chords_preset, [form.chords]);
  initPresets(voicingPresets, form.voicing_preset, [form.voicing]);
  initPresets(rhythmPatternPresets, form.rhythms_preset, [form.rhythms]);
  initPresets(arpeggioPatternPresets, form.arpeggio_patterns_preset, [form.arp]);

  document.addEventListener('DOMContentLoaded', function(event) {
    updateGUIByUrl();
  });

  window.addEventListener('hashchange', function() {
    updateGUIByUrl();
  }, false);

  function updateGUIByUrl() {
    if (document.location.hash.substring(1) === serializedForm) {
      // the last successfully submitted form is the same like the one which would be applied by submitting the form
      // with the parameters of the current location's url
      // this savely can be skipped, because it would just result in the same result
      // this saves one extra form submission after each form submission triggered by the hashchange event listener
      return;
    }

    // initialize form by hash parameters
    var parameters = new URL("?" + document.location.hash.substring(1), document.location.href).searchParams;

    // add as many scale GUIs as needed
    while (parameters.has("scale[" + scaleContainers.length + "]")) {
      addScaleGUI();
    }

    // initialize the form and submit it
    form.reset(); // <- reset the form, so empty values are possible
    parameters.forEach(function(value, key) {
      form[key].value = value;
    });
    submitForm();
  }
};

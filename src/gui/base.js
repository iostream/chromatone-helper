var lib = {};
module.exports = lib;

var formSerialize = require('form-serialize');
var tLib = require("../theory/base.js");
var presetLib = require("./presets.js");
var rhythmLib = require("../theory/rhythm.js");
var arpeggioLib = require("../theory/arpeggio.js");
var keyboard = require("./keyboard.js");
var zebra = require("./zebra.js");
var stringInstrument = require("./string_instrument.js");
var session = require("./session.js");
var pocketKnife = require("./pocket_knife.js");

function $_(id) { return document.getElementById(id); }
/**
 * References to DOM elements...
 */
var chordTemplate = $_("templates").getElementsByClassName("chord")[0],
  chordGroupTemplate = $_("templates").getElementsByClassName("chord-group")[0],
  chordReferenceGroupTemplate = $_("templates").getElementsByClassName("chord-reference-group")[0],
  interactiveFormTemplate = $_("templates").getElementsByClassName("interactive-form")[0],
  chordSection = $_("chords"),
  interactiveSection = $_("interactive");

function addChord(chord, parent, instrumentType, nextChord, lowestPosition) {
  lowestPosition = lowestPosition || 0;
  parent = parent || chordSection;
  var instrument;

  instrumentType = instrumentType || 'chromatic';
  if (instrumentType == 'zebra') {
    instrument = zebra.createZebraKeyboard(lowestPosition, chord.getHighestNote().getPosition());
  } else if (instrumentType == 'chromatic') {
    instrument = keyboard.createKeyboard(lowestPosition, chord.getHighestNote().getPosition(), 4);
  } else {
    instrument = stringInstrument.createStringInstrumentByType(instrumentType);
  }

  if (!instrument) {
    console.error("addChord() - Unknown instrument type: " + instrumentType);
    return;
  }

  var name;
  if (typeof chord.getName !== "undefined") {
    name = chord.getName();
  }
  instrument.add(chord, name);

  if (nextChord) {
    instrument.addDiff(nextChord);
  }

  parent.appendChild(instrument.getElement());

  return instrument
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

function addChordGroup(chords, title, section, nextChordAfterGroup, instrumentType) {
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
    var keyboard = addChord(chords[i], groupEl, instrumentType);
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

function addChordsRecursive(chords, chordDefinitionOrComposit, parentElement, instrumentType, lowestPosition) {
  if (typeof chordDefinitionOrComposit.getChildren === "function") {
    var groupElement = createChordReferenceGroup(chordDefinitionOrComposit.getName(), parentElement);
    chordDefinitionOrComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
      addChordsRecursive(chords, chordDefinitionOrComposit2, groupElement, instrumentType, lowestPosition);
    });
    parentElement.appendChild(groupElement);
  } else {
    var chord = chords.shift();
    var nextChord = chords.length > 0 ? chords[0] : false;
    addChord(chord, parentElement, instrumentType, nextChord, lowestPosition);
  }
}

lib.addChordProgressionUsingChordDefinitionComposit = function(progression, chordDefinitionComposit, instrumentType, parentElement) {
  var chords = progression.getChords();
  var chordsCopy = chords.slice();
  parentElement = parentElement || chordSection;
  chordDefinitionComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
    addChordsRecursive(chords, chordDefinitionOrComposit2, parentElement, instrumentType, progression.getLowestPosition());
  });
}

function addBreak(section) {
  section = section || chordSection;
  section.appendChild(document.createElement("br"));
}
lib.addBreak = addBreak;

/**
 * TODO This is very messy now!
 *
 * presets .. array of arrays
 */
lib.addForm = function(submitFunction, presets, chordPresets, voicingPresets, scalePresets, rhythmPatternPresets, arpeggioPatternPresets, section) {
  section = section || interactiveSection;
  var formGroupEl = section.appendChild(interactiveFormTemplate.cloneNode(true)),
    form = formGroupEl.getElementsByClassName("form")[0],
    utilityForm = formGroupEl.querySelector("form.utility-form"),
    resultSection = formGroupEl.getElementsByClassName("result")[0],
    scaleElementTemplate = formGroupEl.getElementsByClassName("scale_container")[0],
    scalesElement = formGroupEl.getElementsByClassName("scales")[0];

  formGroupEl.className += (' active');
  scaleElementTemplate.style = "display:none";

  pocketKnife.initPocketKnife(utilityForm);

  function submitForm() { form.update.click(); }

  [form.chords, form.voicing, form.instrument, form.rhythms, form.arp].forEach(function(element) {
    element.addEventListener("change", function() {
      // via the setTimeout the form gets submitted after also the input's event listeners have done their work
      setTimeout(function() { submitForm(); });
    });
  });
  // activate the DAW update checkbox via session, so once it was set in a tab, it stays they same
  if (session.isDAWUpdateActivated()) {
    form.upload_to_daw.checked = true;
  }
  form.upload_to_daw.addEventListener("change", function() {
    session.setDAWUpdateActivated(form.upload_to_daw.checked);
    submitForm();
  });

  if (window.ResizeObserver) {
    document.querySelectorAll("textarea").forEach(function(textAreaElement) {
      var resizeObserver = new ResizeObserver(function () {
        session.saveTextAreaSizes(textAreaElement);
      });
      resizeObserver.observe(textAreaElement);
    });
    session.restoreTextAreaSizes(form);
  }

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
    presetLib.initPresets(scalePresets, c.preset, [c.input]);
    // select nothing as preset, so each valid value is selectable from the start
    c.preset.value = "";
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

    var options = {
      instrument: form.instrument.value,
      generateMidi: generateMidi,
      uploadToDAW: form.upload_to_daw.checked,
      serializedForm: newSerializedForm
    };

    // reset flags
    generateMidi = false;

    // repaint all
    resultSection.innerHTML = "";

    var chordDefParserResult = parseChordDefinitions(chordDefs, voicings, scales, rhythmPatterns, arpeggioPatterns);

    submitFunction(scales, chordDefParserResult, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection);

    serializedForm = newSerializedForm;
    updateSerializedFormOfLocation();
  }, false);

  function updateSerializedFormOfLocation() {
    // using URL, so this won't work in IE 11 :
    var url = new URL("#" + serializedForm, document.location.href);
    document.location.href = url;
  }

  presetLib.initPresets(
    presets,
    form.preset,
    [
      function(preset) { // returns the scale form elements
        // add as many scale GUIs as needed
        while (preset.length > scaleContainers.length) {
          addScaleGUI();
        }
        // remove unneeded scales GUIs
        while (scaleContainers.length > preset.length) {
          popScaleGUI();
        }
        return scaleContainers.map(function(c) { return c.input; });
      },
      form.chords,
      form.voicing
    ]
  );
  presetLib.initPresets(chordPresets, form.chords_preset, [form.chords]);
  presetLib.initPresets(voicingPresets, form.voicing_preset, [form.voicing]);
  presetLib.initPresets(rhythmPatternPresets, form.rhythms_preset, [form.rhythms]);
  presetLib.initPresets(arpeggioPatternPresets, form.arpeggio_patterns_preset, [form.arp]);

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
    // reset all form elements but the checkbox which activates the DAW update
    var inputs = form.elements;
    for (i = 0; i < inputs.length; i++) {
      // setting button values makes no sense
      // the state of upload_to_daw is controlled via the session, so do not overwrite this value
      if (inputs[i].type !== "button" && inputs[i].name !== "upload_to_daw") {
        // this also sets no value for all preset elements, which makes sense,
        // because this way initially there is no value selected which makes all options selectable
        inputs[i].value = "";
      }
    }

    parameters.forEach(function(value, key) {
      if (!form[key] || form[key].type === "button") {
        // skip not existing form elements and buttons
        return;
      }
      form[key].value = value;
    });

    // it is possible to append "&midi=1" to the URL to make a MIDI download link
    if (parameters.get("midi") === "1" || parameters.get("midi") === "true") {
      generateMidi = true;
    }

    submitForm();
  }
};

function addMessage(parentElement, type, message) {
  var textMsg = message;
  if (message.getMessage) {
    textMsg = message.getMessage();
  }
  var el = document.createElement('div');
  el.className = type;
  var text = document.createTextNode(textMsg);
  el.appendChild(text);
  parentElement.appendChild(el);
}

function parseChordDefinitions(chordDefs, voicings, scales, rhythmPatterns, arpeggioPatterns) {
  var chordDefParserResult = tLib.parseChordDefinitions(chordDefs, voicings, scales, rhythmPatterns, arpeggioPatterns);
  var messagesElement = document.querySelector(".interactive-form.active .form-element.chords .messages");
  messagesElement.innerHTML = '';
  chordDefParserResult.getMessageContainer().getErrors().forEach(function(msg) {
    addMessage(messagesElement, 'error', msg);
  });
  chordDefParserResult.getMessageContainer().getWarnings().forEach(function(msg) {
    addMessage(messagesElement, 'warning', msg);
  });
  // addMessage(messagesElement, 'information', chordDefParserResult.getComposite().asString());
  return chordDefParserResult;
}

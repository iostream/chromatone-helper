var lib = {};
module.exports = lib;

var tLib = require("../../theory/base.js");

var zebraKeyboardTemplate = document.getElementById("templates").getElementsByClassName("zebra")[0];

lib.createZebraKeyboard = function(lowestPosition, highestPosition) {
  function isDisplacedButton(chromatic) {
    var relativePosition = chromatic % 12;
    while (relativePosition < 0) {
      relativePosition += 12;
    }
    return relativePosition === 1 || relativePosition === 3 || relativePosition === 6
      || relativePosition === 8 || relativePosition === 10;
  }

  function createButton(chromatic) {
    var button = document.createElement("span");
    // c<chromaticPosition>
    button.className = "c" + chromatic;
    if (isDisplacedButton(chromatic)) {
      button.className += " d";
    }
    return button;
  }
  function createHalfButton(chromatic) {
    var button = createButton(chromatic);
    button.className += " half";
    return button;
  }

  var keyboard = zebraKeyboardTemplate.cloneNode(true);
  var keyArea = keyboard.getElementsByClassName("keys")[0];
  var rowEl = document.createElement("div");
  var chromatic = lowestPosition;
  rowEl.className = "row";

  // if the button before the first button is displaced
  // or if the first button is displaced
  // then add one half button before the actual needed buttons
  if (isDisplacedButton(chromatic - 1) || isDisplacedButton(chromatic)) {
    rowEl.appendChild(createHalfButton(chromatic - 1));
  }
  while (chromatic <= highestPosition) {
    rowEl.appendChild(createButton(chromatic));
    chromatic += 1;
  }
  // if the button after the last button would be displaced
  // or the last button is displaced,
  // then add one half button at the end
  if (isDisplacedButton(chromatic) || isDisplacedButton(chromatic - 1)) {
    rowEl.appendChild(createHalfButton(chromatic));
  }
  keyArea.appendChild(rowEl);

  var debug = false;
  function construct(keyboard) {
    return {
      getElement: function() {
        return keyboard;
      },
      add: function(notes, description) {
        var notes = tLib.parseNotes(notes);
        if (debug) {
          console.log("ZebraKeyboard - Adding notes: ", notes.map(function(note){ return note.toString(); }));
        }

        // add each
        for (var i=0; i<notes.length; ++i) {
          var note = notes[i];
          var absoluteChromatic = note.getPosition();
          var name = note.findIntervalName();

          // find buttons to light
          var query = "span.c" + absoluteChromatic;
          var noteEl = keyboard.querySelector(query);
          if (noteEl === null || typeof noteEl === "undefined") {
            console.error("Could not find button to light by note \"" + note.toString() + "\" using query " + query);
            continue;
          }
          // add label
          noteEl.setAttribute("title", name);
          noteEl.innerHTML = '<p class="note-text">' + name + "</p>";
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
        // currently noop
      },
      clone: function() {
        return construct(keyboard.cloneNode(true));
      }
    };
  }

  return construct(keyboard);
}

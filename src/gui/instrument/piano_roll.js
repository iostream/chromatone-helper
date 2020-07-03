var lib = {};
module.exports = lib;

var tLib = require("../../theory/base.js");

var pianoRollTemplate = document.getElementById("templates").getElementsByClassName("piano-roll")[0];

function createPianoRoll(lowestPosition, highestPosition) {
  var parentElement = chromaticKeyboardTemplate.cloneNode(true);
  return construct(parentElement, lowestPosition, highestPosition);
}

function construct(keyboard, lowestPosition, highestPosition) {

  return {
    getElement: function() {
      return keyboard;
    },
    // url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><linearGradient id='gradient'><stop offset='10%' stop-color='%23F00'/><stop offset='90%' stop-color='%23fcc'/> </linearGradient><rect fill='url(%23gradient)' x='0' y='0' width='100%' height='100%'/></svg>");
    addEvents: function(events, description) {
      var notes = tLib.parseNotes(notes);
      // TODO
      // add description
      if (typeof description !== "undefined") {
        var descriptionEl = keyboard.getElementsByClassName("description");
        if (descriptionEl.length > 0) {
          descriptionEl[0].innerHTML = description;
        }
      }
    },
    addDiff: function(notes) {
      // noop
    },
    clone: function() {
      return construct(keyboard.cloneNode(true));
    }
  };
}

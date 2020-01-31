var session = {};
module.exports = session;

var stringInstrumentTemplate = document.getElementById("templates").getElementsByClassName("string_instrument")[0];

/**
 * An array of pitches/notes provide the base pitches (object.getPosition())
 * of the strings. One note per pitch. .g. bass would be 1 4 b7 b10
 */
lib.createStringInstrument = function(stringBaseNotes, fretCount) {
  var _container = stringInstrumentTemplate.cloneNode(true);
  var _fretBoard = _container.getElementsByClassName("strings")[0];

  var instrument = {};

  stringBaseNotes.forEach(function(note) {
    var string = createString();
    _container.appendChild(string);
    var chromatic = note.getPosition();
    for (var i = 0; i < fretCount; ++i) {
      string.appendChild(createFret(chromatic++));
    }
  });

  return instrument;
}

function createString() {
  var string = document.createElement("div");
  return string;
}

function createFret(chromatic) {
  var fret = document.createElement("span");
  // c<chromaticPosition>
  fret.className = "c" + chromatic;
  return fret;
}

var lib = {};
module.exports = lib;

/**
 * @see https://stackoverflow.com/questions/23451726/saving-binary-data-as-file-using-javascript-from-a-browser
 */
var downloadDataUri = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  // a.style = "display: none";
  a.text = "MIDI";
  return function (dataUri, name) {
    a.href = dataUri;
    a.download = name;
    a.click();
  };
}());

function buildScalesDescription(scales) {
  return scales.map(function(scale, i) {
    return "*".repeat(i) + ": " + scale.toString();
  }).join("\n");
}

/**
 * @see https://github.com/grimmdude/MidiWriterJS
 * 
 * @return string
 */
lib.downloadMidi = function(chords, scales) {
  var basePitch = 60;
  
  var MidiWriter = require("midi-writer-js");
  
  // Start with a new track
  var track = new MidiWriter.Track();

  track.setTempo(162);
  track.addTrackName(buildScalesDescription(scales));

  // do not define an instrument, because program change events moslty suck within DAWs after importing the MIDI file
  // track.addEvent(new MidiWriter.ProgramChangeEvent({instrument : 1}));
  
  chords.forEach(function(chord) {
    var pitches = [];
    chord.getNotes().forEach(function(note) {
      var pitch = note.getPosition() + basePitch;
      pitches.push(pitch);
    });
    
    // all values are 1-100 (not like in MIDI)
    var minVelocity = 70;
    var maxVelocity = 90;
     
    track.addMarker(chord.getName());
    track.addEvent(new MidiWriter.NoteEvent({pitch: pitches, duration: '1'}));
    
  });
  
  var write = new MidiWriter.Writer([track]);
  downloadDataUri(write.dataUri(), "test.mid");
}

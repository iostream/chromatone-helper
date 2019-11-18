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

function buildGeneratorUrl(serializedForm) {
  var url = new URL("#" + serializedForm, document.location.href);
  console.log("buildGeneratorUrl() -> " +  url.href);
  return url.href;
}

/**
 * @see https://github.com/grimmdude/MidiWriterJS
 *
 * @return string
 */
lib.downloadMidi = function(chords, scales, serializedForm, tonalKey) {
  tonalKey = tonalKey || 0;
  // middle c
  var basePitch = 60;

  var MidiWriter = require("midi-writer-js");

  // Start with a new track
  var track = new MidiWriter.Track();

  track.setTempo(110);
  track.addTrackName(buildScalesDescription(scales) + "\nGenerated via: " + buildGeneratorUrl(serializedForm));

  // do not define an instrument, because program change events moslty suck within DAWs after importing the MIDI file
  // track.addEvent(new MidiWriter.ProgramChangeEvent({instrument : 1}));

  chords.forEach(function(chord) {
    var pitches = [];
    var pitchOffset = chord.getFixedOffset();
    chord.getNotes().forEach(function(note) {
      var pitch = basePitch + tonalKey - pitchOffset + note.getPosition();
      pitches.push(pitch);
    });

    track.addMarker(chord.getName());
    track.addEvent(new MidiWriter.NoteEvent({pitch: pitches, duration: '1'}));

  });

  var write = new MidiWriter.Writer([track]);
  downloadDataUri(write.dataUri(), "chromatone-helper.mid");
}

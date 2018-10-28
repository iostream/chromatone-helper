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
  return scales.map(function(scale) {
    return scale.toString();
  }).join(", ");
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
    var notes = chord.getNotes().map(function(note) {
      var pitch = note.getPosition() + basePitch;
      pitches.push(pitch);
      return new MidiWriter.NoteEvent({pitch: pitch, duration: '1'});
    });
    
    // all values are 1-100 (not like in MIDI)
    var minVelocity = 70;
    var maxVelocity = 90;
     
    track.addMarker(chord.getName());
    track.addEvent(notes, function(event, index) {
        // vary the velocity a bit, because this sounds much better!
        return {
          velocity: minVelocity + (Math.random() * (maxVelocity - minVelocity))
        };
      }
    );
  });
  
  var write = new MidiWriter.Writer([track]);
  downloadDataUri(write.dataUri(), "test.mid");
}

lib.downloadMidi = function(chords, scales) {
  var basePitch = 60;
  
  var Midi = require('jsmidgen');

  var file = new Midi.File();
  var track = new Midi.Track();
  file.addTrack(track);

  track.addNote(0, 'c4', 64);
  track.addNote(0, 'd4', 64);
  

  // track.setTempo(162);
  // track.addTrackName(buildScalesDescription(scales));

  // do not define an instrument, because program change events moslty suck within DAWs after importing the MIDI file
  // track.addEvent(new MidiWriter.ProgramChangeEvent({instrument : 1}));
  
  chords.forEach(function(chord) {
    var pitches = [];
    var notes = chord.getNotes().map(function(note) {
      var pitch = note.getPosition() + basePitch;
      pitches.push(pitch);
      return new MidiWriter.NoteEvent({pitch: pitch, duration: '1'});
    });
    
    // all values are 1-100 (not like in MIDI)
    var minVelocity = 70;
    var maxVelocity = 90;
     
    track.addMarker(chord.getName());
    track.addEvent(notes, function(event, index) {
        // vary the velocity a bit, because this sounds much better!
        return {
          velocity: minVelocity + (Math.random() * (maxVelocity - minVelocity))
        };
      }
    );
  });
  
  var write = new MidiWriter.Writer([track]);
  downloadDataUri(write.dataUri(), "test.mid");
}

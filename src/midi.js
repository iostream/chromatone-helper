var lib = {};
module.exports = lib;

const MidiWriter = require("midi-writer-js");

function buildScalesDescription(scales) {
  return scales.map(function(scale, i) {
    return "*".repeat(i) + ": " + scale.toString();
  }).join("\n");
}

/**
 * @see https://github.com/grimmdude/MidiWriterJS
 *
 * @return MidiWriter object
 */
lib.createMidi = function(sequencer, scales, generatorUrl) {
  var midiTracks = [];
  sequencer.getTracks().forEach(track => {
    var midiTrack = new MidiWriter.Track();
    midiTracks.push(midiTrack);
    if (midiTracks.length == 1) {
      midiTrack.addTrackName(buildScalesDescription(scales) + " Generated via: " + generatorUrl);
      midiTrack.addText(generatorUrl);
      midiTrack.setTempo(sequencer.getBpm());
      midiTrack.setTimeSignature(4, 4);
    }

    var qnPos = 0;
    track.getEvents().forEach(events => {
      // TODO can we bring back chord names in MIDI export?
      // track.addMarker(chord.getName());
      events.forEach(function(event) {
        if (!event.isRest()) {
          var pitches = event.getPitches().map(note => note.getPosition());
          var eventDuration = "T" + event.getLengthInQN() * 128;
          var noteData = {
            startTick: qnPos * 128,
            pitch: pitches,
            duration: eventDuration
          };
          midiTrack.addEvent(new MidiWriter.NoteEvent(noteData));
        }
        qnPos += event.getLengthInQN();
      });
    });
  });

  var writer = new MidiWriter.Writer(midiTracks);
  return writer;
}

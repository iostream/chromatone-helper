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
    midiTrack.setTempo(sequencer.getBpm());
    if (midiTracks.length == 1) {
      midiTrack.addTrackName(buildScalesDescription(scales) + " Generated via: " + generatorUrl);
    }

    var restingTime = 0;
    track.getEvents().forEach(events => {
      events.forEach(function(event) {
        // Tn : where n is an explicit number of ticks (T128 = 1 beat)
        var eventDuration = "T" + event.getLengthInQN() * 128;
        if (event.isRest()) {
          restingTime += event.getLengthInQN();
        } else {
          var pitches = event.getPitches().map(function(note) {
            return note.getPosition();
          });
          var noteData = {pitch: pitches, duration: eventDuration};
          if (restingTime > 0) {
            // Tn : where n is an explicit number of ticks (T128 = 1 beat)
            noteData.wait = "T" + restingTime * 128;
            restingTime = 0;
          }
          midiTrack.addEvent(new MidiWriter.NoteEvent(noteData));
        }
        // TODO can we bring back chord names in MIDI export?
        // track.addMarker(chord.getName());
      });
    });
  });

  var writer = new MidiWriter.Writer(midiTracks);
  return writer;
}

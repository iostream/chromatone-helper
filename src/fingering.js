var ChromatoneLibFingering = {};
(function(lib, tLib) {
  console.log("    \"    \"  \"  ChromatoneLibFingering !");

  function updateFingering(notes) {
    var notesArray = tLib.parseNotes(notes);
    
    if (notesArray.length < 1) {
      return;
    }
    
    notesArray[0].setUp(false);
    
    if (notesArray.length < 2) {
      return;
    }      
    
    // second note is up, if it would be on the same row like the note before
    var isUp = notesArray[0].getChromaticInterval() % 2 === notesArray[1].getChromaticInterval() % 2;
    notesArray[1].setUp(isUp);
    
    if (notesArray.length < 3) {
      return;
    }
      
    if (isUp) {
      // third note would also stay up if it is on the same row like the note before
      isUp = notesArray[1].getChromaticInterval() % 2 === notesArray[2].getChromaticInterval() % 2;
    } else {
      isUp = notesArray[1].getChromaticInterval() % 2 !== notesArray[2].getChromaticInterval() % 2;
    }
    notesArray[2].setUp(isUp);
    
    if (notesArray.length < 4) {
      return;
    }
    
    // fourth note always is down
    notesArray[3].setUp(false);
    
    if (notesArray.length > 4) {
      console.warn("updateFingering() - only works with up to 4 notes!");
    }
  }
  lib.updateFingering = updateFingering;
})(ChromatoneLibFingering, ChromatoneLibTheory);

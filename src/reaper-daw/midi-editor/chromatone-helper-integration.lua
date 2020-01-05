-- //////////////////////////////
-- //     Chromatone Helper    //
-- //  Reaper DAW integration  //
-- //       MIDI editor        //
-- //       by iostream        //
-- //     <December 2019>      //
-- //////////////////////////////

-- for debugging or further development
local verbose = false;

function text(message)
    reaper.ShowConsoleMsg(message);
end

local fileName = "/home/iostream/chromatone-helper/chromatone-helper/src/server/last_generated.midi";
local dawInputFileName = "/home/iostream/chromatone-helper/chromatone-helper/src/server/daw_input.txt";

function cleanTake(take)
  local retval, notecnt, ccevtcnt, textsyxevtcnt = reaper.MIDI_CountEvts(take);
  if verbose then
    text(retval .. ",");
    text(notecnt .. ",");
    text(ccevtcnt .. ",");
    text(textsyxevtcnt .. " ");
  end
  -- for  i = 0, ccevtcnt - 1, 1 do
  --  reaper.MIDI_DeleteCC(take, i)
  -- end
  for  i = retval - 1, 0, -1 do
    reaper.MIDI_DeleteNote(take, i)
  end
end

function insertDAWInputIntoMidiEditor(replaceContents)
  local take = reaper.MIDIEditor_GetTake(reaper.MIDIEditor_GetActive())
  if take == nil then
    return;
  end

  -- open input file and return if there is none
  local file = io.open(dawInputFileName, "r");
  if file == nil then
    return;
  end

  -- read first line and return if the file is empty
  local line = file:read("l");
  if line == nil then
    file:close();
    return;
  end

  if replaceContents then
    cleanTake(take);
  end

  -- first line is the description
  reaper.GetSetMediaItemTakeInfo_String(take, "P_NAME", line, true)

  -- add all notes line by line
  local startPosQN = reaper.MIDI_GetPPQPos_StartOfMeasure(take, 0);
  startPosQN = reaper.MIDI_GetProjQNFromPPQPos(take, startPosQN);
  line = file:read("l");
  while line ~= nil do
    addNote(take, startPosQN, line);
    line = file:read("l");
  end
  file:close();

  reaper.MIDI_Sort(take);

  -- remove contents after consuming it, so it is only consumed once
  file = io.open(dawInputFileName, "w+");
  file:close();
end

function reportError(msg)
  text("Error: " .. msg);
end

function addNote(take, startPosQN, serializedNote)
  local selected = true;
  local iPosOut;
  local endTime;
  local channel = 0;
  local pitch;
  local velocity = 100;

  local parameters = {}
  local length = 0;
  for param in string.gmatch(serializedNote, "%d+%.?%d*") do
    -- convert parameter to a number and validate that the parameter is a number
    parameters[length] = tonumber(param);
    if parameters[length] == nil then
      return reportError("Could not parse parameter " .. length .. ": {" .. param .. "} of the serialized note: {" .. serializedNote .. "}.");
    end
    length = length + 1;
  end

  -- validate count of parameters in line
  if not length == 3 then
    return reportError("Could not parse the serialized note: {" .. serializedNote .. "}. Length is " .. length .. ".");
  end

  iPosOut = reaper.MIDI_GetPPQPosFromProjQN(take, startPosQN + parameters[0]);
  endTime = reaper.MIDI_GetPPQPosFromProjQN(take, startPosQN + parameters[1]);
  pitch = parameters[2];

  reaper.MIDI_InsertNote(take, selected, false, iPosOut, endTime, channel, pitch, velocity, true)

  -- text("added note pitch=" .. pitch .. ", start=" .. iPosOut .. ", end: " .. endTime .. "\n");
end

function replaceContentsOfActiveTake()
  local activeMidiEditor = reaper.MIDIEditor_GetActive();
  local activeTake = reaper.MIDIEditor_GetTake(activeMidiEditor);
  reaper.BR_SetTakeSourceFromFile2(activeTake, fileName, true, false);
end

function importMidiIntoArrangement()
  -- reaper.InsertMedia(fileName, 0) <- does not work for me
  local firstSelectedTrack = reaper.GetSelectedTrack(0, 0);
  local mediaItem = reaper.AddMediaItemToTrack(firstSelectedTrack);
--  local take = reaper.AddTakeToMediaItem(mediaItem);
--  reaper.BR_SetTakeSourceFromFile(take, fileName);
end


-- reaper.Undo_BeginBlock()

insertDAWInputIntoMidiEditor(true);

local pollIntervalInSeconds = 1;
local startTime = os.time();
local lastTime = startTime;

function runloop()
  -- only try to update every pollIntervalInSeconds
  local now = os.time();
  if now - lastTime >= pollIntervalInSeconds then
    lastTime = now;
    insertDAWInputIntoMidiEditor(true);
  end
  reaper.defer(runloop);
end

reaper.defer(runloop);

-- importMidiIntoArrangement();
-- replaceContentsOfActiveTake();

reaper.Undo_EndBlock("Chromatone Helper", -1)

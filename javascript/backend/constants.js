/**
 * New node file
 */

// test IDs.

var PRAC_AREA = 0;
var PIC_CON = 1;
var PIC_COMP = 2;
var PAR_LINES = 3;
var IDEA_GEN = 4;
var DES_CHAL = 5;
var ALT_USES = 6;
 
// Requests and responses

var PERM_REQ = "PermReq";
var PERM_RSP = "PermRsp";
var GET_TEST_STATE_REQ = "GetTestStateReq";
var GET_TEST_STATE_RSP = "GetTestStateRsp";
var GET_SESSION_STATE_REQ = "GetSessionStateReq";
var GET_SESSION_STATE_RSP = "GetSessionStateRsp";
var GET_TEST_INSTRUCTION_REQ = "GetTestInstructionReq";
var GET_TEST_INSTRUCTION_RSP = "GetTestInstructionRsp";
var JOIN_LATE_PARTICIPANT_REQ = "JoinLateParticipantReq";
var JOIN_LATE_PARTICIPANT_RSP = "JoinLateParticipantRsp";
var IS_BACKEND_READY_REQ = "IsBackendReadyReq";
var IS_BACKEND_READY_RSP = "IsBackendReadyRsp";
var GET_RESULTS_REQ = "GetResultsReq";
var GET_RESULTS_RSP = "GetResultsRsp";
var GET_TRANSACTIONS_REQ = "GetTransactionsReq";
var GET_INTRODUCTION_REQ = "GetIntroductionReq";
var GET_INTRODUCTION_RSP = "GetIntroductionRsp";


// Messages
var GOTO_MSG = "GotoMsg";
var MOVE_SHAPE_MSG = "MoveShapeMsgMsg";
var ROTATE_SHAPE_MSG = "RotateShapeMsg";
var DRAW_MSG = "DrawMsg";
var ERASE_MSG = "EraseMsg";
var EDIT_DONE_MSG = "EditDoneMsg";
var CHANGE_SCREEN_MSG = "ChangeScreenMsg";
var ADD_IDEA_MSG = "AddIDeaMsg";
var DEL_IDEA_MSG = "DelIdeaMsg";
var UPDATE_IDEA_MSG = "UpdateIdeaMsg";
var ADD_USE_MSG = "AddUseMagMsg";
var DEL_USE_MSG = "DelUseMsg";
var UPDATE_USE_MSG = "UpdateUseMsg";
var START_DRAWING_MSG = "StartDrawingMsg";
var UPDATE_TITLE_MSG = "UpdateTitleMsg";
var UPDATE_TIME_MSG = "UpdateTimeMsg";
var TEST_COMPLETE_MSG = "TestCompleteMsg";
var WAIT_MSG = "WaitMsg";
var RESUME_MSG = "ResumeMsg";
var END_DATA_MSG = "EndDataMsg";
var BACKEND_READY_MSG = "BackendReadyMsg";
var DISCONNECT_MSG = "disconnect";
var TITLE_BEING_EDITED_MSG = "TitleBeingEditedMsg";
var PICCON_BG_CREATED_MSG = "PicConBGCreatedMsg";
var UNDO_MSG = "UndoMsg";
var REDO_MSG = "RedoMsg";

// PERM_REQ Operations

var LOAD_PRACTICE_AREA_PAGE = "LoadPracticeAreaPage";
var EDIT_TITLE = "EditTitle";
var START_TEST = "StartTest";
var LOAD_PICCON_TEST_PAGE = "LoadPicConTestPage";
var CREATE_BACKGROUND = "CreateBackGround";

// objects and operations

var DOT = 1;
var SHAPE = 2;
var TITLE = 3;
var NOTE = 4;
var IDEA = 5;
var OBJECT = 6;

var DRAW = 1;
var ERASE = 2;
var MOVE = 3;
var ROTATE = 4;
var ADD = 5;
var UNDO = 6;
var REDO = 7;


// more values

var GRANTED = "Granted";
var DECLINED = "declined";
var READY = "Ready";
var NOT_READY = "NotReady";
var UPDATE_TIME_INTERVAL =  10;
var INSTRUCTION_SCREEN =  0;
var debug = 1;
var COLOURS = ["", "purple", "red", "blue", "orange", "green"];
var BACKEND_READY_MSG_INTERVAL = 2000;
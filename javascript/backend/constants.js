/**
 * Author: Habib Naderi
 * Department of Computer Science, University of Auckland
 * 
 * This module contains a set of constants which are used in both frontend and backend.
 * Refer to 'database design' and 'communication protocol design' documents for more detailed
 * information.
 */

var VERSION="?v=0.0.1";

// test IDs.

var PRAC_AREA = 0;
var PIC_CON = 1;
var PIC_COMP = 2;
var PAR_LINES = 3;
var IDEA_GEN = 4;
var DES_CHAL = 5;
var ALT_USES = 6;
var END_TEST = 7;

var LAST_TEST = END_TEST;
 
// Requests and responses

var PERM_REQ = "PermReq";
var PERM_RSP = "PermRsp";
var GET_TEST_STATE_REQ = "GetTestStateReq";
var GET_TEST_STATE_RSP = "GetTestStateRsp";
var GET_SESSION_STATE_REQ = "GetSessionStateReq";
var GET_SESSION_STATE_RSP = "GetSessionStateRsp";
var GET_STATE_REQ = "GetStateReq";
var GET_STATE_RSP = "GetStateRsp";
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
var GET_SCREEN_RESULTS_REQ = "GetScreenResultsReq";
var GET_SCREEN_RESULTS_RSP = "GetScreenResultsRsp";
var GET_END_PAGE_REQ = "GetEndPageReq";
var GET_END_PAGE_RSP = "GetEndPageRsp";


// Messages
var GOTO_MSG = "GotoMsg";
var MOVE_SHAPE_MSG = "MoveShapeMsgMsg";
var ROTATE_SHAPE_MSG = "RotateShapeMsg";
var DRAW_MSG = "DrawMsg";
var ERASE_MSG = "EraseMsg";
var EDIT_DONE_MSG = "EditDoneMsg";
var CHANGE_SCREEN_MSG = "ChangeScreenMsg";
var NEXT_SCREEN_MSG = "NextScreenMsg";
var PREV_SCREEN_MSG = "PrevScreenMsg";
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
var BG_CREATED_MSG = "BGCreatedMsg";
var UNDO_MSG = "UndoMsg";
var REDO_MSG = "RedoMsg";
var PLACE_SHAPE_MSG = "PlaceShapeMsg";
var NOTIFY_TEAM_MSG = "NotifyTeamMsg";

    // messages in demo mode.
var DEMO_NEXT_TEST = "DemoNextTest";
var DEMO_STOP_TIMER = "DemoStopTimer";
var DEMO_RESET_TEAM_STATUS = "DemoResetTeamStatus";


// PERM_REQ Operations

var LOAD_TEST_PAGE = "LoadTestPage";
var EDIT_TITLE = "EditTitle";
var START_TEST = "StartTest";
var CREATE_BACKGROUND = "CreateBackGround";

// NOTIFY_TEAM message

var WAIT_FOR_TITLE = "WaitForTitle";
var WAIT_FOR_DESCRIPTION = "WaitForDescription";

// objects and operations

var DOT = 1;
var SHAPE = 2;
var TITLE = 3;
var NOTE = 4;
var IDEA = 5;
var OBJECT = 6;
var USE = 7;

var NUM_OBJECTS = 7;


var DRAW = 1;
var ERASE = 2;
var MOVE = 3;
var ROTATE = 4;
var ADD = 5;
var UNDO = 6;
var REDO = 7;
var DEL = 8;
var UPDATE = 9;
var NUM_OPERATIONS = 9;


// more values

var GRANTED = "Granted";
var DECLINED = "declined";
var READY = "Ready";
var NOT_READY = "NotReady";
var CHANGED = "Changed";
var UNCHANGED = "Unchanged"
var UPDATE_TIME_INTERVAL =  10;
var INSTRUCTION_SCREEN =  0;
var debug = 1;
var COLOURS = ["", "purple", "red", "blue", "orange", "green"];
var BACKEND_READY_MSG_INTERVAL = 2000;
var PIC_COMP_MAX_SCREEN = 10;
var PAR_LINES_MAX_SCREEN = 30;
var DES_CHAL_MAX_SCREEN = 100;
var BACKEND_PIC_CON_BGIMAGE_PATH = "images/pictureconstruction/";
var PIC_CON_BGIMAGE_PATH = "/assets/"+BACKEND_PIC_CON_BGIMAGE_PATH;
var RANDOMIZED_TEST_ORDER = true;
var STARTING_ID_FOR_RANDOMIZATION = 11;

// configuration parameters
var MYSQL_HOST = 'localhost';
var MYSQL_USER = 'b935b086008866';
var MYSQL_PASSWORD = '1b01c493';
var MYSQL_DB = 'creativeteams'
var REDIS_HOST = 'localhost';
var REDIS_PASSWORD = 'apple';
var REDIS_PORT = '13163';
var REDIS_TTL = 30*24*60*60;
	

// DEMO mode related values

var DEMO = false;

var DEMO_TEST_TIME = 60;
var DEMO_TIMER_ACTIVE = 1;
var DEMO_TIMER_INACTIVE = 0;
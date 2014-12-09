/**
 * New node file
 */

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// test IDs.
define("PRAC_AREA", 0);
define("PIC_CON", 1);
define("PIC_COMP", 2);
define("PAR_LINES", 3);
define("IDEA_GEN", 4);
define("DES_CHAL", 5);
define("ALT_USES", 6);
 
// Requests and responses

define("PERM_REQ", "PermReq");
define("PERM_RSP", "PermRsp");
define("GET_TEST_STATE_REQ", "GetTestStateReq");
define("GET_TEST_STATE_RSP", "GetTestStateRsp");
define("GET_SESSION_STATE_REQ", "GetSessionStateReq");
define("GET_SESSION_STATE_RSP", "GetSessionStateRsp");
define("GET_TEST_INSTRUCTION_REQ", "GetTestInstructionReq");
define("GET_TEST_INSTRUCTION_RSP", "GetTestInstructionRsp");
define("JOIN_LATE_PARTICIPANT_REQ", "JoinLateParticipantReq");
define("JOIN_LATE_PARTICIPANT_RSP", "JoinLateParticipantRsp");
define("IS_BACKEND_READy_REQ", "IsBackendReadyReq");
define("IS_BACKEND_READY_RSP", "IsBackendReadyRsp");
define("GET_RESULTS_REQ", "GetResultsReq");
define("GET_RESULTS_RSP", "GetResultsRsp");


// Messages
define("GOTIO_MSG", "GotoMsg");
define("MOVE_SHAPE_MSG", "MoveShapeMsgMsg");
define("ROTATE_SHAPE_MSG", "RotateShapeMsg");
define("DRAW_MSG", "DrawMsg");
define("ERASE_MSG", "EraseMsg");
define("EDIT_DONE_MSG", "EditDoneMsg");
define("CHANGE_SCREEN_MSG", "ChangeScreenMsg");
define("ADD_IDEA_MSG", "AddIDeaMsg");
define("DEL_IDEA_MSG", "DelIdeaMsg");
define("UPDATE_IDEA_MSG", "UpdateIdeaMsg");
define("ADD_USE_MSG", "AddUseMagMsg");
define("DEL_USE_MSG", "DelUseMsg");
define("UPDATE_USE_MSG", "UpdateUseMsg");
define("START_DRAWING_MSG", "StartDrawingMsg");
define("UPDATE_TITLE_MSG", "UpdateTitleMsg");
define("UPDATE_TIME_MSG", "UpdateTimeMsg");
define("TEST_COMPLETE_MSG", "TestCompleteMsg");
define("WAIT_MSG", "WaitMsg");
define("RESUME_MSG", "ResumeMsg");
define("END_DATA_MSG", "EndDataMsg");
define("BACKEND_READY_MSG", "BackendReadyMsg");
define("DISCONNECT_Msg", "disconnect");

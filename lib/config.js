
/** 
 * Represents the config .
 * This config will hold all constants
 *
 * @class
 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 *
 */

var COUCHBASE_SERVER = 'kwantu10.kwantu.net:8000';
var COUCHBASE_BUCKET = 'kwantu_apps';
var TAXONOMY_BUCKET = 'kwantu_taxonomies';
var SYNC_SEQ = "0";

var DBNAME='kwantu_apps';
var TAXONOMY_DBNAME='kwantu_taxonomies';
var DB_IDENTIFIER = "";
var DOMAIN = 'http://kwantu9data.kwantu.net:8080'; 
var USER_AUTH = DOMAIN + '/exist/rest/db/kwantu-resource/api/authenticate1.8.xq';
var BIOMETRIC_SERVICE = DOMAIN + '/exist/rest/db/kwantu-resource/api/biometric/biometric.xql'; 
var ONLINE_VALIDATION_URL = DOMAIN + '/exist/rest/db/kwantu-resource/mobileServices/validateRule.xql';
var PROFILE_SET_ID = 'appProfile';

var INSTANCE_TYPE_NEW_INS = 'newInstance';
var INSTANCE_TYPE_NEW_SEQ = 'newSequence';

var CONFLICT_CODE = 409;
var CONFLICT_NAME = 'Document Conflict';
var CREATED_CODE = 210;
var CREATED_NAME = 'Document Created';
var UPDATED_CODE = 200;
var UPDATED_NAME = 'Document Updated';
var SERVER_ERROR_CODE = 500;
var SERVER_ERROR_NAME = 'Server Error';
var BAD_REQUEST_CODE = 400;
var BAD_REQUEST_NAME = 'Bad Request';
var PRECONDITION_FAILED_CODE = 412;
var PRECONDITION_FAILED_NAME = 'PreConditions Failed.';

var FROM_REQUEST = 'fromRequest';
var FROM_DEFINITION = 'fromDefinition';
var FROM_AUTHORISED = 'fromAuthorised';

var LOCAL_SETTINGS = {'_id':'_local/LOCAL_SETTINGS', 'SYNC_SEQ':'0', 'SESSION': {}, 'SUBSCRIPTIONS':{}, "LANG": "en" };

// var userLang = navigator.language || navigator.userLanguage; 

// if(userLang != undefined && userLang != 'undefined' && userLang != '')
// {
// 	LOCAL_SETTINGS.LANG = userLang.split("-")[0];
// }
var COMMUNITY_CONFIG = { };
var PROCESS_STATUS_NOT_STARTED = "NotStarted";
var PROCESS_STATUS_NOT_CREATED = "Created";
var PROCESS_STATUS_IN_PROGRESS = "InProgress";
var PROCESS_STATUS_IN_AWAITING = "awaitingAuthorisation";
var PROCESS_STATUS_COMPLETE = "Complete";
var PROCESS_INITIATE_USER = 'user';
var ENTRY_STATUS_NOT_STARTED = "NotStarted";
var ENTRY_STATUS_IN_PROGRESS = "InProgress";
var ENTRY_STATUS_READY_TO_SUBMIT = "Ready To Submit";
var ENTRY_STATUS_COMPLETE = "Complete";
var ENTRY_STATUS_SUBMITTED = "Submitted";
var ENTRY_STATUS_INITIALISED = "Instantiated";
var ENTRY_STATUS_DATA_INITIALISED = "DataInitialised";
var ENTRY_STATUS_PENDING = "Pending";
var ENTRY_STATUS_PENDING_RULES = "PendingRules";
var ENTRY_STATUS_UPDATED = "Updated";
var ENTRY_STATUS_AUTHORISED = "Authorised";
var ENTRY_STATUS_REJECTED = "Rejected";
var PROCESSING_STATUS_SERVER_RULES = "ProcessingServerRules"
var appConfig = {
	"content": {
		"data": {
			"community": {
				"design_docs": [
				{
					"docId": "category",
					"view": {
						"language": "javascript",
						"views": {
							"notificationCount": {
								"map": "function(doc) { if(typeof (doc.type) != 'undefined'){if(doc.type=='notification' && doc.read == false){ emit(doc.createdDateTime,  {} ); }}}"
							},
							"notification": {
								"map": "function(doc) { if(typeof (doc.type) != 'undefined'){if(doc.type=='notification'){ emit((!doc.read).toString() + doc.createdDateTime,  doc ); }}}"
							}
						}
					}
				}
				]
			}
		}
	}
};







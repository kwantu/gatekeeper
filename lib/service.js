'use strict';

/** 
 * Represents the service module. 
 *
 * @module
 * @requires PouchDB 
 * @author Brent Gordon
 * @version 1.0.0
 *
 */
 var service = (function() {
 	
	// Local functions
	return {
		getGPS: function(){
		 	var deffered = new $.Deferred();
		 	var onSuccess = function(position) {
				//			        "altitude" : position.coords.altitude,
				//					"altitudeAccuracy" : position.coords.altitudeAccuracy,
				//		        	"heading" : position.coords.heading,
			    //   			 	"speed" : position.coords.speed,
			    deffered.resolve({

			    	"latitude" :  position.coords.latitude,
			    	"longitude" : position.coords.longitude,
			    	"accuracy" : position.coords.accuracy,
			    	"Timestamp" : position.timestamp

			    });

			};
			function onError(error) {
				
				deffered.reject(error);
			}

			var positionOption = { timeout: 2000 };
			navigator.geolocation.getCurrentPosition(onSuccess, onError, positionOption);
			return deffered;
		}
	};

})();
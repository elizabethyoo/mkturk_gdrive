
//================== LIST FILES ==================//
// Asynchronous: Get file list from Google Drive directory
async function getMostRecentBehavioralFilePathsFromGDrive(num_files_to_get, subject_id, save_directory){
	var file_list = []
	try{

		var folderId = await pathToId(save_directory);
		//console.log(folderId);
		//TO DO: method for converting folder path to folder ID 

		console.log(folderId);

		response = await retrieveAllFilesInFolder(folderId);
		console.log("Success: read directory "+ save_directory);
		console.log(response);

		//TO DO 1: response needs to be sorted before file ids are extracted 
		
		var q2=0;
		for (var q = 0; q <= response.result.files.length-1; q++){
			file_list[q2] = response.result.files[q].id;
			q2++;
		}

		console.log(file_list);

		//TO DO 2: replace, see TO DO 1. 
		// [oldest,...,most recent]
		file_list.sort();


		// Return most recent files 
		num_files = file_list.length
		return file_list.slice(num_files - num_files_to_get, num_files)
		

	}
	catch (error) {
		console.error(error)
	}

}

//Return the ID of a folder given its path
function convertPathToId(path)  {

	return 0;
}

/**
 * Retrieve a list of files belonging to a folder.
 *
 * @param {String} folderId ID of the folder to retrieve files from.
 * @param {Function} callback Function to call when the request is complete.
 *
 */
function retrieveAllFilesInFolder(folderId, callback) {
  return gapi.client.drive.files.list({
        'q' : "parents in '" + folderId + "'",
    }).then(function(response) {
      	// Handle the results here (response.result has the parsed body).
      	//console.log("Response", response);
      	return response
    	}, function(error) {
      	console.error("Execute error", error);
    });
}


//================== LOAD JSON ==================//
async function loadParametersfromGDrive(paramfile_path){
	//console.log("paramfile_path is: " + paramfile_path);

	var response = await searchFileByName(paramfile_path);
	var paramfile_id = response.result.files[0].id;

	try{ 
		datastring = await loadTextFilefromGDrive(paramfile_id);
		//data = JSON.parse(datastring);

		TASK = {};
		TASK = datastring;
		console.log(TASK);
		ENV.ParamFileName = datastring.path_display; 
		ENV.ParamFileRev = datastring.rev;
		ENV.ParamFileDate = new Date(datastring.client_modified);
		return 0; //need2loadParameters
	}
	
	catch(error){
		console.error('loadParametersfromGDrive() error: ' + error);
		return 1; //need2loadParameters
	}

}


async function parseAutomatorFilefromGDrive(jsontxt_filepath){
	// From a JSON.txt of the format: 
	// [{param:val, param:val}, {param:val, param:val}]

	// Returns an array of identical format
	console.log("parseAutomatorFilefromGDrive is running");
	console.log(jsontxt_filepath); 

	var datastring = await loadTextFilefromGDrive(jsontxt_filepath)

	data = JSON.parse(datastring);
	return data

	// Not being used, but maybe if you want to iterate over individual parameters
	// e.g. to check that certain parameters are present; and to set defaults otherwise 
	// e.g. to ensure consistency between fieldnames and TRIAL.[stuff]
	automator_stage_parameters = []
	for (var i = 0; i<data.length; i++){
		automator_stage_parameters[i] = []
		for (var property in data[i]){
			if (data[i].hasOwnProperty(property)){ // Apparently necessary as explained in: http://stackoverflow.com/questions/8312459/iterate-through-object-properties
				automator_stage_parameters[i][property] = data[i][property]
			}	
		}
	}
	return automator_stage_parameters
}


//Global variable paramsData

function loadTextFilefromGDrive(textfile_path){
	//console.log("textfile_id is: " + textfile_path);
	console.log(textfile_path);

	return new Promise(function(resolve,reject){
	downloadFile(textfile_path).then(function(data){

	$.ajax({
		  crossDomain: true,
		  url: data.result.webContentLink,
		  dataType: 'jsonp',
		  cache: false
		});

		resolve(data);
		
	}).catch(function(error){
	console.error(error);
		})
	})
}

//data is a javascript object; convert to text then blobify for compatibility with FileReader 
function jsonp_callback(data) {
	console.log(data);
	console.log(typeof data);
	 var data_blob = new Blob([JSON.stringify(data)], {type : "text/plain"});
	 var reader = new FileReader();
	 reader.onload = function(e)  {
	 	//print contents of blob, check that file contents were successfully converted  
	 	var content = reader.result;
	 	//console.log(content);
	 	var data = JSON.parse(reader.result);
	 	updateStatusText(content);
		document.querySelector("p[id=headsuptext]").setAttribute("contentEditable",true);
		document.querySelector("button[name=doneEditingParams]").style.display = "block"
		document.querySelector("button[name=doneEditingParams]").style.visibility = "visible";
	 }
	reader.readAsText(data_blob);

}

//wraps data s.t. it can be saved in JSONP format 
function generate_wrapper(data) {
	return "jsonp_callback{ " + " }";
}




//Googledrive functions 
//Downloads file whose fileId is provided 
function downloadFile(fileId) {
	//console.log(fileId);
    return gapi.client.drive.files.get({
      "fileId": fileId,
      "fields": "*"
    })
  }

/*
.then(function(response) {
          // Handle the results here (response.result has the parsed body).
          console.log("Response", response);
          return response 
        }
*/

//Searches Drive by file name, returns a list of matching files  
function searchFileByName(name) {
	return gapi.client.drive.files.list({
  		"q": "name contains '" + name + "'"
})
	
    	.then(function(response) {
      	// Handle the results here (response.result has the parsed body).
      	//console.log("Response", response);
      	return response
    	}, function(error) {
      	console.error("Execute error", error);
    });
   
}

//Searches Drive by folder name, returns a list of matchigng folders  
function searchFolderByName(name) {
    return gapi.client.drive.files.list({
      "q": "mimeType = 'application/vnd.google-apps.folder' and name = '" + name + "'"
    })
        .then(function(response) {
          // Handle the results here (response.result has the parsed body)
        
          return response;
       
        }, function(error) {
          console.error("Execute error", error);
        });
  }


//Takes a folder path and returns the corresponding folder's folder ID
async function pathToId(path)  {
	var components = path.split("/");
	var folderName = components[components.length-2];
	var folderList = await searchFolderByName(folderName);
	//folderList.result.file[0].id; 

	console.log(folderList);
	
	return folderList.result.files[0].id;
}

/**
 * Retrieve a list of files belonging to a folder.
 *
 * @param {String} folderId ID of the folder to retrieve files from.
 * @param {Function} callback Function to call when the request is complete.
 *
 */
 /*
function retrieveAllFilesInFolder(folderId, callback) {
  var retrievePageOfChildren = function(request, result) {
    request.execute(function(resp) {
      result = result.concat(resp.items);
      var nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.drive.children.list({
          'folderId' : folderId,
          'pageToken': nextPageToken
        });
        retrievePageOfChildren(request, result);
      } else {
        callback(result);
      }
    });
  }
  var initialRequest = gapi.client.drive.children.list({
      'folderId' : folderId
    });
  retrievePageOfChildren(initialRequest, []);
}
*/




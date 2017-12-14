
//================== LIST FILES ==================//
// Asynchronous: Get file list from Google Drive directory
async function getMostRecentBehavioralFilePathsFromGDrive(num_files_to_get, subject_id, save_directory){
	var file_list = []
	try{

		response = await dbx.filesListFolder({path: save_directory})
		//TO DO: method for converting folder path to folder ID 

		response = await retrieveAllFilesinFolder(folderId);
		//console.log("Success: read directory "+save_directory)

		var q2=0;
		for (var q = 0; q <= response.entries.length-1; q++){
			if (response.entries[q][".tag"] == "file" && response.entries[q].name.indexOf(subject_id) != -1){
				file_list[q2] = response.entries[q].path_display
				q2++;
			}
		}

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


//================== LOAD JSON ==================//
async function loadParametersfromGDrive(paramfile_path){
	//console.log("paramfile_path is: " + paramfile_path);

	var response = await searchFileByName(paramfile_path);
	var paramfile_id = response.result.files[0].id

	try{ 
		datastring = await loadTextFilefromGDrive(paramfile_id);
		data = JSON.parse(datastring)

		TASK = {}
		TASK = data
		console.log(TASK);
		ENV.ParamFileName = datastring.path_display; 
		ENV.ParamFileRev = datastring.rev;
		ENV.ParamFileDate = new Date(datastring.client_modified);
		return 0; //need2loadParameters
	}
	
	catch(error){
		console.error('loadParametersfromGDrive() error: ' + error)
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

var paramsData = null; 

function loadTextFilefromGDrive(textfile_path){
	//console.log("textfile_id is: " + textfile_path);

	return new Promise(function(resolve,reject){
	downloadFile(textfile_path).then(function(data){

		$.ajax({
		  crossDomain: true,
		  url: data.result.webContentLink,
		  dataType: 'jsonp',
		  cache: false
		});

		resolve(0);
		
	}).catch(function(error){
	console.error(error);
		})
	})
	resolve(paramsData);	
}

//data is a javascript object; convert to text then blobify for compatibility with FileReader 
function jsonp_callback(data) {
	 var data_blob = new Blob([JSON.stringify(data)], {type : "text/plain"});
	 var reader = new FileReader();
	 reader.onload = function(e)  {
	 	//print contents of blob, check that file contents were successfully converted  
	 	var content = reader.result
	 	var data = JSON.parse(reader.result);
	 	//console.log(data);
	 	updateStatusText(content);
		document.querySelector("p[id=headsuptext]").setAttribute("contentEditable",true);
		document.querySelector("button[name=doneEditingParams]").style.display = "block"
		document.querySelector("button[name=doneEditingParams]").style.visibility = "visible";

		console.log(data);
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

//Searches Drive by file name, returns a list of matches 
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

//Searches Drive by folder path, returns a list of folders

//Returns all files in a given folder 





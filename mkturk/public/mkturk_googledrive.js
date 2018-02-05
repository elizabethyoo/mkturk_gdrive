
//================== LIST FILES ==================//
// Asynchronous: Get file list from Google Drive directory
async function getMostRecentBehavioralFilePathsFromGDrive(num_files_to_get, subject_id, save_directory){
	var file_list = []
	try{

		var folderId = await pathToId(save_directory);

		console.log(folderId);

		response = await retrieveAllFilesInFolder(folderId);
		console.log("Success: read directory "+ save_directory);
		console.log("MostRecentBehavioralFiles", response);
		
		var q2=0;
		for (var q = 0; q <= response.result.files.length-1; q++){
			file_list[q2] = response.result.files[response.result.files.length-1-q].id;
			q2++;
		}

		console.log("file_list: ", file_list);

		//TO DO 2: replace, see TO DO 1. 
		// [oldest,...,most recent]
		//file_list.sort();
		console.log("num " , num_files_to_get);

		// Return most recent files 
		num_files = file_list.length
		return file_list.slice(num_files - num_files_to_get, num_files)
		

	}
	catch (error) {
		console.error(error)
	}

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
        //search inside folder with given folderId
        'q' : "parents in '" + folderId + "'",
        //sort chronololgically (titles of history files are published dates)
        'orderBy': "name",
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
		console.log(datastring);
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
	var jsontxt_fileid = await pathToId(jsontxt_filepath);
	var data = await loadTextFilefromGDrive(jsontxt_fileid);
	return data;

	// Not being used, but maybe if you want to iterate over individual parameters
	// e.g. to check that certain parameters are present; and to set defaults otherwise 
	// e.g. to ensure consistency between fieldnames and TRIAL.[stuff]
	/*
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
	*/
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
	TASK = data;
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



//Googledrive functions 
//Downloads file whose fileId is provided 
function downloadFile(fileId) {
	//console.log(fileId);
    return gapi.client.drive.files.get({
      "fileId": fileId,
      "fields": "*"
    })
  }
//wraps data s.t. it can be saved in JSONP format 
function generate_wrapper(data) {
	return "jsonp_callback( " + " )";
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
      	var sorted = [];
      	console.log("Response", response);

      	console.log(response.result.files);

      	return response
    	}, function(error) {
      	console.error("Execute error", error);
    });
   
}

//intermediary function for nameToId
async function nameToGDriveFile(name)  {
	p = new Promise(
	function(resolve,reject)  {
		resolveFunc = resolve;
		errFunc = reject; 
	});
	
	var matches = searchFileByName(name);
	resolveFunc(matches);

	return p;
}

//Takes an array of file/folder names and returns an array of corresponding file ids 
async function nameToId(listOfNames)  {
	var idList = []; 
	for (i = 0; i < listOfNames.length; i++)  {
		var data = await gapi.client.drive.files.list({
  		"q": "name contains '" + listOfNames[i] + "'"
})
		console.log(data);
		console.log("await is done");
		//sort data by date, obtained from metadata


    	//.then(function(response) {
      	// Handle the results here (response.result has the parsed body).
      	//console.log("Response", response);
      	//return response
    	//}, function(error) {
      	//console.error("Execute error", error);
      	idList[i] = data.result.files[0].id;
    }
    //);;
		
	//}	
	return idList;
}

//Searches Drive by folder name, returns a list of matching folders  
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
	var folder = await searchFolderByName(folderName);
	//folderList.result.file[0].id; 

	console.log("folder: " , folder);
	
	return folder.result.files[0].id;
}

//================== LOAD AUDIO ==================//
function loadSoundfromGDrive(src,idx){
	return new Promise(function(resolve,reject){
		dbx.filesDownload({path: SOUND_FILEPREFIX + src + ".wav"}).then(function(data){
		var reader = new FileReader()
		reader.onload = function(e){
			audiocontext.decodeAudioData(reader.result).then(function(buffer){
				sounds.buffer[idx] = buffer;
				resolve(idx)
			})
		}
		reader.readAsArrayBuffer(data.fileBlob)
	})
	.catch(function(error){
		console.error(error)
	})
	})
}



//================== WRITE JSON ==================//
async function saveBehaviorDatatoDropbox(TASK, ENV, CANVAS, TRIAL){
	try{
        var dataobj = [] 

		dataobj.push(ENV)
		dataobj.push(CANVAS)
		dataobj.push(TASK)
		dataobj.push(TRIAL)
		datastr = JSON.stringify(dataobj); //no pretty print for now, saves space and data file is unwieldy to look at for larger numbers of trials

		// TODO: 
		// Check if folder ENV.DataFileName exists 
		// If not, create it for this subjectID using dbx.filesCreateFolder (see: http://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesCreateFolder__anchor)

		response = await dbx.filesUpload({
			path: ENV.DataFileName,
			contents: datastr,
			mode: {[".tag"]: "overwrite"} })
			CURRTRIAL.lastDropboxSave = new Date(response.client_modified)
			console.log("Successful behavior file upload. Size:" + response.size)
		}
	catch(error){
		console.error(error)
	}
}

async function saveParameterTexttoDropbox(parameter_text){
	try{
	    datastr = parameter_text

	    var success = false 
	    var i = 1; 
	    var timeout_seed =  1000; 
	    var max_retries = 10; 

	    while(!success && i < max_retries){
	    	try{
				response = await dbx.filesUpload({
					path: ENV.ParamFileName,
					contents: datastr,
					mode: {[".tag"]: "overwrite"} })
						console.log("Successful parameter text upload. Size: " + response.size)
						FLAGS.need2saveParameters = 0;
			}
			catch(error){
				console.log(error)
				console.log('Trying to write in '+(timeout_seed*i)+'ms...on try '+ i)
				sleep(timeout_seed * i)
				i++
				continue; 
			}
			success = true
		}
	}
	catch (error){
		console.error(error)
	}

	try{
		filemeta = await dbx.filesGetMetadata({path: ENV.ParamFileName})
			if (ENV.ParamFileRev != filemeta.rev){
				ENV.ParamFileRev = filemeta.rev
				ENV.ParamFileDate = new Date(filemeta.client_modified)

				console.log('Parameter file was updated. Rev=' + ENV.ParamFileRev)
			}
	}
	catch(error) {
		console.error(error)
	}
}


async function saveParameterstoDropbox() {
	
	var firstName = document.getElementById("firstName").value; 
	var lastName = document.getElementById("lastName").value;
	var fullName = firstName + " " + lastName;
	var name_dict = {"firstName": firstName, "lastName": lastName,
						"fullName": fullName};
	console.log(name_dict);
	var json_name = JSON.stringify(name_dict);
	console.log(json_name);


	var user = gapi.auth2.getAuthInstance().currentUser.get();
	console.log(user);
	var oauthToken = user.getAuthResponse(true).access_token;

	$.ajax({
		url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=media",
		type: "POST",
		data: json_name,
		beforeSend: function(xhr) {
			xhr.setRequestHeader("Authorization", "Bearer " + oauthToken);
			xhr.setRequestHeader("Content-Type", " */*");
			xhr.setRequestHeader("X-Upload-Content-Length", json_name.length);
		},
		success: function(data)  {
			console.log(data);
		},

		error: function(data) {

			console.log(data);
		}


	/*try{



		
		//file name/path 
		var savepath = ENV.ParamFileName
		//content to write 
	    var datastr = JSON.stringify(TASK,null,' ');

	    //googledrive api create file
	    //with given parameters 
		response = await dbx.filesUpload({
			path: savepath,
			contents: datastr,
			mode: {[".tag"]: "overwrite"} })
		//edit metadata 
		filemeta = await dbx.filesGetMetadata({path: savepath})
		if (ENV.ParamFileRev != filemeta.rev){
			ENV.ParamFileRev = filemeta.rev
			ENV.ParamFileDate = new Date(filemeta.client_modified)	
		}
		console.log("TASK written to disk as "+ENV.ParamFileName+". Size: " + response.size)
		return 0; //need2saveParameters
	}
	catch (error){
		console.error(error)
		return 1 //need2saveParameters
	}

	*/
}

//================== WRITE JSON (end) ==================//




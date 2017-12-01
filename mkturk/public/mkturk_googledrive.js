//================== LOAD JSON ==================//
async function loadParametersfromGDrive(paramfile_path){
	console.log("paramfile_path is: " + paramfile_path);
	
	return gapi.client.drive.files.list({
  		"q": "name contains '" + paramfile_path + "'"
	})
    	.then(function(response) {
      	// Handle the results here (response.result has the parsed body).
      	console.log("Response", response);
      	var paramfile_id = response.result.files[0].id;
      	console.log("paramfile_id is: " + paramfile_id);
      	console.log(response.result.files[0].id);


    	}, function(error) {
      	console.error("Execute error", error);
    });

    console.log(response.result.files[0].id);
	
	//var paramfile_id = searchFileByName(paramfile_path)[0]; 
	//console.log(paramfile_id);
	/*
	try{ 
		datastring = await loadTextFilefromGDrive(paramfile_path);
		console.log("datastring is: " + datastring);

		//obtain metadata of a file and parse into JSON 
		//get method description: Gets a file's metadata or content by ID.
		//filemeta = await dbx.filesGetMetadata({path: paramfile_path})
		filemeta = await downloadFile(paramfile_path);
		console.log("filemeta is: " + filemeta);
		data = JSON.parse(datastring);
		//console.log("data is: " + data);

		TASK = {}
		
		TASK = data
		
		ENV.ParamFileName = filemeta.path_display; 
		ENV.ParamFileRev = filemeta.rev
		ENV.ParamFileDate = new Date(filemeta.client_modified)
	
		
		return 0; //need2loadParameters
	}
	catch(error){
		console.error('loadParametersfromGDrive() error: ' + error)
		return 1; //need2loadParameters
	}
	*/

}

function loadTextFilefromGDrive(textfile_path){
	console.log("textfile_path is: " + textfile_path);
	//convert textfile_path to fileId
	//var textfile_id = searchFileByName(textfile_path);
	//console.log("textfile_id is: " + textfile_id);

	return new Promise(function(resolve,reject){
	downloadFile(textfile_id).then(function(data){

		var reader = new FileReader()
		reader.onload = function(e){
			var data = JSON.parse(reader.result)
			console.log("data is: " + data);
			resolve(reader.result)
		}
		reader.readAsText(data.fileBlob)
	})
.catch(function(error){
	console.error(error)
	})
	})

	
}


//Downloads file whose fileId is provided 
function downloadFile(fileId) {
	console.log(fileId);
    return gapi.client.drive.files.get({
      "fileId": fileId
    })
        .then(function(response) {
          // Handle the results here (response.result has the parsed body).
          console.log("Response", response);
        }, function(error) {
          console.error("Execute error", error);
        });
  }


//Searches Drive by file name, returns a list of matches 
function searchFileByName(name) {
	return gapi.client.drive.files.list({
  		"q": "name contains '" + name + "'"
})
    	.then(function(response) {
      	// Handle the results here (response.result has the parsed body).
      	console.log("Response", response);
    	}, function(error) {
      	console.error("Execute error", error);
    });
}






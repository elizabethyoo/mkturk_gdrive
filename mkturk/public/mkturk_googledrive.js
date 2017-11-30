//================== LOAD JSON ==================//
async function loadParametersfromGDrive(paramfile_path){
	try{ 
		datastring = await loadTextFilefromGDrive(paramfile_path);
		console.log(datastring);
		//obtain metadata of a file and parse into JSON 
		//Q: does a GET request handle both file download and metadata?
		//get method description: Gets a file's metadata or content by ID.

		//filemeta = await dbx.filesGetMetadata({path: paramfile_path})
		filemeta = await downloadFile(paramfile_path);
		//data = JSON.parse(datastring)
		data = JSON.parse(datastring);
		
		TASK = {}
		//TASK = data
		/*
		ENV.ParamFileName = filemeta.path_display; 
		ENV.ParamFileRev = filemeta.rev
		ENV.ParamFileDate = new Date(filemeta.client_modified)
		*/

		return 0; //need2loadParameters
	}
	catch(error){
		console.error('loadParametersfromGDrive() error: ' + error)
		return 1; //need2loadParameters
	}
}

function loadTextFilefromGDrive(textfile_path){
	console.log("textfile_path is: " + textfile_path);
	return new Promise(function(resolve,reject){
	downloadFile(textfile_path).then(function(data){
		//console.log("Read textfile "+textfile_path+" of size " + data.size)

		var reader = new FileReader()
		reader.onload = function(e){
			var data = JSON.parse(reader.result)
			resolve(reader.result)
		}
		reader.readAsText(data.fileBlob)
	})
.catch(function(error){
	console.error(error)
	})
	})

	return gapi.client.drive.files.list({
      "q": "name contains '" + textfile_path + "'"
    })
        .then(function(response) {
          // Handle the results here (response.result has the parsed body).
          console.log("Response", response);
          var fileId = response.result.files[0].id;
          //console.log(fileId);
        }, function(error) {
          console.error("Execute error", error);
        });
    console.log("hello");

}


//Identifies a file by file ID, downloads said file 
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
function searchFileByName() {
	return gapi.client.drive.files.list({
  		"q": "name = '" + textfile_path + "'"
})
    	.then(function(response) {
      	// Handle the results here (response.result has the parsed body).
      	console.log("Response", response);
    	}, function(error) {
      	console.error("Execute error", error);
    });
}






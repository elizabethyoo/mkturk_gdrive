//================== LOAD JSON ==================//
async function loadParametersfromGDrive(paramfile_path){
	//console.log("paramfile_path is: " + paramfile_path);

	var response = await searchFileByName(paramfile_path);
	var paramfile_id = response.result.files[0].id

	try{ 
		datastring = await loadTextFilefromGDrive(paramfile_id);
		console.log(datastring);

		//filemeta =  await downloadFile();
		//console.log(filemeta);

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




function loadTextFilefromGDrive(textfile_path){
	console.log("textfile_id is: " + textfile_path);
	
	return new Promise(function(resolve,reject){
	downloadFile(textfile_path).then(function(data){

		//console.log(data.result.webContentLink);
		$.ajax({
		  crossDomain: true,
		  url: data.result.webContentLink,
		  dataType: 'jsonp',
		  cache: false
		});

		
	})
.catch(function(error){
	console.error(error)
	})
	})	
}

function jsonp_callback(data) {
	 //console.log(data);
	 var reader = new FileReader();
	 reader.onload = alert("hello");
		reader.readAsText(data);

}


function generate_wrapper(data) {
	return "jsonp_callback{ " + " }";
}

//Downloads file whose fileId is provided 
function downloadFile(fileId) {
	console.log(fileId);
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
      	console.log("Response", response);
      	return response
    	}, function(error) {
      	console.error("Execute error", error);
    });
   
}






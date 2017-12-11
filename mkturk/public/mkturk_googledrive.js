//================== LOAD JSON ==================//
async function loadParametersfromGDrive(paramfile_path){
	//console.log("paramfile_path is: " + paramfile_path);


	var response = await searchFileByName(paramfile_path);
	var paramfile_id = response.result.files[0].id

	try{ 
		datastring = await loadTextFilefromGDrive(paramfile_id);
		console.log(datastring);

		filemeta =  await downloadFile();
		console.log(filemeta);

		data = JSON.parse(datastring)

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
	

	//Load params file from mkturk_gitlab directory 
	var xhr = new XMLHttpRequest();
	
	xhr.open("GET", "http://localhost:8000/Eliaso_params.txt");

	xhr.onload = function()  {
		var data = JSON.parse(xhr.responseText);
		console.log(data);

		TASK = {}
		TASK = data

		ENV.ParamFileName = filemeta.path_display; 
		ENV.ParamFileRev = filemeta.rev
		ENV.ParamFileDate = new Date(filemeta.client_modified)
		return 0; //need2loadParameters
	}


	
	xhr.send();



	}



function jsonp_callback(data) {
	console.log(data);
}
function loadTextFilefromGDrive(textfile_path){
	console.log("textfile_id is: " + textfile_path);
	
	return new Promise(function(resolve,reject){
	downloadFile(textfile_path).then(function(data){
		console.log(textfile_path);
		console.log(data);
		/*var reader = new FileReader()
		reader.onload = function(e){
			var data = JSON.parse(reader.result)
			
			resolve(reader.result)
		}*/
		console.log(data.result.webContentLink);
		$.ajax({
		  crossDomain: true,
		  url: data.result.webContentLink,
		  headers: {
		  	//'Access-Control-Allow-Credentials': true
			'Access-Control-Allow-Origin': '*'
			//'Access-Control-Allow-Methods': 'GET'
			//Access-Control-Allow-Headers: Authorization
		  },
		  success: function(ret_data) {
		  	console.log("Success ?");
		  	console.log(ret_data);
		  },
		  error: function(ret_data) {
		  	console.log("Failure");
		  }
		});

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






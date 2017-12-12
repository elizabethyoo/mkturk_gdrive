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
		console.log(data);

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



function loadTextFilefromGDrive(textfile_path){
	console.log("textfile_id is: " + textfile_path);

	return new Promise(function(resolve,reject){
	downloadFile(textfile_path).then(function(data){

		//console.log(data.result.webContentLink);
		$.ajax({
		  crossDomain: true,
		  url: data.result.webContentLink,
		  dataType: 'jsonp',
		  cache: false,
		  success: jsonp_callback(data)  {
		  	var data_blob = new Blob([JSON.stringify(data)], {type : "text/plain"});
		 var reader = new FileReader();
		 reader.onload = function(e)  {
		 	//print contents of blob, check that file contents were successfully converted  
		 	//console.log(reader.result);
		 	var data = JSON.parse(reader.result);
		 	return data;
			
		 }
			reader.readAsText(data_blob);
			  }
		});
	}).catch(function(error){
	console.error(error)
		})
	})	

	
}
//121717 TO DO: understand JSON methods e.g. parse and figure out how to display the contents of params file onto webapp 

//data is a javascript object; convert to text then blobify for compatibility with FileReader 
/*
function jsonp_callback(data) {
	 var data_blob = new Blob([JSON.stringify(data)], {type : "text/plain"});
	 var reader = new FileReader();
	 reader.onload = function(e)  {
	 	//print contents of blob, check that file contents were successfully converted  
	 	//console.log(reader.result);
	 	var data = JSON.parse(reader.result);
	 	return data;
		
	 }
		reader.readAsText(data_blob);
}
*/

//wraps data s.t. it can be saved in JSONP format 
function generate_wrapper(data) {
	return "jsonp_callback{ " + " }";
}




//Googledrive functions 
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







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
console.log(folderId);
  return gapi.client.drive.files.list({
        //search inside folder with given folderId
        'q' : "'" + folderId + "' in parents",
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

async function loadImageBagPathsParallel(imagebagroot_s){
	var imagepath_promises = imagebagroot_s.map(loadImageBagPaths); //create array of recursive path load Promises
	console.log("imgpath_promises", imagepath_promises);
	var funcreturn = await Promise.all(imagepath_promises);
	//Assemble images and add labels
	var bagitems_paths = [] // Can also be paths to a single .png file. 
	var bagitems_labels = [] // The labels are integers that index elements of imagebagroot_s. So, a label of '0' means the image belongs to the first imagebag.
	for (var i=0; i<=funcreturn.length-1; i++){
		bagitems_paths.push(... funcreturn[i][0])
		for (var j=0; j<= funcreturn[i][0].length-1; j++){
			bagitems_labels.push(i)
		}
	} //for i labels
	console.log(funcreturn);
	console.log(bagitems_paths);
	console.log(bagitems_labels);
	console.log("return value", [bagitems_paths, bagitems_labels])
	return [bagitems_paths, bagitems_labels] 
}


async function loadImageBagPaths(imagebagroot_s,idx) //(imagebagroot_s) 

{
	try{
		console.log("idx", idx);
		console.log("imagebagroot_s", imagebagroot_s);
		
		var bagitems_paths = [] // Can also be paths to a single .png file. 
		var bagitems_labels = [] // The labels are integers that index elements of imagebagroot_s. So, a label of '0' means the image belongs to the first imagebag.

	
		var i_itempaths = await retrieveAllFilesInFolder(imagebagroot_s)
		console.log("i_itempaths", i_itempaths);
		for (var i = 0; i < i_itempaths.result.files.length; i++) {
			console.log(i_itempaths.result.files[i].id);
			bagitems_paths.push(i_itempaths.result.files[i].id); 
			bagitems_labels.push(idx);
		}
		

		console.log("bagitems_paths", bagitems_paths);
		console.log("bagitems_labels", bagitems_labels);

		
			
		}

	catch(error){
		console.log(error)
	}

	return [bagitems_paths, bagitems_labels] 
}


async function getImageListDropboxRecursive(dirpath){
	var file_list = []


	if(dirpath.endsWith('.png')){
		return [dirpath]
	}

	try{

		var entries = []

		console.log(dirpath);
		//calling externally so could be problematic 
		response = await dbx.filesListFolder({path: dirpath, 
											  recursive: true}) 
		console.log(response);

		entries.push(... response.entries)

		// Use response.has_more to propagate 
		var num_iterations = 0
		var iteration_limit = 100
		while(response.has_more == true){
			response = await dbx.filesListFolderContinue(response.cursor)
			console.log(response);
			
			entries.push(... response.entries)

			num_iterations = num_iterations + 1 
			if(num_iterations > iteration_limit)
				{throw 'Hit iteration limit of '+iteration_limit+'. Check your imagebag directory is not insanely large.'}
		}

		
		var q2=0;
		for (var q = 0; q <= entries.length-1; q++){
			if (entries[q][".tag"] == "file" && entries[q].name.endsWith(".png")) {
				file_list.push(entries[q].path_display) //'/'+entries[q].name)
				q2++;
			}
		}
		//console.log(file_list.length+" file(s) discovered in directory \""+dirpath+"\" (and any subdirectories). ")

		datafiles.sort(function (a,b){
			if (a > b){
				return -1;
			}
			if (a < b){
				return 1;
			}
			return 0;
		}); //sort in descending order

		return file_list
	}
	catch (error) {
		console.error(error)
	}
}

//================== LOAD IMAGE ==================//
async function loadBagfromDropbox(imagebags_parameter){

	// Locate all .png in directory and subdirectories specified in imagebags_parameter
	// Return in ONE 1-dimensional array, along with label vector that indexes given imagbags_order
	try{
		var funcreturn = await loadImageBagPaths(imagebags_parameter); 
	}
	catch(error){
		console.log('Path loading failed', error)
	}
	var imagebag_paths = funcreturn[0]
	var imagebag_labels = funcreturn[1] 

	// Load all .png blobs into an array. 
	// Todo: fix array load (promises elements aren't actually fulfilled)
	try{
		var imagebag = await loadImageArrayfromGDrive(imagebag_paths)
	}
	catch(error){
		console.log('Image array load failed', error)
	}

	console.log('Done loading bag: '+imagebag.length+' out of '+imagebag_paths.length+ ' images loaded successfully.')
	return [imagebag, imagebag_labels, imagebag_paths]
}


async function loadImageArrayfromGDrive(imagepathlist){
	try{
	//GoogleDrive 
		console.log("imagepathlist", imagepathlist);
		var MAX_SIMULTANEOUS_REQUESTS = 5 // Empirically chosen based on our guess of Dropbox API's download request limit in a "short" amount of time.
		var MAX_TOTAL_REQUESTS = 3000 // Empirically chosen

		if (imagepathlist.length > MAX_TOTAL_REQUESTS) {
			throw "Under the Dropbox API, cannot load more than "+MAX_TOTAL_REQUESTS+" images at a short time period. You have requested "
			+imagepathlist.length+". Consider using an image loading strategy that reduces the request rate on Dropbox."
			return 
		}

		if (imagepathlist.length > MAX_SIMULTANEOUS_REQUESTS){
			console.log('Chunking your '+ imagepathlist.length+' image requests into '+Math.ceil(imagepathlist.length / MAX_SIMULTANEOUS_REQUESTS)+' chunks of (up to) '+MAX_SIMULTANEOUS_REQUESTS+' each. ')
			var image_array = []

			for (var i = 0; i < Math.ceil(imagepathlist.length / MAX_SIMULTANEOUS_REQUESTS); i++){
				var lb = i*MAX_SIMULTANEOUS_REQUESTS; 
				var ub = i*MAX_SIMULTANEOUS_REQUESTS + MAX_SIMULTANEOUS_REQUESTS; 
				var partial_pathlist = imagepathlist.slice(lb, ub);

				// var partial_image_requests = partial_pathlist.map(loadImagefromGDrive);
				var partial_image_requests = []
				for (var j = 0; j<partial_pathlist.length; j++){
					partial_image_requests.push(loadImagefromGDrive(partial_pathlist[j]))
				}

				var partial_image_array = await Promise.all(partial_image_requests)
				image_array.push(... partial_image_array); 
			}
			
		}
		else { // If number of images is less than MAX_SIMULTANEOUS_REQUESTS, request them all simultaneously: 
			//var image_requests = [] 
			//image_requests = imagepathlist.map(loadImagefromGDrive)
			//var image_array = await Promise.all(image_requests) 


			//for (var j = 0; j<imagepathlist.length; j++){
			//	console.log(j)
			//	image_array.push(loadImagefromGDrive(imagepathlist[j])) // test with no awaits
			//}

			var image_requests = imagepathlist.map(loadImagefromGDrive); 
			
			var image_array = await Promise.all(image_requests)
		}
		return image_array
	}
	catch(err){
		console.log(err)
	}

}


async function loadImagefromGDrive(imagepath){
	// Loads and returns a single image located at imagepath into an Image()
	// Upon failure (e.g. from Dropbox API limit), will retry up to MAX_RETRIES. 
	// Will wait between retries with linear increase in waittime between tries. 
	return new Promise(
		function(resolve, reject){
			try{
					
				downloadFile(imagepath).then( 
					function(data){
						console.log("imagepath_data", data);
						console.log("data.result.webContentLink", data.result.webContentLink);
						var data_src = data.result.webContentLink 
						//window.URL.createObjectURL(data.result.webContentLink); 	
						var image = new Image(); 

						image.onload = function(){
							console.log('Loaded: ' + (imagepath));
							updateImageLoadingAndDisplayText('Loaded: ' + imagepath)
							resolve(image)
							}
						image.src = data_src
					}
				)
				
			}
			catch(error){
				console.log(error)
				resolve(0)
			}
		}
	)
}


//================== CHECK FILE REV ==================//
// Asynchronous: Check for parmater file update
async function checkParameterFileStatus(){
	try{
		var oldRev = ENV.ParamFileRev;
		var oldDate = ENV.ParamFileDate;
		console.log("ENV.ParamFileName", ENV.ParamFileName);
		var fileId = await loadParametersfromGDrive(ENV.ParamFileName);
		console.log("fileId", fileId);

		//var filemeta = await downloadFile(fileId);
		//console.log("checkParamsStatus filemeta", filemeta);
		
		if (oldRev != ENV.ParamFileRev){
	
			FLAGS.need2loadParameters = 1

			console.log('Parameter file on disk was changed. New rev =' + ENV.ParamFileRev)
		}
		
	}
	catch(error) {
		console.error(error)
	}
}



//================== LOAD JSON ==================//
async function loadParametersfromGDrive(paramfile_path){
	console.log("paramfile_path is: " + paramfile_path);

	var response = await searchFileByName(paramfile_path);
	var paramfile_id = response.result.files[0].id;

	try{ 
		data_obj = await new_downloadFile(paramfile_id);
		metadata = data_obj.metadata.result;
		console.log("metadata", metadata);
		datastring = data_obj.data;
		//data = JSON.parse(datastring);
		console.log("datastring " , datastring);
		TASK = {};
		TASK = datastring;
		
		console.log("TASK", TASK);


		console.log("metadata.path_display", metadata.name);
		ENV.ParamFileName = metadata.name; 
		//convert dbx -> gdrive terms
		ENV.ParamFileRev = metadata.rev;
		ENV.ParamFileDate = new Date(metadata.client_modified);
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
	var jsontxt_fileid = await pathToId(jsontxt_filepath);
	data_obj = await new_downloadFile(jsontxt_fileid);
	metadata = data_obj.metadata;
	data = data_obj.data;
	console.log("parseed automator file: ", data);
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
	console.log("textfile_id is: " + textfile_path);

	console.log("loadTextFilefromGDrive fileid: " + textfile_path);

	return new Promise(function(resolve,reject){
	//jsonp_resolve = resolve;
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

//function setDisplayText

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


var jsonp_resolve;
var jsonp_metadata_object;

function new_jsonp_callback(data)  {
	jsonp_resolve({"data": data, "metadata": jsonp_metadata_object});
	jsonp_callback(data);
}

function new_downloadFile(fileId)  {
	console.log(fileId);
	return new Promise(function(resolve,reject){
		jsonp_resolve = resolve;

		gapi.client.drive.files.get({
	      	"fileId": fileId,
	      	"fields": "*"
    	}).then(function(data){
    		jsonp_metadata_object = data;
    		console.log(data.result.webContentLink);
	    	$.ajax({
				crossDomain: true,
				url: data.result.webContentLink,
				dataType: 'jsonp',
				cache: false
			});	
		}).catch(function(error){
			console.error(error);
		});
	});
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

//Lists all children of a folder 
function listChildren(folderId) {
    return gapi.client.drive.files.list({
      "q": "'" + folderId + "' in parents",
      "fields": "*"
    })
        .then(function(response) {
                // Handle the results here (response.result has the parsed body).
                console.log("Response", response);
              },
              function(err) { console.error("Execute error", err); });
}

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
		console.log("nameToId data", data);
		
		//sort data by date, obtained from metadata


    	//.then(function(response) {
      	// Handle the results here (response.result has the parsed body).
      	//console.log("Response", response);
      	//return response
    	//}, function(error) {
      	//console.error("Execute error", error);
      	idList[i] = data.result.files[0].id;
      	console.log("idList", idList);
    }
    //);;
		
	//}	
	return idList;
}

//Searches Drive by folder name, returns a list of matching folders  
function searchFolderByName(name) {
	console.log(name);
    return gapi.client.drive.files.list({
      "q": "name = '" + name + "'"
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
async function loadSoundfromGDrive(src,idx){
	var audioFileId = await nameToId(["au" + src + ".wav"]);
	return new Promise(function(resolve,reject){
		console.log("srcToId: ", audioFileId);
		downloadFile(audioFileId).then(function(data){
			console.log(data);
			resolve(data.result.webContentLink);
		})
		.catch(function(error){
			console.error(error)
		})
	
	})

}



//================== WRITE JSON ==================//
async function saveBehaviorDatatoGDrive(TASK, ENV, CANVAS, TRIAL){
	try{
        var dataobj = []; 

		dataobj.push(ENV);
		dataobj.push(CANVAS);
		dataobj.push(TASK);
		dataobj.push(TRIAL);
		datastr = JSON.stringify(dataobj); //no pretty print for now, saves space and data file is unwieldy to look at for larger numbers of trials
		directoryName = ENV.subject;
		console.log("directoryName", directoryName);
		console.log("datastr", datastr);

		saveTextFiletoGDrive("mkturk_liz", "behavior", datastr);

	}
		// TODO: 
		// Check if folder ENV.DataFileName exists 
		// If not, create it for this subjectID using dbx.filesCreateFolder (see: http://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesCreateFolder__anchor)

	// 	response = await dbx.filesUpload({
	// 		path: ENV.DataFileName,
	// 		contents: datastr,
	// 		mode: {[".tag"]: "overwrite"} })
	// 		CURRTRIAL.lastDropboxSave = new Date(response.client_modified)
	// 		console.log("Successful behavior file upload. Size:" + response.size)
	// 	}
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

//saves input text file with given content and name into a specific folder in the user's Google Drive
async function saveTextFiletoGDrive(saveDirectory, name, content, callback) {
	var folderIdList = await nameToId([saveDirectory]);
	var folderId;

	for (var i = 0; i < folderIdList.length; i++) {
		if (folderIdList[i] != null) {
			folderId = folderIdList[i];
			break;
		}
	}

	//if file doesn't already exist, create a new file 
	if (nameToId(name) == null)  {
		console.log("Text file doesn't exist. Creating new file");
		const boundary = '-------314159265358979323846';
		const delimiter = "\r\n--" + boundary + "\r\n";
		const close_delim = "\r\n--" + boundary + "--";

		var metadata = {
		    'name': name,
		    'mimeType': 'text/plain\r\n\r\n',
		    'parents': [folderId]
		};

		var multipartRequestBody = delimiter +  'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: ' + 'text/plain\r\n\r\n' + content + close_delim;

		gapi.client.request({
		    'path': '/upload/drive/v3/files',
		    'method': 'POST',
		    'params': {
		        'uploadType': 'multipart'
		    },
		    'headers': {
		        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
		    },
		    'body': multipartRequestBody
		}).then(function(response){
		    console.log(response);
		});
	}

	//otherwise, overwrite
	else {
		var fileIdList = await nameToId(name);

		for (var i = 0; i < fileIdList.length; i++) {
		if (fileIdList[i] != null) {
			fileId = fileIdList[i];
			break;
			}
		}

		console.log("Text file already exists. Overwriting contents");
	   
	    const boundary = '-------314159265358979323846';
	    const delimiter = "\r\n--" + boundary + "\r\n";
	    const close_delim = "\r\n--" + boundary + "--";

	    var contentType = "text/html";
	   	
	   	var metadata = {
		    'mimeType': 'text/plain\r\n\r\n',
		};

	   	var multipartRequestBody = delimiter +  'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: ' + 'text/plain\r\n\r\n' + content + close_delim;

	    if (!callback) { callback = function(file) { console.log("Update Complete ",file) }; }

	    gapi.client.request({
	        'path': 'https://www.googleapis.com/upload/drive/v3/files/' + fileId,
	        'method': 'PATCH',
	        'params': {
	        	'fileId': fileId, 
	        	'uploadType': 'multipart'
	        },
	        'headers': {'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
	    	},
	        'body': multipartRequestBody,
	        callback:callback,
	    });

	}
}

//================== WRITE JSON (end) ==================//




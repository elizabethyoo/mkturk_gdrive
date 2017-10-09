//return whether user was redirected here after authenticating
function isAuthenticated(){
	return !!getAccessTokenFromUrl()
}

//parse access token from url if in urls hash
function getAccessTokenFromUrl(){
	return utils.parseQueryString(window.location.hash).access_token
}

//================== LIST FILES ==================//
// Asynchronous: Get file list from dropbox directory
async function getMostRecentBehavioralFilePathsFromDropbox(num_files_to_get, subject_id, save_directory){
	var file_list = []
	try{

		// TODO: add code for reading huge folders -- (see getImageListDropboxRecursive)
		response = await dbx.filesListFolder({path: save_directory})
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

async function loadImageBagPathsParallel(imagebagroot_s){
	var imagepath_promises = imagebagroot_s.map(loadImageBagPaths); //create array of recursive path load Promises
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
	return [bagitems_paths, bagitems_labels] 
}


async function loadImageBagPaths(imagebagroot_s,idx) //(imagebagroot_s)
{
	try{
		var bagitems_paths = [] // Can also be paths to a single .png file. 
		var bagitems_labels = [] // The labels are integers that index elements of imagebagroot_s. So, a label of '0' means the image belongs to the first imagebag.

		// Case 1: input = string. output = array of .png imagenames
		if (typeof(imagebagroot_s) == "string"){
			bagitems_paths = await getImageListDropboxRecursive(imagebagroot_s)
			for(var i_item = 0; i_item < bagitems_paths.length; i_item++){
				bagitems_labels.push(0)
			}
			return [bagitems_paths, bagitems_labels]
		}

		// Case 2: input = array of (array of) paths. output = array of arrays of .png imagenames 	
		for (var i = 0; i<imagebagroot_s.length; i++){
			// If this class's imagebag consists of one (1) root. 
			if (typeof(imagebagroot_s[i]) == "string"){
				var i_itempaths = await getImageListDropboxRecursive(imagebagroot_s[i])
				bagitems_paths.push(... i_itempaths); 

				for(var i_item = 0; i_item < i_itempaths.length; i_item++){
					bagitems_labels.push(i)
				}
			}
			// If this class's imagebag consists of multiple roots.
			else if(typeof(imagebagroot_s[i]) == "object"){
				var i_itempaths = []
				for (var j = 0; j<imagebagroot_s[i].length; j++){
					i_itempaths.push(... await getImageListDropboxRecursive(imagebagroot_s[i][j])); 
				}
				bagitems_paths.push(... i_itempaths)

				for(var i_item = 0; i_item < i_itempaths.length; i_item++){
					bagitems_labels.push(i)
				}	
			}
		}
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
		response = await dbx.filesListFolder({path: dirpath, 
											  recursive: true}) 
		entries.push(... response.entries)

		// Use response.has_more to propagate 
		var num_iterations = 0
		var iteration_limit = 100
		while(response.has_more == true){
			response = await dbx.filesListFolderContinue(response.cursor)
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

//================== CHECK FILE REV ==================//
// Asynchronous: Check for parmater file update
async function checkParameterFileStatus(){
	try{
		filemeta = await dbx.filesGetMetadata({path: ENV.ParamFileName})
		if (ENV.ParamFileRev != filemeta.rev){
			ENV.ParamFileRev = filemeta.rev
			ENV.ParamFileDate = new Date(filemeta.client_modified)

			FLAGS.need2loadParameters = 1

			console.log('Parameter file on disk was changed. New rev =' + ENV.ParamFileRev)
		}
	}
	catch(error) {
		console.error(error)
	}
}

//================== LOAD JSON ==================//
async function loadParametersfromDropbox(paramfile_path){
	try{ 
		datastring = await loadTextFilefromDropbox(paramfile_path)
		filemeta = await dbx.filesGetMetadata({path: paramfile_path})
		data = JSON.parse(datastring)

		TASK = {}
		TASK = data

		ENV.ParamFileName = filemeta.path_display; 
		ENV.ParamFileRev = filemeta.rev
		ENV.ParamFileDate = new Date(filemeta.client_modified)
		return 0; //need2loadParameters
	}
	catch(error){
		console.error('loadParametersfromDropbox() error: ' + error)
		return 1; //need2loadParameters
	}
}


async function parseAutomatorFilefromDropbox(jsontxt_filepath){
	// From a JSON.txt of the format: 
	// [{param:val, param:val}, {param:val, param:val}]

	// Returns an array of identical format
	var datastring = await loadTextFilefromDropbox(jsontxt_filepath)
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


function loadTextFilefromDropbox(textfile_path){
	console.log(textfile_path);
	return new Promise(function(resolve,reject){
		dbx.filesDownload({path: textfile_path}).then(function(data){
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
}



// MDN using files from web applications -->
//   https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
// Why createObjectUrl and advantages of blob urls --> 
//   http://stackoverflow.com/questions/20950791/html5s-file-api-blob-usages

//================== LOAD AUDIO ==================//
function loadSoundfromDropbox2(src,idx){
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
		var imagebag = await loadImageArrayfromDropbox(imagebag_paths)
	}
	catch(error){
		console.log('Image array load failed', error)
	}

	console.log('Done loading bag: '+imagebag.length+' out of '+imagebag_paths.length+ ' images loaded successfully.')
	return [imagebag, imagebag_labels, imagebag_paths]
}


async function loadImageArrayfromDropbox(imagepathlist){
	try{
		var MAX_SIMULTANEOUS_REQUESTS = 500 // Empirically chosen based on our guess of Dropbox API's download request limit in a "short" amount of time.
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

				// var partial_image_requests = partial_pathlist.map(loadImagefromDropbox);
				var partial_image_requests = []
				for (var j = 0; j<partial_pathlist.length; j++){
					partial_image_requests.push(loadImagefromDropbox(partial_pathlist[j]))
				}

				var partial_image_array = await Promise.all(partial_image_requests)
				image_array.push(... partial_image_array); 
			}
			
		}
		else { // If number of images is less than MAX_SIMULTANEOUS_REQUESTS, request them all simultaneously: 
			//var image_requests = [] 
			//image_requests = imagepathlist.map(loadImagefromDropbox)
			//var image_array = await Promise.all(image_requests) 


			//for (var j = 0; j<imagepathlist.length; j++){
			//	console.log(j)
			//	image_array.push(loadImagefromDropbox(imagepathlist[j])) // test with no awaits
			//}

			var image_requests = imagepathlist.map(loadImagefromDropbox); 
			
			var image_array = await Promise.all(image_requests)
		}
		return image_array
	}
	catch(err){
		console.log(err)
	}

}


async function loadImagefromDropbox(imagepath){
	// Loads and returns a single image located at imagepath into an Image()
	// Upon failure (e.g. from Dropbox API limit), will retry up to MAX_RETRIES. 
	// Will wait between retries with linear increase in waittime between tries. 
	return new Promise(
		function(resolve, reject){
			try{
				var MAX_RETRIES = 5 
				var backoff_time_seed = 500 // ms; is multiplied by retry number. 
				var retry_number = 0; 
				//while(true && retry_number <= MAX_RETRIES){
					try{
						dbx.filesDownload({path: imagepath}).then( 
							function(data){
								var data_src = window.URL.createObjectURL(data.fileBlob); 	
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
						retry_number = retry_number + 1; 
						console.log(error)
						console.log('On retry '+retry_number)
						sleep(backoff_time_seed * retry_number)
						//continue
					}
				//}	
			}
			catch(error){
				console.log(error)
				resolve(0)
			}
		}
	)
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
	try{
		var savepath = ENV.ParamFileName
	    var datastr = JSON.stringify(TASK,null,' ');

		response = await dbx.filesUpload({
			path: savepath,
			contents: datastr,
			mode: {[".tag"]: "overwrite"} })
		
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
}


//================== WRITE JSON (end) ==================//

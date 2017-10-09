async function automateTask(automator_data, trialhistory){
	// Input: automator array; trialhistory (.trainingstage, .correct), current_automator_stage
	// Globals: trial.currentAutomatorStage (for reading); trial.stuff (for writing to)

	// Actions: if [mintrials of minpctcorrect] has been achieved, move on to the next automator stage. 
	// update trial.stuff 
	// Set flags for updating params file; reloading images (if necessary), starting new textfile, etc.


	// ---------- IF THERE ARE DISCREPANCIES, SET TRIAL.STUFF TO AUTOMATOR DATA [ CURRENT_STAGE ] ---------- 
	// Check for consistency between automator_data[current_stage] and trial.stuff: 
	// i_current_stage is the master; the ground truth for what trial.stuff should be. 

	var i_current_stage = TASK.CurrentAutomatorStage; 
	var current_stage = stageHash(TASK); 
	var automator_eventstring = []

	for (var property in automator_data[i_current_stage]){
		if (automator_data[i_current_stage].hasOwnProperty(property)){ // Apparently a necessary 'if' statement, as explained in: http://stackoverflow.com/questions/8312459/iterate-through-object-properties
			if (property === 'MinPercentCriterion' || property === 'MinTrialsCriterion' || 
				property === 'CurrentAutomatorStageName'){
				continue 
			}

			if (!(TASK[property].toString() == automator_data[i_current_stage][property].toString())){
automator_eventstring.push('WRITE NEW PARAMS: ' + 'Discrepancy between TASK.'+property+'='+TASK[property]+
' and automator_data['+i_current_stage+']['+property+']='+automator_data[i_current_stage][property])
console.log('Discrepancy between TASK.'+property+'='+TASK[property]+' and automator_data['+i_current_stage+']['+property+']='+automator_data[i_current_stage][property])
				TASK[property] = automator_data[i_current_stage][property]
				FLAGS.need2writeParameters=1
			}
		}
	}

	// ---------- CHECK IF STAGE TRANSITION CRITERIA HAS BEEN MET: -----------------------------------------
	// Read transition criteria from automator_data
	ENV.MinPercentCriterion = automator_data[i_current_stage].MinPercentCriterion;
	ENV.MinTrialsCriterion = automator_data[i_current_stage].MinTrialsCriterion; 
	ENV.CurrentAutomatorStageName = automator_data[i_current_stage].CurrentAutomatorStageName;

	// Calculate current pctcorrect and ntrials
	var funcreturn = computeRunningHistory(ENV.MinTrialsCriterion, current_stage, trialhistory.trainingstage, trialhistory.correct)
	pctcorrect = funcreturn[0]
	ntrials = funcreturn[1]

	console.log('For '+ntrials+' trials, pctcorrect='+pctcorrect)

	// ---------- CHANGE TASK.STUFF TO AUTOMATOR DATA [ NEXT_STAGE ] --------------------------------------- 
	// If transition criteria are met, 
	if(pctcorrect > ENV.MinPercentCriterion && ntrials >= ENV.MinTrialsCriterion){

		
		// If finished final stage of automator,
		if(automator_data.length <= TASK.CurrentAutomatorStage+1){
			// Stay in current stage settings, and 
			// Turn automator off
			TASK.Automator = 0; 
			TASK.CurrentAutomatorStage = -1;
			ENV.CurrentAutomatorStageName = '';
automator_eventstring.push('COMPLETED FINAL STAGE, TURNING AUTOMATOR OFF')
updateHeadsUpDisplayAutomator(ENV.CurrentAutomatorStageName,pctcorrect,ntrials,ENV.MinPercentCriterion,ENV.MinTrialsCriterion,automator_eventstring)
			console.log('With '+pctcorrect+'\% performance on n='+ntrials+', subject completed the final stage '+(i_current_stage)+' of '+(automator_data.length-1)+' (zero indexing) of automator.')
			console.log('Turning automator OFF.')
			return 
		}

		// Otherwise, advance to the next stage.
		TASK.CurrentAutomatorStage = TASK.CurrentAutomatorStage + 1; 
automator_eventstring.push(
	'SUBJECT ADVANCED TO STAGE ' + (i_current_stage+1) + ' of '+(automator_data.length-1) + 
	' with ' + pctcorrect+'\% performance on n='+ntrials)
		console.log('With '+pctcorrect+'\% performance on n='+ntrials+', subject advanced to stage '+(i_current_stage+1)+' of '+(automator_data.length-1)+' (zero indexing) of automator.')

		// Save behavior with current TASK, ENV, and TRIAL before moving on. 
		saveBehaviorDatatoDropbox(TASK, ENV, CANVAS, TRIAL); 

		// Reset tracking variables 
		purgeTrackingVariables()


		// Update TASK 
		var old_imageBagsSample = TASK.ImageBagsSample
		var old_imageBagsTest = TASK.ImageBagsTest

		for (var property in automator_data[i_current_stage+1]){
			if (property === 'MinPercentCriterion' || property === 'MinTrialsCriterion' ||
				property === 'CurrentAutomatorStageName'){
				continue 
			}

			if (automator_data[i_current_stage+1].hasOwnProperty(property)){ 
				if (!(TASK[property].toString() == automator_data[i_current_stage+1][property].toString())){
					console.log('\"'+property+'\" changed from '+TASK[property]+' to '+automator_data[i_current_stage+1][property])

					TASK[property] = automator_data[i_current_stage+1][property]
				}
			}			
		}

		// If imagebags are changed by automator, load images at beginning of next trial. 
		if(!old_imageBagsTest.equals(TASK.ImageBagsTest) || !old_imageBagsSample.equals(TASK.ImageBagsSample)){
			FLAGS.need2loadImages = 1; 
automator_eventstring.push('NEW IMAGES NEEDED for this automator stage')
		}

		FLAGS.need2saveParameters=1
	}
updateHeadsUpDisplayAutomator(ENV.CurrentAutomatorStageName,pctcorrect,ntrials,ENV.MinPercentCriterion,ENV.MinTrialsCriterion,automator_eventstring)


	return 
}


function stageHash(task){
	// Returns a value that uniquely describes the automator and stage of the automator
	var current_stage_hash_string = ''
	if (task.Automator != 0){
		current_stage_hash_string = task.AutomatorFilePath+'_stage'+task.CurrentAutomatorStage; 
	}

	else{
		current_stage_hash_string = 'automator_off'
	}

	return current_stage_hash_string

	// Todo: decide whether to count trials which have TASK that is consistent with an automator stage, as being part of that stage
}


async function readTrialHistoryFromDropbox(filepaths){
	
	var trialhistory = {}
	trialhistory.trainingstage = []
	trialhistory.starttime = []
	trialhistory.response = []
	trialhistory.correct = []

	if (typeof filepaths == "string"){
		filepaths = [filepaths]
	}

	// Sort in ascending order, such that the OLDEST file is FIRST in trialhistory 
	// trialhistory: [oldest TRIALs... most recent TRIALs]
	filepaths.sort()

	// Iterate over files and add relevant variables
	for (var i = 0; i< filepaths.length; i++){
		datastring = await loadTextFilefromDropbox(filepaths[i])
		data = JSON.parse(datastring)
		task_data = data[2]
		trial_data = data[3]

		var numTRIALs = trial_data.Response.length; 
		// Iterate over TRIALs
		for (var i_trial = 0; i_trial<numTRIALs; i_trial++){
			// Correct/incorrect TRIAL
			var correct = Number(trial_data.Response[i_trial] == trial_data.CorrectItem[i_trial])
			trialhistory.correct.push(correct)

			// Current automator stage 
			var current_stage = stageHash(task_data)
			trialhistory.trainingstage.push(current_stage)

			// Start time (fixation dot appears) of trial 
			var starttime = trial_data.StartTime[i_trial]
			trialhistory.starttime.push(starttime)
		}
	}
	console.log('Read '+trialhistory.trainingstage.length+' past trials from ', filepaths.length, ' datafiles.')
	return trialhistory
}


function computeRunningHistory(mintrials, current_stage, history_trainingstage, history_corrects){
	// todo: 
	// should trials that are performed with the automator off, but with the SAME settings as an automator stage, 
	// be counted as being part of the automator? (nope, explicit is always better. -MLee. )

	if (history_trainingstage.length!=history_corrects.length){
	 	console.log('trainingstage vec. length'+history_trainingstage.length)
	 	console.log('corrects vec. length '+history_corrects.length)
 		throw('The history arrays are of different length. Check what went wrong; cannot compute performance history.')
	}

	// returns 
	// The at most current-mintrials trial which starts a contiguous sequence to current trial with the same trainingstage/automatorfilepath as the current state,  

	// trialhistory is assumed to include all trials except the current one
	// It is arranged in [oldest, ..., current-1] order


	// Starting from the most recent trial, move backwards until you hit either 1) mintrials or 2) another automatorstage
	var startingindex = history_trainingstage.length;
	for (var i = history_trainingstage.length-1; i >= 0; i--){
		if (history_trainingstage[i] == current_stage){
			if(history_trainingstage.length - i <= mintrials){
				startingindex = i;
			}
			else if(history_trainingstage.length - i > mintrials){
				break; 
			}
			else{throw "Something went wrong"}
		}

		else if (history_trainingstage[i] != current_stage){
			break
		}
		else{
			console.log(history_trainingstage[i])
			console.log(current_stage)
			throw "Something went wrong 2"
		}
	}

	var ndiscrepancy = 0
	var ncountedtrials = 0
	for (var i = startingindex; i<history_trainingstage.length; i++){
		if (history_trainingstage[i] != current_stage){
			ndiscrepancy = ndiscrepancy+1
			console.log(history_trainingstage[i])
			console.log(current_stage)
			throw "Something went wrong 3"
		}
		ncountedtrials = ncountedtrials+1
	}

	var ntrial=0;
	var ncorrect=0;
	var pctcorrect = NaN
	if (startingindex == history_corrects.length){
		pctcorrect = 0;
		return [pctcorrect, ntrial]
	}

	for (var i=startingindex; i<history_corrects.length; i++){
		if (history_corrects[i]==1){
			ncorrect = ncorrect+1;
		}
		
		ntrial++;
	}
	pctcorrect = 100 * ncorrect/ntrial;
	return [pctcorrect, ntrial]
}
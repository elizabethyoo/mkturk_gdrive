Original mkturk code. This runs DMS task and is the working version as of 10.04.2016.

See https://dl.dropboxusercontent.com/spa/k79b8ph6lmcr30d/nightly/public/index.html

Images are grouped into folders. A task would simply choose the folder for drawing sample images and the folder (**ImageFolderSample** & **ImageFolderTest**) for drawing test images in a DMS. Here is an example parameter file:

```javascript
[{"Weight":0.39,
"Species":"marmoset",
"Homecage":1,
"Separated":1,
"Liquid":1,
"Tablet":"samsung10",
"Pump":6,
"TestedObjects":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,24],
"Nway":2,
"FixationGridIndex":11,
"FixationUsesSample":1,
"SampleGridIndex":[11],
"TestGridIndex":[7,17],
"RewardStage":1,
"RewardPer1000Trials":11,
"PunishTimeOut":1500,
"FixationDuration":10,
"FixationRadius":40,
"FixationMove":0,
"SampleON":100,
"SampleOFF":800,
"KeepSampleON":1,
"HideTestDistractors":0,
"SampleBlockSize":4,
"NStickyResponse":5,
"ConsecutiveHitsITI":8000,
"NConsecutiveHitsforBonus":2,
"NRewardMax":3,
"ImageFolderSample":0,
"ImageFolderTest":6,
"SampleScale":1.1,
"TestScale":1.1,
"Automator":0
}]
```

Here is a more thorough description of all the parameters used in mkturk_v1 that you'll see in the task file and output data file :

#MonkeyTurk Variables

**Weight** kilograms  
**Species** human, macaque, marmoset  
**Homecage** 0=in lab 1=in homecage  
**Separated** 0=with conspecific 1=conspecific separated  
**Liquid** 0=water 1=condensed milk 2=marshmallow slurry  
**Tablet** nexus9 samsung10  
**Pump** 1=adafruit peristaltic 2=submersible centrifugal tcs 3=diaphragm pump tcs 4=piezoelectric 3mL takasago 5=newer diaphragm pumps tcs 6=piezoelectric 7mL takasago  
**Objs** list of possible object choices (i.e. 0,1,2,3,4,5,6,7 for first eight objects)  
**Nway** 2,4,or 8 way typically used  
**SampleGridIndex** positions within grid locations determined by XGridCenter & YGridCenter.  Typically, use 3 x 3 grid with sample centered at position 4 and test choices on either side at positions 1 & 7  
**TestGridIndex** Position of test choices.  Is a vector of Nway positions.  Typically, on a 3x3 grid, test choices are position on either side of the sample at indices 1 & 7.  
**SampleFolder** number of the folder where sample images were drawn.  
- 0=prototype images (labels)  
- 1=var6 test images with no position variation and no backgrounds  
- 2=var6 test images with no backgrounds  
- 3=var6 test images on backgrounds  
- 4=prototypes (labels) for imagenet MURI pilot set  
- 5=imagenet MURI pilot set  
- 6=var6 train images with no position variation and no backgrounds  
- 7=var6 train images with no backgrounds  
- 8=var6 train images on backgrounds  
- 9=hvm10 prototype images (labels)  
- 10=hvm10 x 100 var6 train images on backgrounds  
- 11=hvm10 x 90 var0 (20),var3 (30),var6 (40) test images on backgrounds  
- 12=prototype images for CoCo
- 13=coco train set (80 images per label)
- 14=coco test set (40 images per label)
- 15=hybrid coco/hvm train set (40 coco/40 hvm images per label)
		
**TestFolder** same convention as SampleFolder but for test choices.  Typically, prototypes (labels,tokens) folder is used for test choices.  

**RewardStage** 0=reward for fixation (no match to sample phase of task; this setting is used when training the subject to simply touch the screen) 1=reward for selecting appropriate test image  
**RewardDuration** the actual duration the pump is on in milliseconds.  Each pump type (see Pump variable) has a calibration curve that is used to determined how long to leave it on to give a certain amount of reward  
**TimeOut** how long punish time out is.  During this time, a black square may be shown or some other cue for an incorrect trial  
**FixationDur** how long subject has to hold fixation touch (in milliseconds) to initiate a trial.  If FixationDur<0, then the program skips the fixation step and instead presents the sample image at the beginning of the trial  
**FixationRadius** radius of the fixation dot in pixels  
**FixationMove** 0=>fixation dot is presented at a fixed location >0=>position of fixation dot on grid (e.g. 3x3) is drawn randomly on each trial.  Furthermore, the fixation is redrawn every FixationMove milliseconds, so for FixationMove=2000, the dot will fixation will move every 2 seconds.  This is used in training to get the subject to touch various parts of the screen and can be used for calibrating an eyetracker  
**SampleON** number of milliseconds that a sample image is left on the screen  
**SampleOFF** number of milliseconds after sample presentation and before test presentation.  “Delay” in delayed match-to-sample task  
**KeepSampleON** 0=sample is only on for SampleON milliseconds.  Therefore, subject is doing a delayed match-to-sample task.  1=sample remains present during test screen (no delay match-to-sample).  This setting is used in training to help subjects match sample and test without having to remember the sample  
**HideTestDistractors** 0=all test choices are shown 1=only the correct test choice is shown (used in training)  
**SampleBlockSize** Number of consecutive times to present a sample from the same object (if want subject performing blocked object recognition). SampleBlockSize=0 means sample is drawn randomly from all available in Objs list.  
**NStickyResponse** Number of times subject can choose the same location on the screen before force them out of it by placing the correct answer somewhere else (i.e. if they have response bias, then on the next trial, the correct choice is drawn somewhere away from that bias)  

**ConsecutiveHitsITI** time in milliseconds between trials that subject has to maintain to accumulate rewards.  For example, if ConsecutiveHitsITI=8000, then subject has 8 seconds to complete the next trial successfully and the consecutivehits counter will be incremented. Otherwise, the number of consecutivehits will get set to 0  
**NConsecutiveHitsforBonus** how many consecutive hits subject needs for the reward amount to increase.  If NConsecutiveHitsforBonus=3, then subject will get 2x reward for correct responses on 3 consecutive trials, 3x reward for correct responses on 6 consecutive trials, up to NRewardMax times of 1x reward  
**NRewardMax** max multiplication factor allowed on reward so that if NRewardMax=3, then subject can get up to 3x reward on a trial for completing 6 consecutive trials, but would still get 3x after that (i.e. for completing 100 consecutive trials correctly, they would still get 3x)  

**Automator** automators advance subject through different task phases based on meeting a performance criterion (from touch to match to high variation match).  Automator=0 means experimenter manually changed task parameters from session to session.  

**Params** name of subject parameter file that was used (e.g. "MonkeyTurk/parameterfiles/Zico_params.txt”)  
**PreSequence PreSequenceTimes** the sequence and timing of frames (canvases) displayed during the fixation phase of the task  
**ImageSequence ImageSequenceTimes** the sequence and timing of frames (canvases) displayed during the sample/test phase of the task  
**PostSequence PostSequenceTimes** the sequence and timing of frames (canvases) displayed during the reward/punish phase of the task  

**PixelRatio** the device pixel ratio (typically PixelRatio=2 for retina displays which means 2x2 pixels of the image are mapped to 1 onscreen pixel or a 256x256 images only takes up 128x128 workspace pixels)  
**BackingStoreRatio** how the canvas backingstore was scaled  
**CanvasScale** the scale of the canvas to the workspace (typically CanvasScale=2 for retina displays)  
**WindowWidth WindowHeight** size of the screen workspace in pixels (for a retina display with a device resolution of 2560x1600, WindowWidth/WindowHeight =1255 or 800 depending on the orientation of the display)  
**XGridCenter YGridCenter** center locations in pixels of display items (fixation,sample, and test images use this coordinate system).  Will be a vector of 9 entries for a 3x3 grid  
**SampleScale TestScale** scale factor of sample (test) image so that SampleScale=2 means that sample image is drawn twice as large as its native 1:1 pixel size.  Rescaling the image means that it has to be filtered.  
**SampleImageDir** name of source folder for sample images.  Often, images are loaded in packs from imagepacks folder
**TestImageDir** names of source folder for test images  
**AllSampleSerials** image numbers of all possible samples.  If samplefolder=3 and Objs=[0:23], then there are 24 objects x 100 images/object items in AllSampleSerials  
**AllTestSerials** image numbers of all possible samples.  If testfolder=0 and Objs=[0:23], then there are 24 objects x 1 image/object items in AllTestSerials  

**FixationGridIndex** grid location of fixation dot on each trial  
**Sample** id of sample image on each trial  
**Test** ids of test (choice) images on each trial  
**Response** subjects choice on each trial  
**CorrectItem** the correct choice on each trial  
**StartTime** the starting time of each trial in microseconds  
**FixationXYT** the xy coordinates in pixels and time in microseconds of subject touching on the fixation screen  
**ResponseXYT** the xy coordinates in pixels and time in microseconds of subject touching a choice on test screen  
**BatteryLDT** whenever the battery changes level, record in BatteryLDT the current battery level remaining, the expected time to discharge, and the time update was performed  
**NReward** the number of rewards given at the end of the trial; usually 1x reward unless subject got many trials in a row correct in which case may get bonus reward according to NConsecutiveHitsforBonus  

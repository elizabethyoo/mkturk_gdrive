// For each experimenter's installation of mkturk, this contains information for dropbox keys, savepaths, stimuli
// Also used for liveplot to identify where to look for behavioral files

// ------ Dropbox WebApp settings ------ 
// // MLee Prototype
// var DBX_CLIENT_ID = "g7cp4rtcbm6xm7k"
// var DBX_REDIRECT_URI = "https://dl.dropboxusercontent.com/spa/tnra0lpcs5uvy54/personalPrototype_mkturk/public/mkturk.html"
// var DBX_CLIENT_ID = "62jec4hj1swj2ee"
// var DBX_REDIRECT_URI = "https://dl.dropboxusercontent.com/spa/tnra0lpcs5uvy54/GHprototype_mkturk/mkturk/public/mkturk.html"


// // EIssa Nightly
// var DBX_CLIENT_ID = "3rd6bco8cdmcadz"
// var DBX_REDIRECT_URI_ROOT = "https://dl.dropboxusercontent.com/spa/k79b8ph6lmcr30d/nightly/public2/"


// MKTURK
//var DBX_CLIENT_ID = "2m9hmv7q45kwren"
//var DBX_REDIRECT_URI_ROOT = "https://dl.dropboxusercontent.com/spa/k79b8ph6lmcr30d/mkturk/public/"

//Liz 
var DBX_CLIENT_ID = "7niq4ezmfinnfgy"
var DBX_REDIRECT_URI_ROOT = "https://elizabethyoo.gitlab.io/mkturk/public/"



// ------ Subject settings ------ 
var subjectlist = [
"Eliaso","Michaelo","Zico","Waffles","Solo",
"Setta","Sausage","Picasso","Pablo","Crypto","Chromeo","Castro","Bento"
];

// ------ Save location settings ------
var DATA_SAVEPATH = "/mkturk_liz/datafiles/"
var PARAM_DIRPATH = "/mkturk_liz/parameterfiles/subjects/"
var SOUND_FILEPREFIX = "/mkturk_liz/sounds/au"

// ------ Misc. -----------------------
var ndatafiles2read=5; // todo: change to trials. and use as upper bound (stop reading once you hit the first discrepancy). maybe this is effectively synonymous with mintrials
var num_preload_images=0; // how long can you/the NHP bother waiting at each imageload? 400 images ~ 30 seconds. Recommended to keep = 0 with good internet connection and automator on

// ------ todo: move into params file -

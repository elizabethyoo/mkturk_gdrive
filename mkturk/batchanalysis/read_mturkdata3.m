function read_mturkdata3
% Read monkeyturk parameters & data from dropbox and store in *.mat file
% 2015.11.26 - ei

datadir='~/Dropbox (MIT)/MonkeyTurk/';
savedir='~/Dropbox (MIT)/imglvl/mtdata/';

%% 0: Get data
datafiles=dir([datadir '*.txt']);
clear alldata

startfile=1;
filecnt=0;
try
	load([savedir 'alldata.mat']);
	for i=1:length(datafiles)
		if strcmp(alldata.filename{end},datafiles(i).name)
			startfile = i;
			filecnt = length(alldata.filename) - 1;
			break
		end
	end %for i
catch
end

for i=startfile:length(datafiles)
	clear dataobj
	if strfind(datafiles(i).name,'Castor');
		continue
	end
	if strfind(datafiles(i).name,'Test');
		continue
	end
	fid=fopen([datadir datafiles(i).name],'r');
	filecnt=filecnt+1;
	
	alldata.filename{filecnt}=datafiles(i).name;
	alldata.date_lastsaved(filecnt,:)=datevec(datafiles(i).date);
	
	%Extract date & time
	str=alldata.filename{filecnt};
	ind=findstr('-',str);
	yr=str2num(str(1:ind(1)-1));
	mo=str2num(str(ind(1)+1:ind(2)-1));
	dy=str2num(str(ind(2)+1:ind(2)+2));

	ind=findstr('T',str);
	hr=str2num(str(ind(1)+1:ind(1)+2));
	hr=hr-4;

	ind=findstr(':',str);
	mn=str2num(str(ind(1)+1:ind(1)+2));
	sc=str2num(str(ind(2)+1:ind(2)+2));
	
	alldata.date(filecnt,:)=[yr mo dy hr mn sc];
	
	cnt=0; str='';
	while ischar(str)
		str=fgetl(fid);
		LCurly=strfind(str,'{');
		RCurly=strfind(str,'}');
		if isempty(LCurly)
			continue
		end
		str=str(LCurly(1):RCurly(end));
		str=strrep(str,'""','"');
		
		cnt=cnt+1;
		dataobj(cnt)=parse_json(str);
	end %while	
	fclose(fid);
	
	%---- add subject
	if ~isfield(alldata,'subjlist')
		alldata.subjlist{1} = lower(dataobj.Subject);
		subjid=1;
	end
	
	newsubject=1;
	for q=1:length(alldata.subjlist)
		if strcmp(lower(dataobj.Subject),alldata.subjlist{q})
			newsubject=0;
			subjid=q;
		end %if
	end %for q
	
	if newsubject==1
		alldata.subjlist{end+1}=lower(dataobj.Subject);
		subjid=length(alldata.subjlist);
	end %if
	
	%----
	%Subject,Species,Homecage,Objects,SampleFolder,TestFolder,RewardStage,SampleON,SampleOFF
	alldata.subjid(filecnt) = subjid;
	alldata.subjname{filecnt}=alldata.subjlist{subjid};

	alldata.weight(filecnt) = nan;
	if isfield(dataobj,'Weight')
		alldata.weight(filecnt) = dataobj.Weight;
	end
	
	alldata.species{filecnt}='none';
	if isfield(dataobj,'Species')
		alldata.species{filecnt}=dataobj.Species;
	end
	
	alldata.homecage(filecnt) = 1;
	if isfield(dataobj,'Homecage')
		alldata.homecage(filecnt) = dataobj.Homecage;
	end
	
	alldata.separated(filecnt) = 1;
	if isfield(dataobj,'Separated')
		alldata.separated(filecnt) = dataobj.Separated;
	end
	
	alldata.liquid{filecnt} = 'none';
	if isfield(dataobj,'Liquid')
		if dataobj.Liquid == 1
			alldata.liquid{filecnt}='1_water';
		elseif dataobj.Liquid == 2
			alldata.liquid{filecnt}='2_condensed milk';
		elseif dataobj.Liquid == 3
			alldata.liquid{filecnt}='3_marshmallow slurry';
		end %if liquid type
	end
	
	alldata.tablet{filecnt} = 'none';
	if isfield(dataobj,'Tablet')
		alldata.tablet{filecnt} = dataobj.Tablet;
	end

	alldata.pump{filecnt} = 'none';
	if isfield(dataobj,'Pump')
		if dataobj.Pump == 1
			alldata.pump{filecnt}='1_peristaltic_adafruit';
		elseif dataobj.Pump == 2
			alldata.pump{filecnt}='2_submersible_centrifugal_tcs';
		elseif dataobj.Pump == 3
			alldata.pump{filecnt}='3_diaphragm1_tcs';
		elseif dataobj.Pump == 4
			alldata.pump{filecnt}='4_piezoelectric1_3mLpermin_takasago';
		elseif dataobj.Pump == 5
			alldata.pump{filecnt}='5_diaphragm2_tcs';
		elseif dataobj.Pump == 6
			alldata.pump{filecnt}='6_piezoelectric2_7mLpermin_takasago';
		end %if liquid type
	end
		
	alldata.objs{filecnt}=nan;
	if isfield(dataobj,'TestedObjects')
		for q=1:length(dataobj.TestedObjects)
			alldata.objs{filecnt}(q) = dataobj.TestedObjects{q};
		end %for q objs
	end %if
	
	%exception for first few Zico sessions
	if alldata.subjid(filecnt)==1 &...
		datenum(alldata.date(filecnt,:))>datenum([2014 12 14 0 0 0]) &...
		datenum(alldata.date(filecnt,:))<datenum([2015 2 1 0 0 0])
		alldata.objs{filecnt}=[0 1 2 3 4 5 6 7];
	end

	alldata.nway(filecnt) = 2;
	if isfield(dataobj,'Nway')
		try
			alldata.nway(filecnt) = dataobj.Nway;
		catch
			alldata.nway(filecnt) = dataobj.Nway{1};
		end
	end
	
	alldata.fixationusessample(filecnt) = 0;
	if isfield(dataobj,'FixationUsesSample')
		try
			alldata.fixationusessample(filecnt) = dataobj.FixationUsesSample;
		catch
			alldata.fixationusessample(filecnt) = dataobj.FixationUsesSample{1};
		end
	end
	
	alldata.samplegridindex(filecnt) = 4;
	if isfield(dataobj,'SampleGridIndex')
		try
			alldata.samplegridindex(filecnt) = dataobj.SampleGridIndex;
		catch
			alldata.samplegridindex(filecnt) = dataobj.SampleGridIndex{1};
		end
	end
		
	alldata.testgridindex{filecnt} = [1,7];
	if isfield(dataobj,'TestGridIndex')
		for q=1:length(dataobj.TestGridIndex)
			alldata.testgridindex{filecnt}(q) = dataobj.TestGridIndex{q};
		end %for q
	end %if

	alldata.samplefolder(filecnt) = 3;
	alldata.testfolder(filecnt) = 0;
	if isfield(dataobj,'ImageFolderSample')
		alldata.samplefolder(filecnt)=dataobj.ImageFolderSample;
		alldata.testfolder(filecnt)=dataobj.ImageFolderTest;
	else
		if isfield(dataobj,'UsePrototypeforSample')
			if (dataobj.UsePrototypeforSample == true)
				alldata.samplefolder(filecnt) = 0;
			else
				alldata.samplefolder(filecnt) = 3;
			end
		end %if UsePrototypeforSample
		if isfield(dataobj,'UsePrototypeforTest')
			if (dataobj.UsePrototypeforTest == true)
				alldata.testfolder(filecnt) = 0;
			else
				alldata.testfolder(filecnt) = 3;
			end
		end %if UsePrototypeforSample
	end %if ImageFolderSample
	
	if alldata.samplefolder(filecnt)==0
		alldata.samplefoldername{filecnt}='prototype';
	elseif alldata.samplefolder(filecnt)==1
		alldata.samplefoldername{filecnt}='var6_nopos_nobackground_testset';
	elseif alldata.samplefolder(filecnt)==2
		alldata.samplefoldername{filecnt}='var6_nobackground_testset';
	elseif alldata.samplefolder(filecnt)==3
		alldata.samplefoldername{filecnt}='var6_testset';
	elseif alldata.samplefolder(filecnt)==4
		alldata.samplefoldername{filecnt}='prototype_muri';
	elseif alldata.samplefolder(filecnt)==5
		alldata.samplefoldername{filecnt}='imagenet_muri';
	elseif alldata.samplefolder(filecnt)==6
		alldata.samplefoldername{filecnt}='var6_nopos_nobackground_trainset';
	elseif alldata.samplefolder(filecnt)==7
		alldata.samplefoldername{filecnt}='var6_nobackground_trainset';
	elseif alldata.samplefolder(filecnt)==8
		alldata.samplefoldername{filecnt}='var6_trainset';
	elseif alldata.samplefolder(filecnt)==9
		alldata.samplefoldername{filecnt}='prototype_hvm';
	elseif alldata.samplefolder(filecnt)==10
		alldata.samplefoldername{filecnt}='var6_trainset_hvm';
	elseif alldata.samplefolder(filecnt)==11
		alldata.samplefoldername{filecnt}='var0_3_6_testset_hvm';
	elseif alldata.samplefolder(filecnt)==12
		alldata.samplefoldername{filecnt}='token_coco';
	elseif alldata.samplefolder(filecnt)==13
		alldata.samplefoldername{filecnt}='trainset_coco';
	elseif alldata.samplefolder(filecnt)==14
		alldata.samplefoldername{filecnt}='testset_coco';
	elseif alldata.samplefolder(filecnt)==15
		alldata.samplefoldername{filecnt}='trainset_cocohvm';
	elseif alldata.samplefolder(filecnt)==16
		alldata.samplefoldername{filecnt}='responsebuttons_sr';
	elseif alldata.samplefolder(filecnt)==17
		alldata.samplefoldername{filecnt}='trainshapes_sr';
	elseif alldata.samplefolder(filecnt)==18
		alldata.samplefoldername{filecnt}='superformula_pos_rot';
	elseif alldata.samplefolder(filecnt)==19
		alldata.samplefoldername{filecnt}='responsebuttons_sr';
	elseif alldata.samplefolder(filecnt)==20
		alldata.samplefoldername{filecnt}='mutator_pos_rot';
	end
		
	if alldata.testfolder(filecnt)==0
		alldata.testfoldername{filecnt}='prototype';
	elseif alldata.testfolder(filecnt)==1
		alldata.testfoldername{filecnt}='var6_nopos_nobackground_testset';
	elseif alldata.testfolder(filecnt)==2
		alldata.testfoldername{filecnt}='var6_nobackground_testset';
	elseif alldata.testfolder(filecnt)==3
		alldata.testfoldername{filecnt}='var6_testset';
	elseif alldata.testfolder(filecnt)==4
		alldata.testfoldername{filecnt}='prototype_muri';
	elseif alldata.testfolder(filecnt)==5
		alldata.testfoldername{filecnt}='imagenet_muri';
	elseif alldata.testfolder(filecnt)==6
		alldata.testfoldername{filecnt}='var6_nopos_nobackground_trainset';
	elseif alldata.testfolder(filecnt)==7
		alldata.testfoldername{filecnt}='var6_nobackground_trainset';
	elseif alldata.testfolder(filecnt)==8
		alldata.testfoldername{filecnt}='var6_trainset';
	elseif alldata.testfolder(filecnt)==9
		alldata.testfoldername{filecnt}='prototype_hvm';
	elseif alldata.testfolder(filecnt)==10
		alldata.testfoldername{filecnt}='var6_trainset_hvm';
	elseif alldata.testfolder(filecnt)==11
		alldata.testfoldername{filecnt}='var0_3_6_testset_hvm';
	elseif alldata.testfolder(filecnt)==12
		alldata.testfoldername{filecnt}='token_coco';
	elseif alldata.testfolder(filecnt)==13
		alldata.testfoldername{filecnt}='trainset_coco';
	elseif alldata.testfolder(filecnt)==14
		alldata.testfoldername{filecnt}='testset_coco';
	elseif alldata.testfolder(filecnt)==15
		alldata.testfoldername{filecnt}='trainset_cocohvm';
	elseif alldata.testfolder(filecnt)==16
		alldata.testfoldername{filecnt}='responsebuttons_sr';
	elseif alldata.testfolder(filecnt)==17
		alldata.testfoldername{filecnt}='trainshapes_sr';
	elseif alldata.testfolder(filecnt)==18
		alldata.testfoldername{filecnt}='superformula_pos_rot';
	elseif alldata.testfolder(filecnt)==19
		alldata.testfoldername{filecnt}='responsebuttons_sr';
	elseif alldata.testfolder(filecnt)==20
		alldata.testfoldername{filecnt}='mutator_pos_rot';
	end
	
	if isfield(dataobj,'RewardStage')
		alldata.rewardstage(filecnt)=dataobj.RewardStage;
	else
		if ~isfield(dataobj,'Response')
			alldata.rewardstage(filecnt)=0;
		else
			alldata.rewardstage(filecnt)=1;
		end
	end
	
	alldata.rewardper1000(filecnt) = nan;
	if isfield(dataobj,'RewardPer1000Trials')
		alldata.rewardper1000(filecnt) = dataobj.RewardPer1000Trials;
	end %if rewardper1000
	
	alldata.rewardduration(filecnt) = nan;
	if isfield(dataobj,'RewardDuration')
		alldata.rewardduration(filecnt) = dataobj.RewardDuration;
	end %if rewardper1000
	
	alldata.punishtimeout(filecnt)=nan;
	if isfield(dataobj,'PunishTimeOut')
		alldata.punishtimeout(filecnt) = dataobj.PunishTimeOut;
	end

	alldata.fixationdur(filecnt)=nan;
	if isfield(dataobj,'FixationDuration')
		alldata.fixationdur(filecnt) = dataobj.FixationDuration;
	end
	
	alldata.fixationradius(filecnt)=nan;
	if isfield(dataobj,'FixationRadius')
		alldata.fixationradius(filecnt) = dataobj.FixationRadius;
	end
	
	alldata.fixationmove(filecnt)=nan;
	if isfield(dataobj,'FixationMove')
		alldata.fixationmove(filecnt) = dataobj.FixationMove;
	end
	
	alldata.sampleon(filecnt)=100;
	if isfield(dataobj,'SampleON')
		alldata.sampleon(filecnt) = dataobj.SampleON;
	end
	
	alldata.sampleoff(filecnt)=100;
	if isfield(dataobj,'SampleOFF')
		alldata.sampleoff(filecnt) = dataobj.SampleOFF;
	end
	
	alldata.keepsampleon(filecnt)=0;
	if isfield(dataobj,'KeepSampleON')
		alldata.keepsampleon(filecnt)=dataobj.KeepSampleON;
	end
		
	alldata.hidetestdistractors(filecnt)=0;
	if isfield(dataobj,'HideTestDistractors')
		alldata.hidetestdistractors(filecnt) = dataobj.HideTestDistractors;
	end
	
	alldata.sampleblocksize(filecnt)=0;
	if isfield(dataobj,'SampleBlockSize')
		alldata.sampleblocksize(filecnt) = dataobj.SampleBlockSize;
	end

	alldata.nstickyresponse(filecnt)=0;
	if isfield(dataobj,'NStickyResponse')
		alldata.nstickyresponse(filecnt) = dataobj.NStickyResponse;
	end
	
	alldata.consecutivehitsiti(filecnt)=nan;
	if isfield(dataobj,'ConsecutiveHitsITI')
		alldata.consecutivehitsiti(filecnt) = dataobj.ConsecutiveHitsITI;
	end
	
	alldata.nconsecutivehitsforbonus(filecnt)=nan;
	if isfield(dataobj,'NConsecutiveHitsforBonus')
		alldata.nconsecutivehitsforbonus(filecnt) = dataobj.NConsecutiveHitsforBonus;
	end

	alldata.nrewardmax(filecnt)=1;
	if isfield(dataobj,'NRewardMax')
		alldata.nrewardmax(filecnt) = dataobj.NRewardMax;
	end

	alldata.automator{filecnt}=0;
	if isfield(dataobj,'Automator')
		alldata.automator{filecnt} = dataobj.Automator;
	end
	
	alldata.currentautomatorstage(filecnt)=1;
	if isfield(dataobj,'CurrentAutomatorStage')
		alldata.currentautomatorstage(filecnt) = dataobj.CurrentAutomatorStage;
	end
	
	
	alldata.paramsfile{filecnt}=nan;
	if isfield(dataobj,'Params')
		alldata.paramsfile{filecnt} = dataobj.Params;
	end
	
	alldata.presequence{filecnt}=nan;
	alldata.presequence_names{filecnt}{1}=nan;
	if isfield(dataobj,'PreSequence')
		for q=1:length(dataobj.PreSequence)
			alldata.presequence{filecnt}(q) = dataobj.PreSequence{q};
			if alldata.presequence{filecnt}(q)==0
				alldata.presequence_names{filecnt}{q}='blank';
			elseif alldata.presequence{filecnt}(q)==1
				alldata.presequence_names{filecnt}{q}='sample';
			elseif alldata.presequence{filecnt}(q)==2
				alldata.presequence_names{filecnt}{q}='test';
			elseif alldata.presequence{filecnt}(q)==3
				alldata.presequence_names{filecnt}{q}='touchfix';
			elseif alldata.presequence{filecnt}(q)==4
				alldata.presequence_names{filecnt}{q}='eyefix';
			elseif alldata.presequence{filecnt}(q)==5
				alldata.presequence_names{filecnt}{q}='reward';
			elseif alldata.presequence{filecnt}(q)==6
				alldata.presequence_names{filecnt}{q}='photoreward';
			elseif alldata.presequence{filecnt}(q)==7
				alldata.presequence_names{filecnt}{q}='punish';
			end
		end
	end

	alldata.presequencetimes{filecnt}=nan;
	if isfield(dataobj,'PreSequenceTimes')
		for q=1:length(dataobj.PreSequenceTimes)
			alldata.presequencetimes{filecnt}(q) = dataobj.PreSequenceTimes{q};
		end
	end

	alldata.imagesequence{filecnt}=nan;
	alldata.imagesequence_names{filecnt}{1}=nan;
	if isfield(dataobj,'ImageSequence')
		for q=1:length(dataobj.ImageSequence)
			alldata.imagesequence{filecnt}(q) = dataobj.ImageSequence{q};
			if alldata.imagesequence{filecnt}(q)==0
				alldata.imagesequence_names{filecnt}{q}='blank';
			elseif alldata.imagesequence{filecnt}(q)==1
				alldata.imagesequence_names{filecnt}{q}='sample';
			elseif alldata.imagesequence{filecnt}(q)==2
				alldata.imagesequence_names{filecnt}{q}='test';
			elseif alldata.imagesequence{filecnt}(q)==3
				alldata.imagesequence_names{filecnt}{q}='touchfix';
			elseif alldata.imagesequence{filecnt}(q)==4
				alldata.imagesequence_names{filecnt}{q}='eyefix';
			elseif alldata.imagesequence{filecnt}(q)==5
				alldata.imagesequence_names{filecnt}{q}='reward';
			elseif alldata.imagesequence{filecnt}(q)==6
				alldata.imagesequence_names{filecnt}{q}='photoreward';
			elseif alldata.imagesequence{filecnt}(q)==7
				alldata.imagesequence_names{filecnt}{q}='punish';
			end
		end
	end

	alldata.imagesequencetimes{filecnt}=nan;
	if isfield(dataobj,'ImageSequenceTimes')
		for q=1:length(dataobj.ImageSequenceTimes)
			alldata.imagesequencetimes{filecnt}(q) = dataobj.ImageSequenceTimes{q};
		end
	end
	
	alldata.postsequence{filecnt}=nan;
	alldata.postsequence_names{filecnt}{1}=nan;
	if isfield(dataobj,'PostSequence')
		for q=1:length(dataobj.PostSequence)
			alldata.postsequence{filecnt}(q) = dataobj.PostSequence{q};
			
			if alldata.postsequence{filecnt}(q)==0
				alldata.postsequence_names{filecnt}{q}='blank';
			elseif alldata.postsequence{filecnt}(q)==1
				alldata.postsequence_names{filecnt}{q}='sample';
			elseif alldata.postsequence{filecnt}(q)==2
				alldata.postsequence_names{filecnt}{q}='test';
			elseif alldata.postsequence{filecnt}(q)==3
				alldata.postsequence_names{filecnt}{q}='touchfix';
			elseif alldata.postsequence{filecnt}(q)==4
				alldata.postsequence_names{filecnt}{q}='eyefix';
			elseif alldata.postsequence{filecnt}(q)==5
				alldata.postsequence_names{filecnt}{q}='reward';
			elseif alldata.postsequence{filecnt}(q)==6
				alldata.postsequence_names{filecnt}{q}='photoreward';
			elseif alldata.postsequence{filecnt}(q)==7
				alldata.postsequence_names{filecnt}{q}='punish';
			end
		end %for postsequence
	end

	alldata.postsequencetimes{filecnt}=nan;
	if isfield(dataobj,'PostSequenceTimes')
		for q=1:length(dataobj.PostSequenceTimes)
			alldata.postsequencetimes{filecnt}(q) = dataobj.PostSequenceTimes{q};
		end
	end
	
	
	alldata.pixelratio(filecnt)=nan;
	if isfield(dataobj,'PixelRatio')
		alldata.pixelratio(filecnt) = dataobj.PixelRatio;
	end
	
	alldata.backingstoreratio(filecnt)=nan;
	if isfield(dataobj,'BackingStoreRatio')
		alldata.backingstoreratio(filecnt) = dataobj.BackingStoreRatio;
	end
	
	alldata.canvasscale(filecnt)=nan;
	if isfield(dataobj,'CanvasScale')
		alldata.canvasscale(filecnt) = dataobj.CanvasScale;
	end
	
	% ----Presequence
	% ----Presequencetimes
	% ----Imagesequence
	% ----Imagesequencetimes
	% ----Postsequence
	% ----Postsequencetimes
	% ----PixelRatio
	% ----BackingStoreRatio
	% ----CanvasScale
	
	alldata.windowwidth(filecnt)=nan;
	if isfield(dataobj,'WindowWidth')
		alldata.windowwidth(filecnt) = dataobj.WindowWidth;
	end
	
	alldata.windowheight(filecnt)=nan;
	if isfield(dataobj,'WindowHeight')
		alldata.windowheight(filecnt) = dataobj.WindowHeight;
	end
	
	alldata.objectgridindex{filecnt}=[];
	if isfield(dataobj,'ObjectGridIndex')
		for q=1:length(dataobj.ObjectGridIndex)
			alldata.objectgridindex{filecnt}(q) = dataobj.ObjectGridIndex{q};
		end %for q
	end
	
	
	alldata.xgridcenter{filecnt}=nan;
	if isfield(dataobj,'XGridCenter')
		for q=1:length(dataobj.XGridCenter)
			alldata.xgridcenter{filecnt}(q) = dataobj.XGridCenter{q};
		end
	end
	
	alldata.ygridcenter{filecnt}=nan;
	if isfield(dataobj,'YGridCenter')
		for q=1:length(dataobj.YGridCenter)
			alldata.ygridcenter{filecnt}(q) = dataobj.YGridCenter{q};
		end
	end
	
	alldata.headsupfraction(filecnt)=0;
	if isfield(dataobj,'HeadsUpFraction')
		alldata.headsupfraction(filecnt)=dataobj.HeadsUpFraction;
	else %prior to 2015.12.16
		if strcmp(alldata.species{filecnt},'marmoset')
			alldata.headsupfraction(filecnt)=0.2733333333333333;
		end
	end

	
	alldata.canvasoffsetleft(filecnt)=0;
	if isfield(dataobj,'CanvasOffsetLeft')
		alldata.canvasoffsetleft(filecnt)=dataobj.CanvasOffsetLeft;
	else %prior to 2015.12.16
		if strcmp(alldata.species{filecnt},'marmoset')
			alldata.canvasoffsetleft(filecnt)=0;
		end
	end
	
	alldata.canvasoffsettop(filecnt)=0;
	if isfield(dataobj,'CanvasOffsetTop')
		alldata.canvasoffsettop(filecnt)=dataobj.CanvasOffsetTop;
	else %prior to 2015.12.16
		if strcmp(alldata.species{filecnt},'marmoset')
			alldata.canvasoffsettop(filecnt)=343;
		end
	end

	alldata.samplepixels(filecnt,1:2)=[256 256];
	if isfield(dataobj,'SamplePixels')
		for q=1:length(dataobj.SamplePixels)
			alldata.samplepixels(filecnt,q) = dataobj.SamplePixels{q};
		end
	end

	alldata.testpixels(filecnt,1:2)=[256 256];
	if isfield(dataobj,'TestPixels')
		for q=1:length(dataobj.TestPixels)
			alldata.testpixels(filecnt,q) = dataobj.TestPixels{q};
		end
	end	
	
	alldata.samplescale(filecnt)=nan;
	if isfield(dataobj,'SampleScale')
		alldata.samplescale(filecnt) = dataobj.SampleScale;
	end

	alldata.testscale(filecnt)=nan;
	if isfield(dataobj,'TestScale')
		alldata.testscale(filecnt) = dataobj.TestScale;
	end

	alldata.sampleimagedir{filecnt}=nan;
	if isfield(dataobj,'SampleImageDir')
		alldata.sampleimagedir{filecnt} = dataobj.SampleImageDir;
	end

	alldata.testimagedir{filecnt}=nan;
	if isfield(dataobj,'TestImageDir')
		alldata.testimagedir{filecnt} = dataobj.TestImageDir;
	end
	
	alldata.allsampleserials{filecnt}=nan;
	if isfield(dataobj,'AllSampleSerials')
		alldata.allsampleserials{filecnt} = dataobj.AllSampleSerials;
	end
	
	alldata.alltestserials{filecnt}=nan;
	if isfield(dataobj,'AllTestSerials')
		alldata.alltestserials{filecnt} = dataobj.AllTestSerials;
	end
	
	% ----WindowWidth
	% ----WindowHeight
	% ----XGridCenter
	% ----YGridCenter
	% ----SampleScale
	% ----TestScale
	% ----SampleImageDir
	% ----TestImageDir
	% ----AllSampleSerials
	% ----AllTestSerials
	
	
	% ----FixationGridIndex
	% ----Sample
	% ----Test
	% ----Response
	% ----CorrectItem
	
	% ----StartTime
	% ----FixationXYT
	% ----ResponseXYT
	
	if length(dataobj.StartTime)<=1
		ntrials=length(dataobj.Sample); %if starttime not recorded use sample
		starttime_not_recorded=1;
	else
		ntrials=length(dataobj.StartTime);
		starttime_not_recorded=0;
	end
	
	for q=1:ntrials
		
		alldata.fixationgridindex{filecnt}(q,1)=nan;
		if isfield(dataobj,'FixationGridIndex')
			alldata.fixationgridindex{filecnt}(q,1)=dataobj.FixationGridIndex{q};
		end
		
		alldata.sample{filecnt}(q,1)=nan;
		if isfield(dataobj,'Sample')
			alldata.sample{filecnt}(q,1)=dataobj.Sample{q};
			if isfield(dataobj,'UsePrototypeforSample') && (dataobj.UsePrototypeforSample == true)
				alldata.sample{filecnt}(q,1)=floor(dataobj.Sample{q}/100);
			end
		end %if
		
		alldata.test{filecnt}(q,1)=nan;
		if isfield(dataobj,'Test')
			for q2=1:length(dataobj.Test{q})
				alldata.test{filecnt}(q,q2)=dataobj.Test{q}{q2};
				if isfield(dataobj,'UsePrototypeforTest') && (dataobj.UsePrototypeforTest == true)
					alldata.test{filecnt}(q,q2)=floor(dataobj.Test{q}{q2}/100);
				elseif datenum(alldata.date(filecnt,:))>datenum([2014 12 11 0 0 0]) &...
						datenum(alldata.date(filecnt,:))<datenum([2015 2 1 0 0 0]) %exception for early Zico data
					alldata.test{filecnt}(q,q2)=floor(dataobj.Test{q}{q2}/100);
				end
			end %for q2
		end %if
		
		alldata.response{filecnt}(q,1)=nan;
		if isfield(dataobj,'Response') && alldata.rewardstage(filecnt)==1
			alldata.response{filecnt}(q,1)=dataobj.Response{q};
		end
		
		alldata.correctitem{filecnt}(q,1)=nan;
		if isfield(dataobj,'CorrectItem')
			alldata.correctitem{filecnt}(q,1)=dataobj.CorrectItem{q};
		end

		if starttime_not_recorded
			%use fixation for trial start
			alldata.tstart{filecnt}(q,1)=dataobj.FixationXYT{q}{3};
		else
			alldata.tstart{filecnt}(q,1)=dataobj.StartTime{q};
		end
		
		if isfield(dataobj,'FixationTime')
			alldata.fixationxyt{filecnt}(q,1:3)=[nan nan dataobj.FixationTime{q}];
		else
			try
				alldata.fixationxyt{filecnt}(q,1:3)=[dataobj.FixationXYT{q}{1} dataobj.FixationXYT{q}{2} dataobj.FixationXYT{q}{3}];
			catch
				alldata.fixationxyt{filecnt}(q,1:3)=[nan nan nan];
			end
		end

		if isfield(dataobj,'ResponseTime') && alldata.rewardstage(filecnt)==1
			alldata.responsexyt{filecnt}(q,1:3)=[nan nan dataobj.ResponseTime{q}];
		else
			try
				alldata.responsexyt{filecnt}(q,1:3)=[dataobj.ResponseXYT{q}{1} dataobj.ResponseXYT{q}{2} dataobj.ResponseXYT{q}{3}];
			catch
				alldata.responsexyt{filecnt}(q,1:3)=[nan nan nan];
			end
		end %if
		
		%prior to 2015.12.16 - compensate for headsup display in marmoset
		%data
		if strcmp(alldata.species{filecnt},'marmoset') & datenum(alldata.date(filecnt,:))<datenum([2015 12 16 0 0 0])
			if alldata.fixationxyt{filecnt}(q,1)>=0
				alldata.fixationxyt{filecnt}(q,1)=alldata.fixationxyt{filecnt}(q,1)-alldata.canvasoffsetleft(filecnt);
			end
			if alldata.fixationxyt{filecnt}(q,2)>=0
				alldata.fixationxyt{filecnt}(q,2)=alldata.fixationxyt{filecnt}(q,2)-alldata.canvasoffsettop(filecnt);
			end
			if alldata.responsexyt{filecnt}(q,1)>=0
				alldata.responsexyt{filecnt}(q,1)=alldata.responsexyt{filecnt}(q,1)-alldata.canvasoffsetleft(filecnt);
			end
			if alldata.responsexyt{filecnt}(q,2)>=0
				alldata.responsexyt{filecnt}(q,2)=alldata.responsexyt{filecnt}(q,2)-alldata.canvasoffsettop(filecnt);
			end
		end %if need to compensate xy of marmoset touches prior to 2015.12.16
		
		% BatteryLDT
		% NReward
				
		alldata.nreward{filecnt}(q,1)=nan;
		if isfield(dataobj,'NReward')
			alldata.nreward{filecnt}(q,1)=dataobj.NReward{q};
		end		
	end %for q trials
	
	if isfield(dataobj,'BatteryLDT')
		for q=1:length(dataobj.BatteryLDT)
			try
				alldata.battery{filecnt}(q,1)=dataobj.BatteryLDT{q}{1};
			catch
				alldata.battery{filecnt}(q,1)=nan;
			end
			try
				alldata.battery{filecnt}(q,2)=dataobj.BatteryLDT{q}{2};
			catch
				alldata.battery{filecnt}(q,2)=nan;
			end
			try
				alldata.battery{filecnt}(q,3)=dataobj.BatteryLDT{q}{3};
			catch
				alldata.battery{filecnt}(q,3)=nan;
			end
		end %for q battery updates
	else
		alldata.battery{filecnt}(1,1:3)=nan;
	end %if batteryldt
		
	disp(['Completed ' num2str(filecnt) ' of ' num2str(length(datafiles)) '  (' datafiles(i).name ')']);
	save([savedir 'alldata.mat'],'alldata');
end %for i files

%% 1: Package data
NTRIAL_PER_FILE = 100000;

load([savedir 'alldata.mat']);

%---- Determine number of cumulative trials across raw data files
clear ntrialtotal
ntrialtotal=[0,0,0,0,0,0];
for f=1:length(alldata.filename)-1
	% 1=trial# 2=subject# 3=file# 4=start_trial 5=end_trial 6=filetrials 
	ntrialtotal=[ntrialtotal; 
		ntrialtotal(end,1)+length(alldata.tstart{f}),alldata.subjid(f),f,1,length(alldata.tstart{f})*ones(1,2)];
end %for f files
ntrialtotal(1,:)=[];

%---- Divide raw data trials which are organized by file
%---- into mturkdata files organized by trials
nmtdatafiles=ceil(ntrialtotal(end,1)/NTRIAL_PER_FILE);
for i=1:nmtdatafiles
	ind1=find(ntrialtotal(:,1)<=(i-1)*NTRIAL_PER_FILE);
	if isempty(ind1)
		ind1=0;
	end
	ind2=find(ntrialtotal(:,1)>=i*NTRIAL_PER_FILE);
	if isempty(ind2)
		continue
	end
	ntrials=sum(ntrialtotal((ind1(end)+1):ind2(1),6));
	nshave=ntrials - NTRIAL_PER_FILE;
	trials1=ntrialtotal(ind2(1),6)-nshave;
	
	ntrialtotal = [ ntrialtotal(1:ind2(1)-1,1:6);
					[ntrialtotal(ind2(1),1)-nshave ntrialtotal(ind2(1),2:3) 1 trials1 trials1];
					[ntrialtotal(ind2(1),1:3) trials1+1 ntrialtotal(ind2(1),5) nshave];
					ntrialtotal(ind2(1)+1:end,1:6)];
end %for i mtdata files


%---- Find most recent mtdatafile
mtdatafiles=dir([savedir 'mtdata*.mat']);
last_processedfile=0;
for q=1:length(mtdatafiles)
	load([savedir mtdatafiles(q).name]);
	last_processedfile(q)=mtdata(1).lastfile;
end %for q
last_processedfile=max(last_processedfile);

ns=zeros(1,length(alldata.subjlist));
for n=1:ntrialtotal(end,1)
	ind=find(ntrialtotal(:,1)>=n);
	s=ntrialtotal(ind(1),2);
	f=ntrialtotal(ind(1),3);

	% if already processed, continue
	if f < last_processedfile
		continue
	end

	mtdatafilenum=ceil(n/NTRIAL_PER_FILE);
	
	% trial# within file
	ftrials=ntrialtotal(ind(1),1)+1-fliplr([1:ntrialtotal(ind(1),6)]);
	nf = find(ftrials == n);
	nf = nf-1 + ntrialtotal(ind(1),4);
			
	% if starting a new mtdatafile, then preallocate
	if NTRIAL_PER_FILE*round(n/NTRIAL_PER_FILE) + 1 == n
		nstart=(mtdatafilenum-1)*NTRIAL_PER_FILE;
		nstop=(mtdatafilenum)*NTRIAL_PER_FILE;
		indfile=find(ntrialtotal(:,1) > nstart & ntrialtotal(:,1)<=nstop);
		
		clear subjtrialtotal
		subjtrialtotal=zeros(1,length(alldata.subjlist));
		for s2=1:length(alldata.subjlist)
			indfilesubj=find(ntrialtotal(indfile,2)==s2);
			subjtrialtotal(s2)=sum(ntrialtotal(indfile(indfilesubj),6));
			ns(s2)=0; % reset trial count for each subject
		end %for s
		mtdata=preallocate(subjtrialtotal);
		disp(['Preallocated for mtdata' num2str(mtdatafilenum)]);
	% if starting last processed file, load mtdata up to this point, and
	% preallocate
	elseif f == last_processedfile & nf==ntrialtotal(ind(1),4)
		load([savedir 'mtdata' num2str(mtdatafilenum) '.mat']);
		disp(['Loaded last mtdata file: ' ...
			  savedir 'mtdata' num2str(mtdatafilenum) '.mat']);
		
		for s2=1:length(alldata.subjlist)
			ind=find(mtdata(s2).filetrial(:,1)>0 & mtdata(s2).filetrial(:,1)<f);
			if isempty(ind)
				ns(s2)=0;
			else
				ns(s2)=mtdata(s2).filetrial(ind(end),3); %trial within subject
			end
		end
		
		nstart=(mtdatafilenum-1)*NTRIAL_PER_FILE;
		nstop=(mtdatafilenum)*NTRIAL_PER_FILE;
		indfile=find(ntrialtotal(:,1) > nstart & ntrialtotal(:,1)<=nstop);
		
		clear subjtrialtotal
		subjtrialtotal=zeros(1,length(alldata.subjlist));
		for s2=1:length(alldata.subjlist)
			indfilesubj=find(ntrialtotal(indfile,2)==s2);
			subjtrialtotal(s2)=sum(ntrialtotal(indfile(indfilesubj),6));		
		end %for s
		mtdata=allocate_by_appending(mtdata,subjtrialtotal);		
	end %if loading existing mtdatafile
	
	ns(s)=ns(s)+1;

	mtdata(1).lastfile=f;
	mtdata(s).filename{ns(s)}=alldata.filename{f};
	mtdata(s).datecreated(ns(s),1:6)=alldata.date(f,:);
	mtdata(s).datesaved(ns(s),1:6)=alldata.date_lastsaved(f,:);

	%reference trial date/time to end of file
	tstart = alldata.tstart{f};
	mtdata(s).datetrial(ns(s),:) = datevec(datetime(alldata.date_lastsaved(f,:)) -...
		seconds((max(tstart)-alldata.tstart{f}(nf))/1000));
	
	mtdata(s).day(ns(s))=ceil(etime(alldata.date(f,:),[2012 1 1 0 0 0])/(24*3600)); %day of trial
	mtdata(s).filetrial(ns(s),1:4)=[f,nf,ns(s),n]; %1=file 2=trial within file 3=trial within subject 4=trial within dataset
	
	%---- task params: nobj, nway, rewardstage, keepsampleon,
	%hidetestdistractors, reward, punish
	mtdata(s).nobj(ns(s))=length(alldata.objs{f});
	mtdata(s).nway(ns(s))=alldata.nway(f);
	mtdata(s).fixationusessample(ns(s))=alldata.fixationusessample(f);
	mtdata(s).rewardstage(ns(s))=alldata.rewardstage(f);
	mtdata(s).keepsampleon(ns(s))=alldata.keepsampleon(f);
	mtdata(s).hidetestdistractors(ns(s))=alldata.hidetestdistractors(f);
	mtdata(s).rewardper1000(ns(s))=alldata.rewardper1000(f);
	mtdata(s).punishtimeout(ns(s))=alldata.punishtimeout(f);
	
	%---- sample images: samplefolder sample sample_label sampleON sampleOFF
	mtdata(s).samplefolder(ns(s))=alldata.samplefolder(f);
	mtdata(s).sample(ns(s))=alldata.sample{f}(nf);
	if mtdata(s).samplefolder(ns(s))==0 || mtdata(s).samplefolder(ns(s))==9 ||...
			mtdata(s).samplefolder(ns(s))==12 || mtdata(s).samplefolder(ns(s))==16 ||...
			mtdata(s).samplefolder(ns(s))==17 || mtdata(s).samplefolder(ns(s))==19
		mtdata(s).samplelabel(ns(s))=mtdata(s).sample(ns(s));
	elseif mtdata(s).samplefolder(ns(s))==1 ||...
			mtdata(s).samplefolder(ns(s))==2 ||...
			mtdata(s).samplefolder(ns(s))==3 ||...
			mtdata(s).samplefolder(ns(s))==6 ||...
			mtdata(s).samplefolder(ns(s))==7 ||...
			mtdata(s).samplefolder(ns(s))==8 ||...
			mtdata(s).samplefolder(ns(s))==10 ||...
			mtdata(s).samplefolder(ns(s))==11 ||...
			mtdata(s).samplefolder(ns(s))==13 ||...
			mtdata(s).samplefolder(ns(s))==14 ||...
			mtdata(s).samplefolder(ns(s))==15 ||...
			mtdata(s).samplefolder(ns(s))==18 ||...
			mtdata(s).samplefolder(ns(s))==20
        mtdata(s).samplelabel(ns(s))=floor(mtdata(s).sample(ns(s))/100);
	else
		mtdata(s).samplelabel(ns(s))=nan;
	end
	
	mtdata(s).sampleon(ns(s))=alldata.sampleon(f);
	mtdata(s).sampleoff(ns(s))=alldata.sampleoff(f);
	
	%---- test images: testfolder test test_label
	mtdata(s).testfolder(ns(s))=alldata.testfolder(f);
	mtdata(s).test(ns(s),1:mtdata(s).nway(ns(s)))=alldata.test{f}(nf,:);
	for q=1:mtdata(s).nway(ns(s))
		if mtdata(s).testfolder(ns(s))==0 || mtdata(s).testfolder(ns(s))==9 ||...
				mtdata(s).testfolder(ns(s))==12 || mtdata(s).testfolder(ns(s))==16 ||...
			mtdata(s).testfolder(ns(s))==17 || mtdata(s).testfolder(ns(s))==19
			mtdata(s).testlabel(ns(s),q)=mtdata(s).test(ns(s),q);
		elseif mtdata(s).testfolder(ns(s))==1 ||...
				mtdata(s).testfolder(ns(s))==2 ||...
				mtdata(s).testfolder(ns(s))==3 ||...
				mtdata(s).testfolder(ns(s))==6 ||...
				mtdata(s).testfolder(ns(s))==7 ||...
				mtdata(s).testfolder(ns(s))==8 ||...
				mtdata(s).testfolder(ns(s))==10 ||...
				mtdata(s).testfolder(ns(s))==11 ||...
				mtdata(s).testfolder(ns(s))==13 ||...
				mtdata(s).testfolder(ns(s))==14 ||...
				mtdata(s).testfolder(ns(s))==15 ||...
				mtdata(s).testfolder(ns(s))==18 ||...
				mtdata(s).testfolder(ns(s))==20
			mtdata(s).testlabel(ns(s),q)=floor(mtdata(s).test(ns(s),q)/100);
	else
			mtdata(s).testlabel(ns(s),q)=nan;
		end %if
	end %for q test choices
	
	%---- choice: correctitem, response, correct
	mtdata(s).correctitem(ns(s))=alldata.correctitem{f}(nf);
	mtdata(s).response(ns(s))=alldata.response{f}(nf);
	mtdata(s).correct(ns(s))=(mtdata(s).correctitem(ns(s))==mtdata(s).response(ns(s)));
	
	%---- Time & locations of objects & touches on screen in milliseconds & inches:
	%---- xytwfix xytwsample xytwtest xydtfix xydtresponse
	pix2inch=0.90/128;
	ww=alldata.windowwidth(f);
	wh=alldata.windowheight(f);
	mtdata(s).windowsize(ns(s),1:2)=[ww wh];
	if isnan(wh)
		wh=0; %for subtracting
	end
	
	% fixation location
	g=alldata.fixationgridindex{f}(nf);
	if isnan(g(1)) || g<0
		g=1;
	else
		g=g+1; %go to 1-indexed
	end
	d=2*alldata.fixationradius(f);
	
	mtdata(s).fixationxy(ns(s),1:2)=[alldata.xgridcenter{f}(g) wh-alldata.ygridcenter{f}(g)]*pix2inch;
	mtdata(s).fixationwd(ns(s))=d*pix2inch;
	
	% fixation onset time
	mtdata(s).fixationt(ns(s))=alldata.tstart{f}(nf);
	
	% subject fixation time & location
	mtdata(s).fixationtouchdt(ns(s))=alldata.fixationxyt{f}(nf,3) - mtdata(s).fixationt(ns(s));
	mtdata(s).fixationtouchxy(ns(s),1:2)=...
		([alldata.fixationxyt{f}(nf,1) wh-alldata.fixationxyt{f}(nf,2)])*pix2inch;
	
	% sample location
	g=alldata.samplegridindex(f);
	if isnan(g(1)) || length(alldata.xgridcenter{f})==1
		g=1;
	else
		g=g+1; %go to 1-indexed
	end
	mtdata(s).samplexy(ns(s),1:2)=[alldata.xgridcenter{f}(g) wh-alldata.ygridcenter{f}(g)]*pix2inch;
	mtdata(s).samplewd(ns(s))=alldata.samplescale(f)*(alldata.samplepixels(f,1)/alldata.pixelratio(f))*pix2inch;
	
	% sample onset time
	sampleframe=find(alldata.imagesequence{f}==1);
	mtdata(s).sampledt(ns(s))=mtdata(s).fixationtouchdt(ns(s)) + sum(alldata.imagesequencetimes{f}(1:sampleframe-1));
	
	%--------- test location (if not SR task) ------------%
	if isempty(alldata.objectgridindex{f}) ||...
			length(alldata.objectgridindex{f}) ~= length(alldata.objs{f})
		g=alldata.testgridindex{f};
		if isnan(g(1)) || length(alldata.xgridcenter{f})==1
			g=1;
		else
			g=g+1; %go to 1-indexed
		end
		for q=1:length(g)
			mtdata(s).testxy(ns(s),(2*q-1):2*q)=[alldata.xgridcenter{f}(g(q)) wh-alldata.ygridcenter{f}(g(q))]*pix2inch;
		end
		mtdata(s).testwd(ns(s))=alldata.testscale(f)*(alldata.testpixels(f,1)/alldata.pixelratio(f))*pix2inch;
		
		%--------- test location (if SR task) ------------%
	elseif length(alldata.objectgridindex{f}) == length(alldata.objs{f})
		go=alldata.objectgridindex{f};
		if isnan(go(1)) || length(alldata.xgridcenter{f})==1
			go=1;
		else
			go=go+1; %go to 1-indexed
		end		
		for q=1:length(mtdata(s).nway(ns(s)))
			currentlabel = mtdata(s).testlabel(ns(s),q);
			ind = find(alldata.objs{f}==currentlabel);
			mtdata(s).testxy(ns(s),(2*q-1):2*q)=[alldata.xgridcenter{f}(go(ind)) wh-alldata.ygridcenter{f}(go(ind))]*pix2inch;
		end
		mtdata(s).testwd(ns(s))=alldata.testscale(f)*(alldata.testpixels(f,1)/alldata.pixelratio(f))*pix2inch;
	end
	
	
	% test onset time
	testframe=find(alldata.imagesequence{f}==2);
	mtdata(s).testdt(ns(s))=mtdata(s).fixationtouchdt(ns(s)) + sum(alldata.imagesequencetimes{f}(1:testframe-1));
	
	% subject response time & location
	mtdata(s).responsetouchdt(ns(s))=alldata.responsexyt{f}(nf,3) - mtdata(s).fixationt(ns(s));
	mtdata(s).responsetouchxy(ns(s),1:2)=([alldata.responsexyt{f}(nf,1) wh-alldata.responsexyt{f}(nf,2)])*pix2inch;
	
	mtdata(s).automator{ns(s)} = alldata.automator{f};
	mtdata(s).currentautomatorstate(ns(s)) = alldata.currentautomatorstage(f);
	
	if n/100 == round(n/100)
		disp(['trial=' num2str(n)]);
	end
	
	if n/10000 == round(n/10000)
		save([savedir 'mtdata' num2str(mtdatafilenum) '.mat'],'mtdata');
	end %if
end %for n total trials
save([savedir 'mtdata' num2str(mtdatafilenum) '.mat'],'mtdata');


%%
function temp=preallocate(ntrialpersubj)

% Pre-allocate
for s=1:length(ntrialpersubj)
	n=ntrialpersubj(s);
	temp(s).datecreated=zeros(n,6);
	temp(s).datesaved=zeros(n,6);
	temp(s).datetrial=zeros(n,6);
	temp(s).day=zeros(n,1);
	temp(s).filetrial=zeros(n,4);
	temp(s).nobj=zeros(n,1);
	temp(s).nway=zeros(n,1);
	temp(s).fixationusessample=zeros(n,1);
	temp(s).rewardstage=zeros(n,1);
	temp(s).keepsampleon=zeros(n,1);
	temp(s).hidetestdistractors=zeros(n,1);
	temp(s).rewardper1000=zeros(n,1);
	temp(s).punishtimeout=zeros(n,1);
	temp(s).samplefolder=zeros(n,1);
	temp(s).sample=zeros(n,1);
	temp(s).samplelabel=zeros(n,1);
	temp(s).sampleon=zeros(n,1);
	temp(s).sampleoff=zeros(n,1);
	temp(s).testfolder=zeros(n,1);
	temp(s).test=zeros(n,8);
	temp(s).testlabel=zeros(n,8);
	temp(s).correctitem=zeros(n,1);
	temp(s).response=zeros(n,1);
	temp(s).correct=zeros(n,1);
	temp(s).windowsize=zeros(n,2);
	temp(s).fixationxy=zeros(n,2);
	temp(s).fixationwd=zeros(n,1);
	temp(s).fixationt=zeros(n,1);
	temp(s).fixationtouchdt=zeros(n,1);
	temp(s).fixationtouchxy=zeros(n,2);
	temp(s).samplexy=zeros(n,2);
	temp(s).samplewd=zeros(n,1);
	temp(s).sampledt=zeros(n,1);
	temp(s).testxy=zeros(n,2*8);
	temp(s).testwd=zeros(n,1);
	temp(s).testdt=zeros(n,1);
	temp(s).responsetouchdt=zeros(n,1);
	temp(s).responsetouchxy=zeros(n,2);
	if n>0
	temp(s).automator{n}=[];
	end
	temp(s).currentautomatorstage=zeros(n,1);
end



function mtdata=allocate_by_appending(mtdata,ntrialpersubj)

% allocate

for s=1:length(ntrialpersubj)
	n2=ntrialpersubj(s);
	n1=size(mtdata(s).filetrial,1);
	nadd=n2-n1;
	if nadd<=0
		continue
	end
	indadd=n1+1:n2;
	
	mtdata(s).datecreated(indadd,:)=zeros(nadd,6);
	mtdata(s).datesaved(indadd,:)=zeros(nadd,6);
	mtdata(s).datetrial(indadd,:)=zeros(nadd,6);
	mtdata(s).day(indadd,1)=zeros(nadd,1);
	mtdata(s).filetrial(indadd,:)=zeros(nadd,4);
	mtdata(s).nobj(indadd,1)=zeros(nadd,1);
	mtdata(s).nway(indadd,1)=zeros(nadd,1);
	mtdata(s).fixationusessample(indadd,1)=zeros(nadd,1);
	mtdata(s).rewardstage(indadd,1)=zeros(nadd,1);
	mtdata(s).keepsampleon(indadd,1)=zeros(nadd,1);
	mtdata(s).hidetestdistractors(indadd,1)=zeros(nadd,1);
	mtdata(s).rewardper1000(indadd,1)=zeros(nadd,1);
	mtdata(s).punishtimeout(indadd,1)=zeros(nadd,1);
	mtdata(s).samplefolder(indadd,1)=zeros(nadd,1);
	mtdata(s).sample(indadd,1)=zeros(nadd,1);
	mtdata(s).samplelabel(indadd,1)=zeros(nadd,1);
	mtdata(s).sampleon(indadd,1)=zeros(nadd,1);
	mtdata(s).sampleoff(indadd,1)=zeros(nadd,1);
	mtdata(s).testfolder(indadd,1)=zeros(nadd,1);
	mtdata(s).test(indadd,1:8)=zeros(nadd,8);
	mtdata(s).testlabel(indadd,1:8)=zeros(nadd,8);
	mtdata(s).correctitem(indadd,1)=zeros(nadd,1);
	mtdata(s).response(indadd,1)=zeros(nadd,1);
	mtdata(s).correct(indadd,1)=zeros(nadd,1);
	mtdata(s).windowsize(indadd,1:2)=zeros(nadd,2);
	mtdata(s).fixationxy(indadd,1:2)=zeros(nadd,2);
	mtdata(s).fixationwd(indadd,1)=zeros(nadd,1);
	mtdata(s).fixationt(indadd,1)=zeros(nadd,1);
	mtdata(s).fixationtouchdt(indadd,1)=zeros(nadd,1);
	mtdata(s).fixationtouchxy(indadd,1:2)=zeros(nadd,2);
	mtdata(s).samplexy(indadd,1:2)=zeros(nadd,2);
	mtdata(s).samplewd(indadd,1)=zeros(nadd,1);
	mtdata(s).sampledt(indadd,1)=zeros(nadd,1);
	mtdata(s).testxy(indadd,1:2*8)=zeros(nadd,2*8);
	mtdata(s).testwd(indadd,1)=zeros(nadd,1);
	mtdata(s).testdt(indadd,1)=zeros(nadd,1);
	mtdata(s).responsetouchdt(indadd,1)=zeros(nadd,1);
	mtdata(s).responsetouchxy(indadd,1:2)=zeros(nadd,2);
	if nadd>0
	for q=1:nadd
		mtdata(s).automator{indadd(q)}=[];
	end
	end
	mtdata(s).currentautomatorstage(indadd,1:2)=zeros(nadd,2);
end
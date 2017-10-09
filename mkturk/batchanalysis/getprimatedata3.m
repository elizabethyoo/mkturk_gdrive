function sdata=getprimatedata3(subjs,samplefolder,testfolder)
datadir='~/Dropbox (MIT)/imglvl/mtdata/';

nway=2;

sdata.samplefolder=samplefolder;
sdata.testfolder=testfolder;
sdata.nway=nway;	

sdata.subj=[];
sdata.sample=[];
sdata.test=[];
sdata.correctitem=[];
sdata.response=[];
sdata.correct=[];
sdata.responsetouchxy_inch_dt_ms=[];
sdata.day=[];
sdata.fixationtouchxy_inch_dt_ms=[];
sdata.sampleon=[];
sdata.ntaskobj=[];

sdata_all=[]; sdates=[];
mtdatafiles=dir([datadir 'mtdata*.mat']);
for f=1:length(mtdatafiles)
	load([datadir 'mtdata' num2str(f) '.mat']);
	
	for s=subjs
		if size(mtdata(s).filetrial,1)==0
			continue
		end
		startdatenum=datenum([2012 1 1 0 0 0]);
		
		%select trials
		indtrial=find(mtdata(s).nway == nway &...
			mtdata(s).rewardstage == 1 &...
			mtdata(s).samplefolder == samplefolder &...
			mtdata(s).testfolder == testfolder &...
			datenum(mtdata(s).datecreated)>=startdatenum);
% 			mtdata(s).keepsampleon == 0 &...
% 			mtdata(s).hidetestdistractors == 0 &...
		
		if isempty(indtrial)
			continue
		end
		
		%concatenate
		sdata.subj=[sdata.subj; s*ones(length(indtrial),1)];
		sdata.sample=[sdata.sample; 
			1+mtdata(s).sample(indtrial) 1+mtdata(s).samplelabel(indtrial)];
		sdata.test=[sdata.test;
			1+mtdata(s).test(indtrial,1:2) 1+mtdata(s).testlabel(indtrial,1:2)];
		sdata.correctitem=[sdata.correctitem;
			1+mtdata(s).correctitem(indtrial)];
		sdata.response=[sdata.response;
			1+mtdata(s).response(indtrial)];
		sdata.correct=[sdata.correct; mtdata(s).correct(indtrial)];
		sdata.responsetouchxy_inch_dt_ms=[sdata.responsetouchxy_inch_dt_ms; 
						mtdata(s).responsetouchxy(indtrial,1:2) - mtdata(s).samplexy(indtrial,1:2),...
						mtdata(s).responsetouchdt(indtrial)-mtdata(s).testdt(indtrial)];
		sdata.fixationtouchxy_inch_dt_ms=[sdata.fixationtouchxy_inch_dt_ms;
			mtdata(s).fixationtouchxy(indtrial,1:2) - mtdata(s).samplexy(indtrial,1:2),...
			mtdata(s).fixationtouchdt(indtrial)];
		sdata.day=[sdata.day; mtdata(s).day(indtrial,1)];
		sdata.sampleon=[sdata.sampleon; mtdata(s).sampleon(indtrial)];
		sdata.ntaskobj=[sdata.ntaskobj; mtdata(s).nobj(indtrial)];
	end %for s subjs
end %for f mtdata files

ind0=find(sdata.correctitem==1);
ind1=find(sdata.correctitem==2);
if isempty(sdata.response)
	disp(['No data for samplefolder' num2str(samplefolder)]);
	return
end
d(ind0,1)=sdata.test(ind0,2);
d(ind1,1)=sdata.test(ind1,1);
sdata.distractor=d;
sdata.choice=[];
sdata.indkeep=[];
sdata.name=[];

sdata.col11=[...
	sdata.sample,...
	sdata.test(:,3:4),...
	sdata.response,...
	sdata.subj,...
	sdata.distractor,...
	sdata.correct,...
	sdata.ntaskobj,...
	sdata.sampleon,...
	sdata.day];
sdata.col11labels={'sample' 'sample label' 'test1 label',...
	'test2 label' 'response' 'subjid' 'distractor' 'correct',...
	'ntaskobj' 'sampleon' 'day'};

disp([num2str(length(sdata.subj)) ' trials, ' num2str(length(sdata.subj)/length(unique(sdata.sample(:,1)))) ' reps/image']);
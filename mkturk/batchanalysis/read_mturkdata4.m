function read_mturkdata4
% Read monkeyturk parameters & data from dropbox and store in *.mat file
% 2016.06.12 - ei - This version now reads the new mkturk folder system and
% files after introduction of image bags and hierarchical folders

datadir='~/Dropbox (MIT)/MonkeyTurk/datafiles/';
batchdir='~/Dropbox (MIT)/MonkeyTurk/datafiles/batch/';

%% 1: FILE LIST PER SUBJECT
d=dir(datadir);

clear subjnames filenames filedates
subjcnt=0;
for i=1:length(d)
	if d(i).isdir == 0 ||...
		strcmp(d(i).name,'.') ||...
		strcmp(d(i).name,'..') ||...
		strcmp(d(i).name,'.DS_Store') ||...
		strcmp(d(i).name,'batch')
		continue
	end %if !folder
	
	%-------- SORTED FILE LIST --------%
	datafiles = dir([datadir d(i).name '/*.txt']);
	if length(datafiles) == 0
		continue
	end %if empty folder
	subjcnt = subjcnt+1;
	subjnames{subjcnt}=d(i).name;
	
	% Sort files based on date
	for q=1:length(datafiles)
		filenames{subjcnt}(q,:) = datafiles(q).name;
		filedates{subjcnt}(q,:) = datevec(datafiles(q).date);
	end %for q files
	
	[dummy,indsort] = sortrows(filedates{subjcnt});
	filenames{subjcnt}=filenames{subjcnt}(indsort,:);
	filedates{subjcnt}=filedates{subjcnt}(indsort,:);
	%-------- (END) SORTED FILE LIST --------%
end %for i folders

%% 2: FILEMETA STRUCTURE FOR EACH SUBJECT
for s=1:subjcnt
%-------- INITIALIZE FILEMETA STRUCT --------%
	if exist([batchdir subjnames{s} 'Files.mat'],'file')
		load([batchdir subjnames{s} 'Files.mat']);

		% Remove files that have already been processed
		stored_files=filemeta.filename;
		indremove=[];
		for f=1:length(stored_files)
			for f2=1:size(filenames{s},1)
				if strcmp(stored_files{f},deblank(filenames{s}(f2,:)))
					indremove = [indremove f2];
				end
			end %for f2 files
		end %for f processed files
		filenames{s}(indremove,:)=[];
		filedates{s}(indremove,:)=[];
		filecnt=length(stored_files);
	else
		filemeta = struct;
		filecnt=0;
	end %if
%-------- (END) INITIALIZE FILEMETA STRUCT --------%

%-------- PROCESS INDIVIDUAL FILES ---------%
	for f=1:size(filenames{s},1)
		keepfile=1;
		%-------- GET JSON DATA -------%
		fid = fopen([datadir subjnames{s} '/' deblank(filenames{s}(f,:))]);
		cnt=0; str='';
		str=fgetl(fid);
		LCurly=strfind(str,'{');
		RCurly=strfind(str,'}');
		if isempty(LCurly)
			keepfile=0;
			fclose(fid);
			continue
		end

		ntrials=-1;
		while ischar(str)
			if isempty(LCurly)
				continue
			end
			
			%---- DETERMINE #TRIALS ----%
			for varblock=1:length(LCurly)
				cnt=cnt+1;
				substr=str(LCurly(varblock):RCurly(varblock));
% 				substr=strrep(substr,'""','"');
				dataobj{cnt}=parse_json(substr);
				
				fields = fieldnames(dataobj{cnt});
				
				if isfield(dataobj{cnt},'Response')
					ntrials = length(dataobj{cnt}.Response);
				end
			end %for varblock
			%---- (END) DETERMINE #TRIALS ----%
			disp([num2str(f) ' of ' num2str(length(filenames{s})) ' ' filenames{s}(f,:) ': ' num2str(ntrials) ' trials']);

			str=fgetl(fid);
			LCurly=strfind(str,'{');
			RCurly=strfind(str,'}');
		end %while
		fclose(fid);
		
		if ntrials<10
			keepfile=0;
		end
		
		if keepfile==0
			continue
		end
		filecnt=filecnt+1;
		
		%-------- EXTRACT DATE & TIME -------%
		str=deblank(filenames{s}(f,:));
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

		filemeta.date_created(filecnt,:) = [yr mo dy hr mn sc];
		filemeta.date_lastsaved(filecnt,:) = filedates{s}(f,:);
		%-------- (END) EXTRACT DATE & TIME -------%	
		

		%-------- EXTRACT VARIABLES -------%
		filemeta.subjname{filecnt,1} = subjnames{s};
		filemeta.filename{filecnt,1} = deblank(filenames{s}(f,:));
		filemeta.ntrials(filecnt,1) = ntrials;
		if filecnt==1
			filemeta.indtrial(filecnt,1:2) = [1,ntrials];
		else
			filemeta.indtrial(filecnt,1:2) = filemeta.indtrial(filecnt-1,2)+[1, ntrials];
		end
		filemeta.extracted_data(filecnt,1) = 0;
		filemeta.extracted_index_monkeyturk(filecnt,1) = 0;
		filemeta.Ordered_Samplebag_Fileindices_monkeyturk{filecnt}=[];
		filemeta.Ordered_Testbag_Fileindices_monkeyturk{filecnt}=[];
		
		for j=1:length(dataobj)
			fields = fieldnames(dataobj{j});
				
			for v=1:length(fields)
				temp = eval(['dataobj{' num2str(j) '}.' fields{v}]);
					
				x=temp;
				celldepth=0;
				while 1
					if isa(x,'cell') && length(x)>0
						x=x{1};
						celldepth=celldepth+1;
					else
						break;
					end
				end

				if strcmp(fields{v},'Automator') && isa(temp,'char')==0
					temp='';
				end

				if ~isa(temp,'cell') && isa(temp,'char')
					temp2={temp};
				elseif ~isa(temp,'cell')
					temp2=temp;						
				elseif isa(temp,'cell') && (...
						strcmp(fields{v},'TestGridIndex') ||...
						strcmp(fields{v},'ObjectGridIndex') ||...
						strcmp(fields{v},'ImageBagsSample') ||...
						strcmp(fields{v},'ImageBagsTest') ||...
						strcmp(fields{v},'Ordered_Samplebag_Filenames') ||...
						strcmp(fields{v},'Ordered_Testbag_Filenames'))
					if celldepth == 0
						temp2={temp}; %keep in cell since varying length
					elseif celldepth > 0 && ~ischar(temp{1})
						temp2={cell2mat(temp)};
					else
						temp2={temp(:)}; %keep in cell since varying length
					end
				elseif isa(temp,'cell') && length(temp) == ntrials %if trial data
					continue
				end %if ~cell
				
				filemeta = setfield(filemeta,{1},fields{v},...
					{[filecnt],[1:size(temp2,2)]},temp2);				
			end %for v variable names
		end %for j varblocks
	end %for f files
%-------- (END) PROCESS INDIVIDUAL FILES ---------%
save([batchdir subjnames{s} 'Files.mat'],'filemeta');
end %for s subj
disp('DONE EXTRACTING FILE META')
%% 2: DATA FOR EACH TRIAL
for s=1:subjcnt
	load([batchdir subjnames{s} 'Files.mat']);

	n=length(find(filemeta.extracted_data==0));
	disp([num2str(n) ' files need processing']);
	if n==0
		continue
	end
	
%--------- PREALLOCATE
	clear trialdata
	totaltrials = filemeta.indtrial(end,2);
	if exist([batchdir subjnames{s} 'Trials.mat'])
		load([batchdir subjnames{s} 'Trials.mat']);
	else
		trialdata = struct(...
			'StartTime',0,...
			'FixationGridIndex',0,...
			'FixationXYT',0,...
			'AllFixationXYT',{{0}},...
			'Sample',0,...
			'Test',0,...
			'ResponseXYT',0,...
			'Response',0,...
			'CorrectItem',0,...
			'FixationTouchEvent',{''},...
			'ResponseTouchEvent',{''},...
			'NReward',0,...
			'AutomatorStage',0,...
			'TSequenceDesired',0,...
			'TSequenceActual',0);
		trialdata.AllFixationXYT{1}={};
	end
	fields = fieldnames(trialdata);
	for v=1:length(fields)
		temp = getfield(trialdata,fields{v});
		if size(temp,1) < totaltrials %append
			if strcmp(fields{v},'FixationXYT') || strcmp(fields{v},'ResponseXYT')
				temp(totaltrials,1:3) = 0;
			elseif strcmp(fields{v},'TSequenceDesired') || strcmp(fields{v},'TSequenceActual')
				temp(totaltrials,1:10) = 0;
			elseif strcmp(fields{v},'FixationTouchEvent') || strcmp(fields{v},'ResponseTouchEvent')
				temp{totaltrials,1} = '';
			elseif strcmp(fields{v},'Test')
				temp(totaltrials,1:8) = 0;
			elseif strcmp(fields{v},'AllFixationXYT')
				temp{totaltrials,1}={};
			else
				temp(totaltrials,1) = 0;
			end
			trialdata = setfield(trialdata,fields{v},temp);
		end %if
	end %for v
%--------- (END) PREALLOCATE

	for f=1:size(filemeta.filename,1)
		if filemeta.extracted_data(f) == 1
			continue
		end

		%-------- GET JSON DATA -------%
		fid = fopen([datadir subjnames{s} '/' deblank(filemeta.filename{f})]);
		cnt=0; str='';
		str=fgetl(fid);
		LCurly=strfind(str,'{');
		RCurly=strfind(str,'}');

		while ischar(str)
			if isempty(LCurly)
				continue
			end
			
			for varblock=1:length(LCurly)
				cnt=cnt+1;
				substr=str(LCurly(varblock):RCurly(varblock));
% 				substr=strrep(substr,'""','"');
				dataobj{cnt}=parse_json(substr);
			end %for varblock
			disp([num2str(f) ' of ' num2str(length(filemeta.filename)) ' ' filemeta.filename{f} ': ' num2str(filemeta.ntrials(f)) ' trials']);

			str=fgetl(fid);
			LCurly=strfind(str,'{');
			RCurly=strfind(str,'}');
		end %while
		fclose(fid);
		
		%-------- EXTRACT VARIABLES -------%
		for j=1:length(dataobj)	
			fields = fieldnames(dataobj{j});
			if ~isfield(dataobj{j},'Response')
				continue
			end			
			
			for v=1:length(fields)
				temp = eval(['dataobj{' num2str(j) '}.' fields{v}]);
					
				x=temp;
				celldepth=0;
				while 1
					if isa(x,'cell') && length(x)>0
						x=x{1};
						celldepth=celldepth+1;
					else
						break;
					end
				end

				if isa(temp,'cell') && length(temp) == filemeta.ntrials(f) %if trial data
					if isempty(temp{1})
						continue
					end
					clear temp2
					if celldepth == 1 %convert to mat
						if ischar(temp{1})
							temp2=temp(:);
						else
							temp2=cell2mat(temp(:));
						end
					elseif celldepth == 2 %convert to mat
						for q=1:length(temp)
							temp2(q,:) = cell2mat(temp{q});
						end %for q trials
					elseif celldepth == 3 %keep as cell
						temp2 = temp(:);
					end %if celldepth
					trialdata = setfield(trialdata,{1},fields{v},...
						{[filemeta.indtrial(f,1):filemeta.indtrial(f,2)],[1:size(temp2,2)]},...
						temp2);
				end %if ~cell
			end %for v variable names
		end %for j varblocks
		filemeta.extracted_data(f)=1;
	end %for f files	
	save([batchdir subjnames{s} 'Trials.mat'],'trialdata');
	save([batchdir subjnames{s} 'Files.mat'],'filemeta');
end %for s subjects
disp('DONE EXTRACTING TRIAL DATA')
%% 3: Get original image indices from monkeyturk
load('~/Dropbox (MIT)/MonkeyTurk/obj25/imagemeta/imagemeta_mkturk.mat');
for s=1:subjcnt
	load([batchdir subjnames{s} 'Files.mat']);
	for f=1:size(filemeta.filename,1)
		if filemeta.extracted_index_monkeyturk(f) == 1
			continue
		end

		imnames = [filemeta.Ordered_Samplebag_Filenames{f};
			filemeta.Ordered_Testbag_Filenames{f}];
		nsample=length(filemeta.Ordered_Samplebag_Filenames{f});
		ntest=length(filemeta.Ordered_Testbag_Filenames{f});
		
		clear ind_monkeyturk
		for i=1:length(imnames)
			ind=strfind(imnames{i},'/');
			str=imnames{i}(ind(end-1)+1:end);
			
			try
				ind_monkeyturk(i,:)=image_keyvalue(str);
			catch
				disp('no key-value pair found for image');
			end
		end %for i imnames
		try
			filemeta.Ordered_Samplebag_Fileindices_monkeyturk{f}=ind_monkeyturk(1:nsample,:);
			filemeta.Ordered_Testbag_Fileindices_monkeyturk{f}=ind_monkeyturk(nsample+1:end,:);
		catch
			disp('none of the images had a correspondence');
			disp(imnames);
		end
		filemeta.extracted_index_monkeyturk(f)=1;
		
		disp([num2str(f) ' of ' num2str(length(filemeta.filename)) ' ' filemeta.filename{f} ': ',...
			num2str(nsample) ',' num2str(ntest) ' sample,test images']);
	end %for files
	save([batchdir subjnames{s} 'Files.mat'],'filemeta');
end %for s
disp('DONE FINDING CORRESPONDING MONKEYTURK IMAGE INDEX')

%% EXTRACTION 1: 13 column format (macaque objectome)
setdata.data=[];
for s=1:length(subjnames)
	datamat=[];
	load([batchdir subjnames{s} 'Trials.mat'],'trialdata');
	load([batchdir subjnames{s} 'Files.mat'],'filemeta');
	
	for f=1:length(filemeta.filename)
		if isempty(filemeta.Ordered_Samplebag_Fileindices_monkeyturk{f}) ||...
			filemeta.Ordered_Samplebag_Fileindices_monkeyturk{f}(1,1)~=3 ||...
				length(filemeta.TestGridIndex{f})~=2 ||...
				filemeta.SampleON(f) > 200 ||...
				filemeta.HideTestDistractors(f) ==1 ||...
				filemeta.KeepSampleON(f) == 1
			continue
		end
		dy = ceil(etime(filemeta.date_created(f,:),[2012 1 1 0 0 0])/(24*3600)); %day file created
		
		samplenums=filemeta.Ordered_Samplebag_Fileindices_monkeyturk{f};
		testnums=filemeta.Ordered_Testbag_Fileindices_monkeyturk{f};
		
		indtrial=filemeta.indtrial(f,1):filemeta.indtrial(f,2);

		dstrctr=zeros(length(indtrial),1);
		ind0=find(trialdata.CorrectItem(indtrial)==0);
		ind1=find(trialdata.CorrectItem(indtrial)==1);
		dstrctr(ind0,1)=trialdata.Test(indtrial(ind0),2);
		dstrctr(ind1,1)=trialdata.Test(indtrial(ind1),1);

		crrct=zeros(length(indtrial),1);
		crrct(find(trialdata.Response(indtrial)-trialdata.CorrectItem(indtrial)==0))=1;
		
		datamat = [datamat;
			1+samplenums(1+trialdata.Sample(indtrial),2),... %SAMPLE
			1+floor(samplenums(1+trialdata.Sample(indtrial),2)/100),... %LABEL
			1+testnums(1+trialdata.Test(indtrial,1),2),... %TEST1
			1+testnums(1+trialdata.Test(indtrial,1),2),... %LABEL1		
			1+testnums(1+trialdata.Test(indtrial,2),2),... %TEST2
			1+testnums(1+trialdata.Test(indtrial,2),2),... %LABEL2
			1+trialdata.Response(indtrial),... %RESPONSE
			s*ones(length(indtrial),1),... %SUBJECT_ID
			1+dstrctr,... %DISTRACTOR
			crrct,... %CORRECT
			length(testnums)*ones(length(indtrial),1),... %NTASKOBJ
			filemeta.SampleON(f)*ones(length(indtrial),1),... %SAMPLEON
			dy*ones(length(indtrial),1)]; %SESSION
	end %for f files
	
	disp([filemeta.Subject{f} '-' num2str(size(datamat,1)) ' trials']);
	setdata.data=[setdata.data; datamat];
end %for s subjects
setdata.datalabels={'sample' 'sample label' 'test1' 'test1 label' 'test2' 'test2 label',...
'response' 'subjid' 'distractor' 'correct',...
'ntaskobj' 'sampleon' 'session'};

save([batchdir 'mkturksync0.mat'],'setdata','subjnames');

%% EXTRACTION 2: 13 column format (marmoset data)
% Store daily stats as well as trial stats

subjnames={'Setta','Sausage','Waffles','Bento','Pablo','Picasso','Zico'};

clear setdata
for s=1:length(subjnames)
	datamat=[];

	load([batchdir subjnames{s} 'Trials.mat'],'trialdata');
	load([batchdir subjnames{s} 'Files.mat'],'filemeta');

	if strcmp(subjnames{s},'Setta')
		setdata(s).wt_baseline = 0.386;
	elseif strcmp(subjnames{s},'Sausage')
		setdata(s).wt_baseline = 0.313;
	elseif strcmp(subjnames{s},'Waffles')
		setdata(s).wt_baseline = 0.342;
	end
	
	setdata(s).Weight = filemeta.Weight;
	setdata(s).RewardStage = filemeta.RewardStage;
	setdata(s).day = ceil(etime(filemeta.date_created,[2012 1 1 0 0 0])/(24*3600)); %day file created
	setdata(s).ntrials = filemeta.ntrials;
	
	for f=5:length(filemeta.filename)

		%---- determine whether is post free water day
		ind=find(setdata(s).day(1:f-1) < setdata(s).day(f));
		if ~isempty(ind)
			setdata(s).iscwa_wt(f)=setdata(s).day(f) - setdata(s).day(ind(end));
		else
			setdata(s).iscwa_wt(f)=nan;
		end
		
		%---- task time (hrs)
		setdata(s).dt_file(f) = etime(filemeta.date_lastsaved(f,:),filemeta.date_created(f,:))/3600;
		
		indtrial = filemeta.indtrial(f,:);
		dt = trialdata.FixationXYT(indtrial(2),3) - trialdata.FixationXYT(indtrial(1),3);
		setdata(s).dt_trial(f) = dt/1000/3600; %ms->hrs
		
		%---- battery
		%---- image timing
		
		samplenums=filemeta.Ordered_Samplebag_Fileindices_monkeyturk{f};
		testnums=filemeta.Ordered_Testbag_Fileindices_monkeyturk{f};
		if isempty(samplenums)
			continue
		end
		indtrial=filemeta.indtrial(f,1):filemeta.indtrial(f,2);

		dstrctr=zeros(length(indtrial),1);
		ind0=find(trialdata.CorrectItem(indtrial)==0);
		ind1=find(trialdata.CorrectItem(indtrial)==1);
		dstrctr(ind0,1)=trialdata.Test(indtrial(ind0),2);
		dstrctr(ind1,1)=trialdata.Test(indtrial(ind1),1);

		crrct=zeros(length(indtrial),1);
		crrct(find(trialdata.Response(indtrial)-trialdata.CorrectItem(indtrial)==0))=1;
		
		datamat = [datamat;
			1+samplenums(1+trialdata.Sample(indtrial),2),... %SAMPLE
			1+floor(samplenums(1+trialdata.Sample(indtrial),2)/100),... %LABEL
			1+testnums(1+trialdata.Test(indtrial,1),2),... %TEST1
			1+testnums(1+trialdata.Test(indtrial,1),2),... %LABEL1		
			1+testnums(1+trialdata.Test(indtrial,2),2),... %TEST2
			1+testnums(1+trialdata.Test(indtrial,2),2),... %LABEL2
			1+trialdata.Response(indtrial),... %RESPONSE
			s*ones(length(indtrial),1),... %SUBJECT_ID
			1+dstrctr,... %DISTRACTOR
			crrct,... %CORRECT
			length(testnums)*ones(length(indtrial),1),... %NTASKOBJ
			filemeta.SampleON(f)*ones(length(indtrial),1),... %SAMPLEON
			setdata(s).day(f)*ones(length(indtrial),1)]; %SESSION
	end %for f files
	
	disp([filemeta.Subject{f} '-' num2str(size(datamat,1)) ' trials']);
	setdata(s).data=datamat;

	setdata(s).datalabels={'sample' 'sample label' 'test1' 'test1 label' 'test2' 'test2 label',...
	'response' 'subjid' 'distractor' 'correct',...
	'ntaskobj' 'sampleon' 'session'};
end %for s subjects

% save([batchdir 'mkturksync0.mat'],'setdata','subjnames');
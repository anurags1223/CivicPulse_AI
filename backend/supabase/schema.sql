-- CivicPulse AI: shared records, server-side triage, restricted workflow and audit trail.
create schema if not exists civic_private;
revoke all on schema civic_private from public, anon;
grant usage on schema civic_private to authenticated;
create table civic_private.staff_emails (email text primary key check(email=lower(email)));
alter table civic_private.staff_emails enable row level security;
insert into civic_private.staff_emails(email) values ('bikeesah30@gmail.com');

-- Authorization uses the server's verified auth record, never user-editable metadata.
create function civic_private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join civic_private.staff_emails s on s.email=lower(u.email)
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null);
$$;
revoke all on function civic_private.is_staff() from public, anon;
grant execute on function civic_private.is_staff() to authenticated;
create function public.cp_current_role() returns text language sql stable security invoker set search_path='' as $$
 select case when civic_private.is_staff() then 'staff' else 'citizen' end;
$$;
revoke all on function public.cp_current_role() from public,anon;
grant execute on function public.cp_current_role() to authenticated;

create table public.cp_issues (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id),
 title text not null check(length(trim(title)) between 5 and 140),
 description text not null check(length(trim(description)) between 10 and 3000),
 locality text not null check(length(trim(locality)) between 3 and 160),
 category text not null check(category in ('roads','sanitation','lighting','drainage','water','other')),
 severity text not null check(severity in ('low','medium','high','critical')),
 lat double precision not null check(lat between -90 and 90),
 lng double precision not null check(lng between -180 and 180),
 department text not null default '',
 score integer not null default 0 check(score between 0 and 100),
 priority text not null default 'Medium',
 reasons jsonb not null default '[]',
 status text not null default 'Reported' check(status in ('Reported','Assigned','In progress','Awaiting confirmation','Resolved')),
 photo_path text,
 resolution_photo_path text,
 resolution_note text,
 action_note text not null default '' check(length(action_note)<=2000),
 rating integer check(rating between 1 and 5),
 is_demo boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index cp_issues_reporter on public.cp_issues(reporter_id);
create index cp_issues_queue on public.cp_issues(status,score desc);
create table public.cp_votes (
 issue_id uuid not null references public.cp_issues(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 primary key(issue_id,user_id)
);
create index cp_votes_user on public.cp_votes(user_id);
create table public.cp_events (
 id uuid primary key default gen_random_uuid(),
 issue_id uuid not null references public.cp_issues(id) on delete cascade,
 actor_id uuid references auth.users(id),
 status text not null,
 note text not null,
 created_at timestamptz not null default now()
);
create index cp_events_issue on public.cp_events(issue_id);
create index cp_events_actor on public.cp_events(actor_id);
alter table public.cp_issues enable row level security;
alter table public.cp_votes enable row level security;
alter table public.cp_events enable row level security;
revoke all on public.cp_issues,public.cp_votes,public.cp_events from anon,authenticated;
grant select,insert,update on public.cp_issues to authenticated;
grant select,insert,delete on public.cp_votes to authenticated;
grant select on public.cp_events to authenticated;
create policy cp_issue_read on public.cp_issues for select to authenticated using(true);
create policy cp_issue_insert on public.cp_issues for insert to authenticated with check(reporter_id=(select auth.uid()) and not is_demo);
create policy cp_issue_update on public.cp_issues for update to authenticated
 using(reporter_id=(select auth.uid()) or (select civic_private.is_staff()))
 with check(reporter_id=(select auth.uid()) or (select civic_private.is_staff()));
create policy cp_vote_read on public.cp_votes for select to authenticated using(true);
create policy cp_vote_insert on public.cp_votes for insert to authenticated with check(user_id=(select auth.uid()));
create policy cp_vote_delete on public.cp_votes for delete to authenticated using(user_id=(select auth.uid()));
create policy cp_event_read on public.cp_events for select to authenticated using(true);

create function civic_private.guard_issue() returns trigger language plpgsql security invoker set search_path='' as $$
declare
 text_value text; base integer; impact integer; total integer; rs jsonb; label text;
begin
 if auth.uid() is null then raise exception 'Sign in before changing a report'; end if;
 if TG_OP='INSERT' then
   new.reporter_id=auth.uid(); new.status='Reported'; new.is_demo=false;
   new.created_at=now(); new.updated_at=now(); new.resolution_photo_path=null;
   new.resolution_note=null; new.rating=null; new.action_note='Report submitted; routing suggested by transparent rules.';
   text_value=lower(new.title||' '||new.description);
   base=case new.severity when 'critical' then 80 when 'high' then 60 when 'medium' then 40 else 20 end;
   impact=case new.category when 'roads' then 8 when 'drainage' then 10 when 'lighting' then 6 when 'water' then 6 when 'sanitation' then 4 else 0 end;
   label=case new.category when 'roads' then 'Roads & footpaths' when 'drainage' then 'Drainage & flooding' when 'lighting' then 'Street lighting' when 'water' then 'Water supply' when 'sanitation' then 'Waste & sanitation' else 'Other civic issue' end;
   rs=jsonb_build_array(jsonb_build_object('label',initcap(new.severity)||' reported severity','points',base));
   if impact>0 then rs=rs||jsonb_build_array(jsonb_build_object('label',label||' impact','points',impact)); end if;
   total=base+impact;
   if text_value ~ '\m(school|hospital|playground)\M' then total=total+12;rs=rs||jsonb_build_array(jsonb_build_object('label','School, hospital or playground mentioned','points',12)); end if;
   if text_value ~ '\m(dangerous|danger|accident|injury|unsafe|exposed)\M' then total=total+12;rs=rs||jsonb_build_array(jsonb_build_object('label','Safety language in report','points',12)); end if;
   new.score=least(100,total);new.reasons=rs;
   new.priority=case when new.score>=80 then 'Critical' when new.score>=60 then 'High' when new.score>=40 then 'Medium' else 'Low' end;
   new.department=case new.category when 'roads' then 'Roads & Infrastructure' when 'lighting' then 'Electrical Services' when 'sanitation' then 'Sanitation' when 'drainage' then 'Water & Drainage' when 'water' then 'Water & Drainage' else 'General Services' end;
   if new.photo_path is not null and not exists(select 1 from storage.objects o where o.bucket_id='civic-evidence' and o.name=new.photo_path and o.owner_id=auth.uid()::text) then raise exception 'Upload your report photo first';end if;
 else
   if (to_jsonb(new)-array['status','action_note','resolution_photo_path','resolution_note','rating','updated_at']) is distinct from
      (to_jsonb(old)-array['status','action_note','resolution_photo_path','resolution_note','rating','updated_at']) then
      raise exception 'Report content and computed priority cannot be changed through the workflow';
   end if;
   if length(trim(new.action_note))<5 then raise exception 'Explain this status change in at least five characters';end if;
   if civic_private.is_staff() and (
      (old.status='Reported' and new.status='Assigned') or
      (old.status='Assigned' and new.status='In progress') or
      (old.status='In progress' and new.status='Awaiting confirmation')
   ) then
      if new.rating is distinct from old.rating then raise exception 'Only the reporter may rate the repair';end if;
      if new.status='Awaiting confirmation' then
       if new.resolution_note is null or length(trim(new.resolution_note))<10 then raise exception 'Add a repair note of at least 10 characters';end if;
       if new.resolution_photo_path is null or not exists(select 1 from storage.objects o where o.bucket_id='civic-evidence' and o.name=new.resolution_photo_path and o.owner_id=auth.uid()::text) then raise exception 'Upload a repair evidence photo before requesting confirmation';end if;
      elsif new.resolution_photo_path is distinct from old.resolution_photo_path or new.resolution_note is distinct from old.resolution_note then raise exception 'Evidence changes are only allowed when requesting confirmation';end if;
   elsif old.reporter_id=auth.uid() and old.status='Awaiting confirmation' and new.status in ('Resolved','In progress') then
      if new.resolution_photo_path is distinct from old.resolution_photo_path or new.resolution_note is distinct from old.resolution_note then raise exception 'Repair evidence cannot be changed by the reporter';end if;
      if new.status='Resolved' and new.rating is null then raise exception 'Rate the completed repair';end if;
      if new.status='In progress' then new.rating=null;end if;
   else raise exception 'This status change is not allowed for your account';end if;
   new.updated_at=now();
 end if;
 return new;
end;$$;
revoke all on function civic_private.guard_issue() from public,anon,authenticated;
create trigger cp_issue_guard before insert or update on public.cp_issues for each row execute function civic_private.guard_issue();

-- Definer is necessary for append-only audit records. No public execute grant.
create function civic_private.audit_issue() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authenticated audit actor required';end if;
 insert into public.cp_events(issue_id,actor_id,status,note) values(new.id,auth.uid(),new.status,new.action_note);
 return new;
end;$$;
revoke all on function civic_private.audit_issue() from public,anon,authenticated;
create trigger cp_issue_audit after insert or update on public.cp_issues for each row execute function civic_private.audit_issue();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('civic-evidence','civic-evidence',false,4194304,array['image/jpeg','image/png','image/webp']);
create policy cp_photo_upload on storage.objects for insert to authenticated with check(bucket_id='civic-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy cp_photo_read on storage.objects for select to authenticated using(bucket_id='civic-evidence' and
 (owner_id=(select auth.uid())::text or exists(select 1 from public.cp_issues i where i.photo_path=name or i.resolution_photo_path=name)));
create policy cp_orphan_photo_delete on storage.objects for delete to authenticated using(bucket_id='civic-evidence' and owner_id=(select auth.uid())::text and not exists(select 1 from public.cp_issues i where i.photo_path=name or i.resolution_photo_path=name));

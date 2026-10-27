-- Run against the provisioned project. All test users and rows are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at,aud,role) values
 ('11111111-1111-4111-8111-111111111111','citizen-test@example.invalid',now(),'authenticated','authenticated'),
 ('22222222-2222-4222-8222-222222222222','staff-test@example.invalid',now(),'authenticated','authenticated'),
 ('33333333-3333-4333-8333-333333333333','other-test@example.invalid',now(),'authenticated','authenticated');
insert into civic_private.staff_emails values('staff-test@example.invalid');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.cp_issues(id,reporter_id,title,description,locality,category,severity,lat,lng,score,status) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Critical pothole near a school','Dangerous to riders near the school entrance.','Sector 22 School Road','roads','critical',30.7333,76.7794,1,'Resolved');
do $$begin
 if not exists(select 1 from public.cp_issues where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and score=100 and status='Reported' and jsonb_array_length(reasons)=4) then raise exception 'FAIL: score/status not recalculated';end if;
 if (select count(*) from public.cp_events where issue_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>1 then raise exception 'FAIL: audit insert missing';end if;
 begin update public.cp_issues set status='Resolved',action_note='Trying to skip staff review' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';raise exception 'FAIL: citizen advanced status';exception when others then if SQLERRM like 'FAIL:%' then raise;end if;end;
 begin update public.cp_issues set score=1,action_note='Tamper with score' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';raise exception 'FAIL: score tampering allowed';exception when others then if SQLERRM like 'FAIL:%' then raise;end if;end;
 begin insert into public.cp_events(issue_id,status,note)values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Resolved','Forged');raise exception 'FAIL: audit forged';exception when insufficient_privilege then null;end;
end;$$;
insert into public.cp_votes(issue_id,user_id)values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111');
do $$begin
 begin insert into public.cp_votes(issue_id,user_id)values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111');raise exception 'FAIL: duplicate vote';exception when unique_violation then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$declare n integer;begin
 update public.cp_issues set status='Assigned',action_note='Unauthorized assignment' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: another citizen updated the report';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$begin if public.cp_current_role()<>'staff' then raise exception 'FAIL: staff role missing';end if;end;$$;
update public.cp_issues set status='Assigned',action_note='Assigned to the roads department' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.cp_issues set status='In progress',action_note='Road crew started the repair' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$begin
 begin update public.cp_issues set status='Awaiting confirmation',resolution_note='Repair complete, please verify.',action_note='Repair complete, please verify.' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';raise exception 'FAIL: proof-free closure request';exception when others then if SQLERRM like 'FAIL:%' then raise;end if;end;
end;$$;
-- A transaction-local storage object stands in for an authenticated upload.
reset role;
insert into storage.objects(bucket_id,name,owner_id)values('civic-evidence','22222222-2222-4222-8222-222222222222/test.jpg','22222222-2222-4222-8222-222222222222');
set local role authenticated;
update public.cp_issues set status='Awaiting confirmation',resolution_photo_path='22222222-2222-4222-8222-222222222222/test.jpg',resolution_note='Road surface repaired and made level.',action_note='Road surface repaired and made level.' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$begin
 begin update public.cp_issues set status='Resolved',rating=5,action_note='Staff attempting resident confirmation' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';raise exception 'FAIL: staff self-confirmation';exception when others then if SQLERRM like 'FAIL:%' then raise;end if;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
update public.cp_issues set status='In progress',action_note='The pothole is still visible. Please revisit.' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
update public.cp_issues set status='Awaiting confirmation',action_note='Repair revisited; original proof available.' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
update public.cp_issues set status='Resolved',rating=5,action_note='Inspected the repair and confirmed it is fixed.' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$begin
 if not exists(select 1 from public.cp_issues where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and status='Resolved' and rating=5) then raise exception 'FAIL: resident closure';end if;
 if (select count(*) from public.cp_events where issue_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>7 then raise exception 'FAIL: status audit incomplete';end if;
end;$$;
reset role;
select 'PASS: server scores, RLS ownership, staff routing, proof requirement, reopen, resident closure, vote uniqueness and immutable audit trail' as test_result;
rollback;

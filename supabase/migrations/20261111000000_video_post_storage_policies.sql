-- Allow signed-in users to upload and clean up only files in their own post folder.
-- Object names use: <auth-user-id>/posts/<filename>
drop policy if exists "Users can upload own video posts" on storage.objects;
create policy "Users can upload own video posts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'Video'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'posts'
);

drop policy if exists "Users can delete own video posts" on storage.objects;
create policy "Users can delete own video posts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'Video'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'posts'
);

drop policy if exists "Users can upload own video covers" on storage.objects;
create policy "Users can upload own video covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'Image'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'posts'
);

drop policy if exists "Users can delete own video covers" on storage.objects;
create policy "Users can delete own video covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'Image'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'posts'
);

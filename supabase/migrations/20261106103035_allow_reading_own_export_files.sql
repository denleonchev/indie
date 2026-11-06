create policy "Users can read own export files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'wallet')
  );

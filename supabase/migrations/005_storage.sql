-- Studioflow — Phase 2 / Migration 005
-- Storage buckets + policies (DB §7)
-- avatars:      public,  2 MB, images,          path {user_id}/avatar.{ext}
-- client-files: private, 10 MB, docs + images,  path {workspace_id}/{client_id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-files', 'client-files', false, 10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- avatars: public read; users manage only their own folder ({user_id}/...) --
CREATE POLICY "avatars_read_all"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- client-files: workspace-scoped (first folder = workspace owner id) -------
-- Read: all workspace members. Write: Owner/Manager only.
CREATE POLICY "client_files_read_workspace"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = public.current_workspace_owner()::text
  );

CREATE POLICY "client_files_insert_manager"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = public.current_workspace_owner()::text
    AND public.is_workspace_manager()
  );

CREATE POLICY "client_files_update_manager"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = public.current_workspace_owner()::text
    AND public.is_workspace_manager()
  )
  WITH CHECK (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = public.current_workspace_owner()::text
    AND public.is_workspace_manager()
  );

CREATE POLICY "client_files_delete_manager"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = public.current_workspace_owner()::text
    AND public.is_workspace_manager()
  );

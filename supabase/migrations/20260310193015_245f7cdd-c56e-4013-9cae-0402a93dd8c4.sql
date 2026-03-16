INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at, 
  confirmation_token, raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@resumeos.dev',
  crypt('Test1234!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Test User"}'::jsonb
);
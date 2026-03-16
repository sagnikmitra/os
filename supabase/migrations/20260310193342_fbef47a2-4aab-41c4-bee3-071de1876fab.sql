
UPDATE auth.users
SET 
  email_change = '',
  email_change_token_new = '',
  email_change_token_current = '',
  phone = '',
  phone_change = '',
  phone_change_token = '',
  email_change_confirm_status = 0,
  is_sso_user = false,
  deleted_at = NULL,
  is_anonymous = false
WHERE email = 'test@resumeos.dev';

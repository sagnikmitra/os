
-- Create the missing trigger for handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert profile for existing test user
INSERT INTO public.profiles (id, full_name)
VALUES ('47f8b7b5-b192-434e-bb41-cf19a1cdfa0e', 'Test User')
ON CONFLICT (id) DO NOTHING;

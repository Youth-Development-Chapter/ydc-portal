-- Create check_user_providers SQL function to identify user providers by email
CREATE OR REPLACE FUNCTION public.check_user_providers(email_param TEXT)
RETURNS TEXT[] AS $$
DECLARE
  providers TEXT[];
BEGIN
  SELECT COALESCE(ARRAY_AGG(DISTINCT provider), '{}'::text[]) INTO providers
  FROM auth.identities i
  JOIN auth.users u ON i.user_id = u.id
  WHERE u.email = email_param;
  
  RETURN providers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

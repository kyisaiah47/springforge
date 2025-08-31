-- Add policies to allow server-side onboarding

-- Allow authenticated users to create organizations (for onboarding)
CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to create member records (for onboarding)
CREATE POLICY "Authenticated users can create members" ON members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update the members policy to allow users to view their own record even if they don't have an org yet
DROP POLICY IF EXISTS "Users can view members in their organization" ON members;
CREATE POLICY "Users can view members in their organization" ON members
    FOR SELECT USING (
        (org_id = get_current_org() AND deleted_at IS NULL) OR 
        (email = auth.jwt() ->> 'email' AND deleted_at IS NULL)
    );
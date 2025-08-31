-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE retros ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_runs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's member record
CREATE OR REPLACE FUNCTION get_current_member()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND deleted_at IS NULL
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION get_current_org()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT org_id FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND deleted_at IS NULL
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' FROM members 
        WHERE email = auth.jwt() ->> 'email' 
        AND deleted_at IS NULL
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id = get_current_org()
    );

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id = get_current_org() AND is_admin()
    );

-- Members policies
CREATE POLICY "Users can view members in their organization" ON members
    FOR SELECT USING (
        org_id = get_current_org() AND deleted_at IS NULL
    );

CREATE POLICY "Users can update their own profile" ON members
    FOR UPDATE USING (
        id = get_current_member()
    );

CREATE POLICY "Admins can manage members in their organization" ON members
    FOR ALL USING (
        org_id = get_current_org() AND is_admin()
    );

-- Integrations policies
CREATE POLICY "Users can view integrations in their organization" ON integrations
    FOR SELECT USING (
        org_id = get_current_org() AND deleted_at IS NULL
    );

CREATE POLICY "Admins can manage integrations in their organization" ON integrations
    FOR ALL USING (
        org_id = get_current_org() AND is_admin()
    );

-- Standups policies
CREATE POLICY "Users can view standups in their organization" ON standups
    FOR SELECT USING (
        org_id = get_current_org()
    );

CREATE POLICY "Users can create their own standups" ON standups
    FOR INSERT WITH CHECK (
        org_id = get_current_org() AND member_id = get_current_member()
    );

CREATE POLICY "Users can update their own standups" ON standups
    FOR UPDATE USING (
        org_id = get_current_org() AND member_id = get_current_member()
    );

-- PR Insights policies
CREATE POLICY "Users can view PR insights in their organization" ON pr_insights
    FOR SELECT USING (
        org_id = get_current_org()
    );

CREATE POLICY "System can manage PR insights" ON pr_insights
    FOR ALL USING (
        org_id = get_current_org()
    );

-- Retros policies
CREATE POLICY "Users can view retros in their organization" ON retros
    FOR SELECT USING (
        org_id = get_current_org()
    );

CREATE POLICY "Users can create retros in their organization" ON retros
    FOR INSERT WITH CHECK (
        org_id = get_current_org() AND created_by = get_current_member()
    );

CREATE POLICY "Users can update retros they created" ON retros
    FOR UPDATE USING (
        org_id = get_current_org() AND created_by = get_current_member()
    );

CREATE POLICY "Admins can manage all retros in their organization" ON retros
    FOR ALL USING (
        org_id = get_current_org() AND is_admin()
    );

-- Retro Notes policies
CREATE POLICY "Users can view retro notes in their organization" ON retro_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM retros 
            WHERE retros.id = retro_notes.retro_id 
            AND retros.org_id = get_current_org()
        )
    );

CREATE POLICY "Users can create retro notes" ON retro_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM retros 
            WHERE retros.id = retro_notes.retro_id 
            AND retros.org_id = get_current_org()
        )
        AND (author_member_id = get_current_member() OR author_member_id IS NULL)
    );

CREATE POLICY "Users can update their own retro notes" ON retro_notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM retros 
            WHERE retros.id = retro_notes.retro_id 
            AND retros.org_id = get_current_org()
        )
        AND author_member_id = get_current_member()
    );

-- Arcade Levels policies (public read access)
CREATE POLICY "Anyone can view arcade levels" ON arcade_levels
    FOR SELECT USING (true);

-- Arcade Runs policies
CREATE POLICY "Users can view arcade runs in their organization" ON arcade_runs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = arcade_runs.member_id 
            AND members.org_id = get_current_org()
        )
    );

CREATE POLICY "Users can create their own arcade runs" ON arcade_runs
    FOR INSERT WITH CHECK (
        member_id = get_current_member()
    );

CREATE POLICY "Users can view their own arcade runs" ON arcade_runs
    FOR SELECT USING (
        member_id = get_current_member()
    );
-- SprintForge Database Migrations
-- Generated for deployment


CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: 001_initial_schema.sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE member_role AS ENUM ('admin', 'member');
CREATE TYPE integration_type AS ENUM ('github', 'slack');
CREATE TYPE pr_status AS ENUM ('open', 'merged', 'closed');
CREATE TYPE retro_status AS ENUM ('planning', 'active', 'voting', 'completed', 'archived');
CREATE TYPE retro_column AS ENUM ('went_well', 'went_poorly', 'ideas', 'action_items');
CREATE TYPE programming_language AS ENUM ('typescript', 'python');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    github_login TEXT NULL,
    github_id TEXT NULL,
    avatar_url TEXT NULL,
    slack_user_id TEXT NULL,
    role member_role DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(org_id, email),
    UNIQUE(github_id) WHERE github_id IS NOT NULL
);

-- Integrations table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    access_token TEXT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(org_id, type)
);

-- Standups table
CREATE TABLE standups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    yesterday TEXT[] DEFAULT '{}',
    today TEXT[] DEFAULT '{}',
    blockers TEXT[] DEFAULT '{}',
    raw_github_data JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, member_id, date)
);

-- PR Insights table
CREATE TABLE pr_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    repo TEXT NOT NULL,
    number INTEGER NOT NULL,
    author_member_id UUID NULL REFERENCES members(id) ON DELETE SET NULL,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    files_changed INTEGER DEFAULT 0,
    tests_changed INTEGER DEFAULT 0,
    touched_paths TEXT[] DEFAULT '{}',
    size_score DECIMAL(3,1) DEFAULT 0.0,
    risk_score DECIMAL(3,1) DEFAULT 0.0,
    suggested_reviewers TEXT[] DEFAULT '{}',
    status pr_status DEFAULT 'open',
    opened_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, repo, number)
);

-- Retros table
CREATE TABLE retros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sprint TEXT NULL,
    status retro_status DEFAULT 'planning',
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retro Notes table
CREATE TABLE retro_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retro_id UUID NOT NULL REFERENCES retros(id) ON DELETE CASCADE,
    author_member_id UUID NULL REFERENCES members(id) ON DELETE SET NULL,
    column_key retro_column NOT NULL,
    text TEXT NOT NULL,
    color TEXT DEFAULT '#fbbf24',
    votes INTEGER DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arcade Levels table
CREATE TABLE arcade_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    language programming_language NOT NULL,
    difficulty difficulty_level NOT NULL,
    starter_code TEXT NOT NULL,
    test_cases TEXT NOT NULL,
    solution TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arcade Runs table
CREATE TABLE arcade_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id UUID NOT NULL REFERENCES arcade_levels(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    submitted_code TEXT NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    duration_ms INTEGER DEFAULT 0,
    points_awarded INTEGER DEFAULT 0,
    test_output TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_members_org_id ON members(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_members_github_id ON members(github_id) WHERE github_id IS NOT NULL;
CREATE INDEX idx_integrations_org_id_type ON integrations(org_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_standups_org_member_date ON standups(org_id, member_id, date);
CREATE INDEX idx_standups_date ON standups(date);
CREATE INDEX idx_pr_insights_org_status ON pr_insights(org_id, status);
CREATE INDEX idx_pr_insights_repo_number ON pr_insights(repo, number);
CREATE INDEX idx_retros_org_status ON retros(org_id, status);
CREATE INDEX idx_retro_notes_retro_id ON retro_notes(retro_id);
CREATE INDEX idx_arcade_runs_member_level ON arcade_runs(member_id, level_id);
CREATE INDEX idx_arcade_runs_level_passed ON arcade_runs(level_id, passed);

-- Add updated_at trigger for pr_insights
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pr_insights_updated_at 
    BEFORE UPDATE ON pr_insights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

INSERT INTO _migrations (filename) VALUES ('001_initial_schema.sql') ON CONFLICT (filename) DO NOTHING;

-- Migration: 002_rls_policies.sql
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

INSERT INTO _migrations (filename) VALUES ('002_rls_policies.sql') ON CONFLICT (filename) DO NOTHING;

-- Migration: 003_job_lock_table.sql
-- Job lock table for preventing duplicate cron job executions
CREATE TABLE job_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name TEXT NOT NULL UNIQUE,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient job lock queries
CREATE INDEX idx_job_locks_name_expires ON job_locks(job_name, expires_at);

-- Function to acquire a job lock
CREATE OR REPLACE FUNCTION acquire_job_lock(
    p_job_name TEXT,
    p_locked_by TEXT,
    p_duration_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $
DECLARE
    lock_expires_at TIMESTAMPTZ;
    existing_lock RECORD;
BEGIN
    lock_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Clean up expired locks first
    DELETE FROM job_locks 
    WHERE job_name = p_job_name AND expires_at < NOW();
    
    -- Check if there's an active lock
    SELECT * INTO existing_lock 
    FROM job_locks 
    WHERE job_name = p_job_name AND expires_at > NOW();
    
    IF existing_lock.id IS NOT NULL THEN
        -- Lock already exists and is not expired
        RETURN FALSE;
    END IF;
    
    -- Acquire the lock
    INSERT INTO job_locks (job_name, locked_by, expires_at)
    VALUES (p_job_name, p_locked_by, lock_expires_at)
    ON CONFLICT (job_name) DO UPDATE SET
        locked_at = NOW(),
        locked_by = p_locked_by,
        expires_at = lock_expires_at;
    
    RETURN TRUE;
END;
$ LANGUAGE plpgsql;

-- Function to release a job lock
CREATE OR REPLACE FUNCTION release_job_lock(
    p_job_name TEXT,
    p_locked_by TEXT
) RETURNS BOOLEAN AS $
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM job_locks 
    WHERE job_name = p_job_name 
    AND locked_by = p_locked_by;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
END;
$ LANGUAGE plpgsql;

-- Function to check if a job is locked
CREATE OR REPLACE FUNCTION is_job_locked(p_job_name TEXT) RETURNS BOOLEAN AS $
BEGIN
    -- Clean up expired locks first
    DELETE FROM job_locks 
    WHERE job_name = p_job_name AND expires_at < NOW();
    
    -- Check if there's an active lock
    RETURN EXISTS (
        SELECT 1 FROM job_locks 
        WHERE job_name = p_job_name AND expires_at > NOW()
    );
END;
$ LANGUAGE plpgsql;

INSERT INTO _migrations (filename) VALUES ('003_job_lock_table.sql') ON CONFLICT (filename) DO NOTHING;

-- Migration: 004_performance_indexes.sql
-- Performance optimization indexes for SprintForge
-- This migration adds indexes to improve query performance

-- Organizations table indexes
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;

-- Members table indexes
CREATE INDEX IF NOT EXISTS idx_members_org_id ON members(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_members_github_id ON members(github_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_members_org_email ON members(org_id, email) WHERE deleted_at IS NULL;

-- Integrations table indexes
CREATE INDEX IF NOT EXISTS idx_integrations_org_type ON integrations(org_id, type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type) WHERE deleted_at IS NULL;

-- Standups table indexes
CREATE INDEX IF NOT EXISTS idx_standups_org_date ON standups(org_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_standups_member_date ON standups(member_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_standups_date ON standups(date DESC);

-- PR Insights table indexes
CREATE INDEX IF NOT EXISTS idx_pr_insights_org_status ON pr_insights(org_id, status);
CREATE INDEX IF NOT EXISTS idx_pr_insights_repo_status ON pr_insights(repo, status);
CREATE INDEX IF NOT EXISTS idx_pr_insights_author_status ON pr_insights(author_member_id, status) WHERE author_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pr_insights_risk_score ON pr_insights(risk_score DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_pr_insights_updated_at ON pr_insights(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_insights_stale ON pr_insights(org_id, status, updated_at) WHERE status = 'open';

-- Retros table indexes
CREATE INDEX IF NOT EXISTS idx_retros_org_status ON retros(org_id, status);
CREATE INDEX IF NOT EXISTS idx_retros_created_by ON retros(created_by);
CREATE INDEX IF NOT EXISTS idx_retros_created_at ON retros(created_at DESC);

-- Retro Notes table indexes
CREATE INDEX IF NOT EXISTS idx_retro_notes_retro_id ON retro_notes(retro_id);
CREATE INDEX IF NOT EXISTS idx_retro_notes_column ON retro_notes(retro_id, column_key);
CREATE INDEX IF NOT EXISTS idx_retro_notes_author ON retro_notes(author_member_id) WHERE author_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_retro_notes_votes ON retro_notes(votes DESC) WHERE votes > 0;

-- Arcade Levels table indexes
CREATE INDEX IF NOT EXISTS idx_arcade_levels_difficulty ON arcade_levels(difficulty);
CREATE INDEX IF NOT EXISTS idx_arcade_levels_language ON arcade_levels(language);
CREATE INDEX IF NOT EXISTS idx_arcade_levels_slug ON arcade_levels(slug);

-- Arcade Runs table indexes
CREATE INDEX IF NOT EXISTS idx_arcade_runs_level_member ON arcade_runs(level_id, member_id);
CREATE INDEX IF NOT EXISTS idx_arcade_runs_member_created ON arcade_runs(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arcade_runs_level_passed ON arcade_runs(level_id, passed, points_awarded DESC) WHERE passed = true;
CREATE INDEX IF NOT EXISTS idx_arcade_runs_leaderboard ON arcade_runs(level_id, points_awarded DESC, duration_ms ASC) WHERE passed = true;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_standups_org_member_date ON standups(org_id, member_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pr_insights_org_repo_status ON pr_insights(org_id, repo, status);
CREATE INDEX IF NOT EXISTS idx_retro_notes_retro_column_votes ON retro_notes(retro_id, column_key, votes DESC);

-- Partial indexes for performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_pr_insights_open_high_risk ON pr_insights(org_id, risk_score DESC) 
  WHERE status = 'open' AND risk_score >= 7;

CREATE INDEX IF NOT EXISTS idx_pr_insights_stale_open ON pr_insights(org_id, updated_at ASC) 
  WHERE status = 'open' AND updated_at < NOW() - INTERVAL '2 days';

-- Add comments for documentation
COMMENT ON INDEX idx_organizations_deleted_at IS 'Optimize queries for active organizations';
COMMENT ON INDEX idx_members_org_email IS 'Optimize member lookup by organization and email';
COMMENT ON INDEX idx_standups_org_member_date IS 'Optimize standup queries by org, member, and date';
COMMENT ON INDEX idx_pr_insights_stale_open IS 'Optimize stale PR detection queries';
COMMENT ON INDEX idx_arcade_runs_leaderboard IS 'Optimize leaderboard queries with points and duration';

-- Analyze tables to update statistics
ANALYZE organizations;
ANALYZE members;
ANALYZE integrations;
ANALYZE standups;
ANALYZE pr_insights;
ANALYZE retros;
ANALYZE retro_notes;
ANALYZE arcade_levels;
ANALYZE arcade_runs;

INSERT INTO _migrations (filename) VALUES ('004_performance_indexes.sql') ON CONFLICT (filename) DO NOTHING;


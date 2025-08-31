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
    UNIQUE(org_id, email)
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
-- Create unique index for github_id (partial unique constraint)
CREATE UNIQUE INDEX idx_members_github_id_unique ON members(github_id) WHERE github_id IS NOT NULL;
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
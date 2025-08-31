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
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
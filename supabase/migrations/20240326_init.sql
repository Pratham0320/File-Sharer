-- Create the files table
CREATE TABLE files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    public_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    downloaded_count INT DEFAULT 0
);

-- Create an index on expires_at for faster queries
CREATE INDEX idx_files_expires_at ON files(expires_at);

-- Create a function to delete expired files
CREATE OR REPLACE FUNCTION delete_expired_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM files WHERE expires_at < NOW();
END;
$$;

-- Create a cron job to run every minute
SELECT cron.schedule(
    'delete-expired-files',
    '* * * * *', -- every minute
    'SELECT delete_expired_files()'
);

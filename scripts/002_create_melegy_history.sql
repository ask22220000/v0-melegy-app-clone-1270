-- Create Melegy History table for storing chat histories per IP address

CREATE TABLE IF NOT EXISTS melegy_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ip TEXT NOT NULL,
    chat_title TEXT NOT NULL,
    chat_date TEXT NOT NULL,
    messages JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster IP lookups
CREATE INDEX IF NOT EXISTS idx_melegy_history_user_ip ON melegy_history(user_ip);
CREATE INDEX IF NOT EXISTS idx_melegy_history_created_at ON melegy_history(created_at DESC);

-- Learning System Tables for Melegy AI
-- Stores corrections, feedback, and learned patterns

-- Table for storing user corrections and feedback
CREATE TABLE IF NOT EXISTS learning_corrections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  original_question TEXT NOT NULL,
  original_answer TEXT NOT NULL,
  corrected_answer TEXT,
  correction_type TEXT NOT NULL CHECK (correction_type IN ('wrong_info', 'incomplete', 'tone', 'language', 'other')),
  user_feedback TEXT,
  context JSONB DEFAULT '{}',
  learned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing learned patterns
CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_key TEXT NOT NULL UNIQUE,
  trigger_phrases TEXT[] NOT NULL,
  correct_response TEXT NOT NULL,
  response_context TEXT,
  usage_count INTEGER DEFAULT 1,
  success_rate FLOAT DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'user_correction',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking response quality
CREATE TABLE IF NOT EXISTS response_quality (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_helpful BOOLEAN,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for common mistakes to avoid
CREATE TABLE IF NOT EXISTS common_mistakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mistake_pattern TEXT NOT NULL,
  correct_pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_corrections_session ON learning_corrections(session_id);
CREATE INDEX IF NOT EXISTS idx_corrections_type ON learning_corrections(correction_type);
CREATE INDEX IF NOT EXISTS idx_patterns_key ON learned_patterns(pattern_key);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON learned_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_quality_rating ON response_quality(rating);

-- Enable RLS
ALTER TABLE learning_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_mistakes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for the AI to learn)
CREATE POLICY "Allow all operations on learning_corrections" ON learning_corrections FOR ALL USING (true);
CREATE POLICY "Allow all operations on learned_patterns" ON learned_patterns FOR ALL USING (true);
CREATE POLICY "Allow all operations on response_quality" ON response_quality FOR ALL USING (true);
CREATE POLICY "Allow all operations on common_mistakes" ON common_mistakes FOR ALL USING (true);

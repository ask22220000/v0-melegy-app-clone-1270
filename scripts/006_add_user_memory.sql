-- جدول لذاكرة المستخدمين - ميليجي يفتكر المستخدمين
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  user_name TEXT,
  interests JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  conversation_topics JSONB DEFAULT '[]',
  emotional_history JSONB DEFAULT '[]',
  last_mood TEXT,
  total_conversations INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_user_memory_visitor ON user_memory(visitor_id);

-- جدول لتتبع المشاعر في المحادثات
CREATE TABLE IF NOT EXISTS conversation_emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  message TEXT,
  detected_emotion TEXT,
  emotion_score NUMERIC,
  melegy_response_style TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_emotions_visitor ON conversation_emotions(visitor_id);

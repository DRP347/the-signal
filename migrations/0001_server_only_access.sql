-- Backend-only tables. Supabase anon/authenticated roles have no policies.
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ADD CONSTRAINT positive_source_interval CHECK (interval_minutes > 0);
ALTER TABLE sources ADD CONSTRAINT valid_source_weight CHECK (credibility BETWEEN 1 AND 5);
ALTER TABLE stories ADD CONSTRAINT valid_source_count CHECK (source_count >= 0);
ALTER TABLE service_incidents ADD CONSTRAINT valid_incident_status CHECK (status IN ('investigating','identified','monitoring','resolved','unknown'));

-- Create search analytics table for tracking search queries and metrics
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_term VARCHAR(255) NOT NULL,
    search_count INTEGER NOT NULL DEFAULT 1,
    last_searched TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure search terms are unique (case-insensitive)
    CONSTRAINT unique_search_term UNIQUE (LOWER(search_term))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_search_term ON search_analytics (LOWER(search_term));
CREATE INDEX IF NOT EXISTS idx_search_analytics_search_count ON search_analytics (search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_last_searched ON search_analytics (last_searched DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics (created_at DESC);

-- Create a partial index for popular searches (search_count > 1)
CREATE INDEX IF NOT EXISTS idx_search_analytics_popular ON search_analytics (search_count DESC, last_searched DESC)
WHERE search_count > 1;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_search_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_search_analytics_updated_at
    BEFORE UPDATE ON search_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_search_analytics_updated_at();

-- Insert some initial popular search terms (optional)
INSERT INTO search_analytics (search_term, search_count, last_searched, created_at, updated_at) VALUES
('bruiloft boeket', 15, NOW() - INTERVAL '1 day', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
('rode rozen', 12, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours'),
('verjaardag bloemen', 8, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 hours'),
('witte lelies', 6, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('boeket groot', 5, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 hours')
ON CONFLICT (LOWER(search_term)) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE search_analytics IS 'Tracks search queries and their frequency for analytics and suggestions';
COMMENT ON COLUMN search_analytics.search_term IS 'The normalized search term';
COMMENT ON COLUMN search_analytics.search_count IS 'Number of times this term has been searched';
COMMENT ON COLUMN search_analytics.last_searched IS 'When this term was last searched';
COMMENT ON COLUMN search_analytics.created_at IS 'When this search term was first recorded';
COMMENT ON COLUMN search_analytics.updated_at IS 'When this record was last updated';

-- Add missing index on assets.current_branch_id (used in findByCurrentBranchId and getFiltered)
CREATE INDEX IF NOT EXISTS idx_assets_current_branch ON assets(current_branch_id);

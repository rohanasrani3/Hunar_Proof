-- Apply only on Supabase. The server connects as a privileged database role.
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON accounts,forms,works,commissions,proposals,login_limits FROM anon,authenticated;
INSERT INTO storage.buckets (id,name,public) VALUES ('kareghar','kareghar',false) ON CONFLICT DO NOTHING;

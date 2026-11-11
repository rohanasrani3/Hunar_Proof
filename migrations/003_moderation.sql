BEGIN;
CREATE TABLE admin_grants (account text PRIMARY KEY REFERENCES accounts(id));
CREATE TABLE moderation_events (
 sequence integer PRIMARY KEY, target text NOT NULL REFERENCES accounts(id),
 actor text NOT NULL REFERENCES accounts(id), suspended integer NOT NULL CHECK(suspended IN (0,1)),
 reason text NOT NULL, created bigint NOT NULL, CHECK(actor <> target)
);
CREATE INDEX moderation_target ON moderation_events(target,sequence DESC);
CREATE VIEW account_state AS
 SELECT a.*, CASE WHEN g.account IS NULL THEN a.role ELSE 'admin' END AS effective_role,
 COALESCE(e.suspended,0) AS suspended, a.revision+COALESCE(e.sequence,0) AS session_version
 FROM accounts a LEFT JOIN admin_grants g ON g.account=a.id
 LEFT JOIN moderation_events e ON e.sequence=(SELECT MAX(m.sequence) FROM moderation_events m WHERE m.target=a.id);
CREATE VIEW commission_state AS
 SELECT c.*, CASE WHEN owner.suspended=1 OR artist.suspended=1 THEN 1 ELSE 0 END AS paused
 FROM commissions c JOIN account_state owner ON owner.id=c.customer LEFT JOIN account_state artist ON artist.id=c.artist;
-- PostgreSQL privileges
ALTER TABLE admin_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON admin_grants,moderation_events,account_state,commission_state FROM PUBLIC,anon,authenticated;
COMMIT;

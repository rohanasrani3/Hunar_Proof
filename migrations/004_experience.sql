BEGIN;
ALTER TABLE accounts ADD COLUMN bio text NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN contact text NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN deleted integer NOT NULL DEFAULT 0 CHECK(deleted IN (0,1));
ALTER TABLE commissions ADD COLUMN output_type text NOT NULL DEFAULT 'other' CHECK(output_type IN ('audio','video','live','physical','image','other'));
ALTER TABLE commissions ADD COLUMN reference text NOT NULL DEFAULT '';
ALTER TABLE commissions ADD COLUMN original_fee integer NOT NULL DEFAULT 0;
ALTER TABLE commissions ADD COLUMN updated bigint NOT NULL DEFAULT 0;
ALTER TABLE commissions ADD COLUMN selected_at bigint NOT NULL DEFAULT 0;
ALTER TABLE commissions ADD COLUMN submitted_at bigint NOT NULL DEFAULT 0;
ALTER TABLE commissions ADD COLUMN accepted_at bigint NOT NULL DEFAULT 0;
UPDATE commissions SET original_fee=fee,updated=created;
ALTER TABLE proposals ADD COLUMN quote integer NOT NULL DEFAULT 0;
ALTER TABLE proposals ADD COLUMN initial_quote integer NOT NULL DEFAULT 0;
ALTER TABLE proposals ADD COLUMN pricing text NOT NULL DEFAULT 'offered' CHECK(pricing IN ('offered','quote'));
ALTER TABLE proposals ADD COLUMN created bigint NOT NULL DEFAULT 0;
ALTER TABLE proposals ADD COLUMN updated bigint NOT NULL DEFAULT 0;
ALTER TABLE proposals ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled'));
UPDATE proposals SET quote=(SELECT fee FROM commissions WHERE id=proposals.commission),initial_quote=(SELECT fee FROM commissions WHERE id=proposals.commission);
CREATE TABLE commission_events (
 id text PRIMARY KEY, commission text NOT NULL REFERENCES commissions(id), actor text NOT NULL REFERENCES accounts(id),
 artist text NOT NULL DEFAULT '', kind text NOT NULL, detail text NOT NULL DEFAULT '', created bigint NOT NULL,
 quote integer, output text NOT NULL DEFAULT ''
);
CREATE INDEX commission_event_time ON commission_events(commission,created);
CREATE TABLE messages (
 id text PRIMARY KEY, commission text NOT NULL REFERENCES commissions(id), sender text NOT NULL REFERENCES accounts(id),
 artist text NOT NULL REFERENCES accounts(id), body text NOT NULL, created bigint NOT NULL
);
CREATE INDEX message_thread_time ON messages(commission,artist,created);
CREATE TABLE history_reads (
 account text NOT NULL REFERENCES accounts(id), commission text NOT NULL REFERENCES commissions(id),
 last_seen bigint NOT NULL DEFAULT 0, PRIMARY KEY(account,commission)
);
DROP VIEW commission_state;
DROP VIEW account_state;
CREATE VIEW account_state AS
 SELECT a.*, CASE WHEN g.account IS NULL THEN a.role ELSE 'admin' END AS effective_role,
 CASE WHEN a.deleted=1 THEN 1 ELSE COALESCE(e.suspended,0) END AS suspended,
 a.revision+COALESCE(e.sequence,0) AS session_version
 FROM accounts a LEFT JOIN admin_grants g ON g.account=a.id
 LEFT JOIN moderation_events e ON e.sequence=(SELECT MAX(m.sequence) FROM moderation_events m WHERE m.target=a.id);
CREATE VIEW commission_state AS
 SELECT c.*, CASE WHEN owner.suspended=1 OR artist.suspended=1 THEN 1 ELSE 0 END AS paused
 FROM commissions c JOIN account_state owner ON owner.id=c.customer LEFT JOIN account_state artist ON artist.id=c.artist;
-- PostgreSQL privileges
ALTER TABLE commission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON commission_events,messages,history_reads,account_state,commission_state FROM PUBLIC,anon,authenticated;
COMMIT;

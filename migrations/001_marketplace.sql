CREATE TABLE IF NOT EXISTS accounts (
 id text PRIMARY KEY, username text NOT NULL UNIQUE, email text NOT NULL UNIQUE,
 name text NOT NULL, role text NOT NULL CHECK(role IN ('artist','customer')),
 password_hash text NOT NULL, revision integer NOT NULL DEFAULT 0,
 company text NOT NULL DEFAULT '', links text NOT NULL DEFAULT '[]', photo text NOT NULL DEFAULT '',
 sample integer NOT NULL DEFAULT 0 CHECK(sample IN (0,1))
);
CREATE TABLE IF NOT EXISTS forms (
 id text PRIMARY KEY, category text NOT NULL CHECK(category IN ('painting','music','dance','craft')),
 name text NOT NULL, hi text NOT NULL, UNIQUE(category,name)
);
CREATE TABLE IF NOT EXISTS works (
 id text PRIMARY KEY, artist text NOT NULL REFERENCES accounts(id),
 form text NOT NULL REFERENCES forms(id), title text NOT NULL, url text NOT NULL
);
CREATE TABLE IF NOT EXISTS commissions (
 id text PRIMARY KEY, customer text NOT NULL REFERENCES accounts(id), form text NOT NULL REFERENCES forms(id),
 title text NOT NULL, brief text NOT NULL, fee integer NOT NULL CHECK(fee >= 0),
 status text NOT NULL DEFAULT 'finding' CHECK(status IN ('finding','progress','done')),
 artist text REFERENCES accounts(id), output text NOT NULL DEFAULT '',
 published integer NOT NULL DEFAULT 0, sample integer NOT NULL DEFAULT 0, created bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS proposals (
 id text PRIMARY KEY, commission text NOT NULL REFERENCES commissions(id),
 artist text NOT NULL REFERENCES accounts(id), message text NOT NULL, UNIQUE(commission,artist)
);
CREATE TABLE IF NOT EXISTS login_limits (username text PRIMARY KEY, attempts integer NOT NULL, started bigint NOT NULL);
CREATE INDEX IF NOT EXISTS commission_artist_status ON commissions(artist,status,form);
CREATE INDEX IF NOT EXISTS work_artist_form ON works(artist,form);

-- Up Migration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE folders (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(255) NOT NULL,
	parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
	path TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX folders_parent_name_unique
	ON folders (parent_id, name) NULLS NOT DISTINCT;

CREATE UNIQUE INDEX folders_path_unique ON folders (path);

CREATE INDEX folders_name_idx ON folders (name);

CREATE TABLE files (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(255) NOT NULL,
	folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX files_folder_name_unique
	ON files (folder_id, name) NULLS NOT DISTINCT;

CREATE INDEX files_name_idx ON files (name);

CREATE INDEX files_name_prefix_idx ON files (name text_pattern_ops);

CREATE FUNCTION set_folder_path() RETURNS TRIGGER AS $$
DECLARE
	parent_path TEXT;
BEGIN
	IF NEW.parent_id IS NULL THEN
		NEW.path := NEW.name;
	ELSE
		SELECT path INTO parent_path FROM folders WHERE id = NEW.parent_id;

		IF parent_path IS NULL THEN
			RAISE EXCEPTION 'Parent folder path is not set';
		END IF;

		NEW.path := parent_path || '/' || NEW.name;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION cascade_folder_path_update() RETURNS TRIGGER AS $$
BEGIN
	IF OLD.path IS DISTINCT FROM NEW.path THEN
		UPDATE folders
		SET path = NEW.path || SUBSTRING(path FROM LENGTH(OLD.path) + 1)
		WHERE path LIKE OLD.path || '/%';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER folders_set_path
	BEFORE INSERT OR UPDATE OF name, parent_id ON folders
	FOR EACH ROW EXECUTE FUNCTION set_folder_path();

CREATE TRIGGER folders_cascade_path
	AFTER UPDATE OF name, parent_id ON folders
	FOR EACH ROW EXECUTE FUNCTION cascade_folder_path_update();

-- Down Migration

DROP TRIGGER IF EXISTS folders_cascade_path ON folders;

DROP TRIGGER IF EXISTS folders_set_path ON folders;

DROP FUNCTION IF EXISTS cascade_folder_path_update();

DROP FUNCTION IF EXISTS set_folder_path();

DROP TABLE IF EXISTS files;

DROP TABLE IF EXISTS folders;

-- Up Migration

-- Names are also validated at the HTTP boundary. These CHECKs keep the
-- denormalized folder path sound even if a client skips the API.
ALTER TABLE folders
	ADD CONSTRAINT folders_name_format
	CHECK (char_length(name) BETWEEN 1 AND 255 AND name !~ '[/\\]');

ALTER TABLE files
	ADD CONSTRAINT files_name_format
	CHECK (char_length(name) BETWEEN 1 AND 255 AND name !~ '[/\\]');

-- LIKE treats % and _ as wildcards, so a folder named "a%" would cascade
-- incorrectly. starts_with is a literal prefix match.
CREATE OR REPLACE FUNCTION cascade_folder_path_update() RETURNS TRIGGER AS $$
BEGIN
	IF OLD.path IS DISTINCT FROM NEW.path THEN
		UPDATE folders
		SET path = NEW.path || SUBSTRING(path FROM LENGTH(OLD.path) + 1)
		WHERE starts_with(path, OLD.path || '/');
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Down Migration

ALTER TABLE files DROP CONSTRAINT IF EXISTS files_name_format;

ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_name_format;

CREATE OR REPLACE FUNCTION cascade_folder_path_update() RETURNS TRIGGER AS $$
BEGIN
	IF OLD.path IS DISTINCT FROM NEW.path THEN
		UPDATE folders
		SET path = NEW.path || SUBSTRING(path FROM LENGTH(OLD.path) + 1)
		WHERE path LIKE OLD.path || '/%';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

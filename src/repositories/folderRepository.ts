import { PoolClient } from 'pg';

import { getPool } from '@/database';
import { File } from '@/repositories/fileRepository';
import { handleRepositoryError } from '@/repositories/handleRepositoryError';

export interface Folder {
	id: string;
	name: string;
	parentId: string | null;
	path: string;
}

export interface FolderWithChildren {
	folder: Folder;
	subfolders: Folder[];
	files: File[];
}

interface FolderRow {
	id: string;
	name: string;
	parent_id: string | null;
	path: string;
}

const mapFolder = (row: FolderRow): Folder => ({
	id: row.id,
	name: row.name,
	parentId: row.parent_id,
	path: row.path,
});

export const createFolder = async ({ name, parentId }: { name: string; parentId?: string }): Promise<Folder> => {
	try {
		const result = await getPool().query<FolderRow>(
			`INSERT INTO folders (name, parent_id)
			 VALUES ($1, $2)
			 RETURNING id, name, parent_id, path`,
			[ name, parentId ?? null ],
		);

		const row = result.rows[0];

		if (!row) {
			throw new Error('Insert did not return a folder');
		}

		return mapFolder(row);
	} catch (err) {
		return handleRepositoryError(err, {
			duplicate: 'A folder with this name already exists in the parent folder',
			missingParent: 'Parent folder not found',
		});
	}
};

export const getFolderByPath = async (folderPath: string): Promise<Folder | null> => {
	const result = await getPool().query<FolderRow>(
		`SELECT id, name, parent_id, path
		 FROM folders
		 WHERE path = $1`,
		[ folderPath ],
	);

	const row = result.rows[0];

	if (!row) {
		return null;
	}

	return mapFolder(row);
};

export const getFolderById = async (folderId: string): Promise<Folder | null> => {
	const result = await getPool().query<FolderRow>(
		`SELECT id, name, parent_id, path
		 FROM folders
		 WHERE id = $1`,
		[ folderId ],
	);

	const row = result.rows[0];

	if (!row) {
		return null;
	}

	return mapFolder(row);
};

export const listRootFolders = async (): Promise<Folder[]> => {
	const result = await getPool().query<FolderRow>(
		`SELECT id, name, parent_id, path
		 FROM folders
		 WHERE parent_id IS NULL
		 ORDER BY name`,
	);

	return result.rows.map(mapFolder);
};

export const getFolderWithChildren = async (folderId: string): Promise<FolderWithChildren | null> => {
	const client: PoolClient = await getPool().connect();

	try {
		await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');

		const folderResult = await client.query<FolderRow>(
			`SELECT id, name, parent_id, path
			 FROM folders
			 WHERE id = $1`,
			[ folderId ],
		);

		const folderRow = folderResult.rows[0];

		if (!folderRow) {
			await client.query('COMMIT');

			return null;
		}

		const subfoldersResult = await client.query<FolderRow>(
			`SELECT id, name, parent_id, path
			 FROM folders
			 WHERE parent_id = $1
			 ORDER BY name`,
			[ folderId ],
		);

		const filesResult = await client.query<{ id: string; name: string; folder_id: string }>(
			`SELECT id, name, folder_id
			 FROM files
			 WHERE folder_id = $1
			 ORDER BY name`,
			[ folderId ],
		);

		await client.query('COMMIT');

		return {
			folder: mapFolder(folderRow),
			subfolders: subfoldersResult.rows.map(mapFolder),
			files: filesResult.rows.map(row => ({
				id: row.id,
				name: row.name,
				folderId: row.folder_id,
			})),
		};
	} catch (err) {
		await client.query('ROLLBACK');

		throw err;
	} finally {
		client.release();
	}
};

export const deleteFolder = async (folderId: string): Promise<boolean> => {
	const result = await getPool().query(
		`DELETE FROM folders
		 WHERE id = $1`,
		[ folderId ],
	);

	return (result.rowCount ?? 0) > 0;
};

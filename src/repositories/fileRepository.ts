import { getPool } from '@/database';
import { handleRepositoryError } from '@/repositories/handleRepositoryError';

export interface File {
	id: string;
	name: string;
	folderId: string | null;
}

export interface FileSearchResult extends File {
	folderPath: string;
}

interface FileRow {
	id: string;
	name: string;
	folder_id: string | null;
}

interface FileSearchRow extends FileRow {
	folder_path: string;
	total_count: string;
}

export interface PrefixSearchResult {
	files: FileSearchResult[];
	totalCount: number;
}

export type PrefixSearchFilter =
	| { scope: 'global' }
	| { scope: 'folder'; folderId: string | null };

const mapFile = (row: FileRow): File => ({
	id: row.id,
	name: row.name,
	folderId: row.folder_id,
});

export const createFile = async ({ name, folderId }: { name: string; folderId?: string }): Promise<File> => {
	try {
		const result = await getPool().query<FileRow>(
			`INSERT INTO files (name, folder_id)
			 VALUES ($1, $2)
			 RETURNING id, name, folder_id`,
			[ name, folderId ?? null ],
		);

		const row = result.rows[0];

		if (!row) {
			throw new Error('Insert did not return a file');
		}

		return mapFile(row);
	} catch (err) {
		return handleRepositoryError(err, {
			duplicate: 'A file with this name already exists in the folder',
			missingParent: 'Folder not found',
		});
	}
};

export const getFileById = async (fileId: string): Promise<File | null> => {
	const result = await getPool().query<FileRow>(
		`SELECT id, name, folder_id
		 FROM files
		 WHERE id = $1`,
		[ fileId ],
	);

	const row = result.rows[0];

	if (!row) {
		return null;
	}

	return mapFile(row);
};

export const deleteFile = async (fileId: string): Promise<boolean> => {
	const result = await getPool().query(
		`DELETE FROM files
		 WHERE id = $1`,
		[ fileId ],
	);

	return (result.rowCount ?? 0) > 0;
};

export const listRootFiles = async (): Promise<File[]> => {
	const result = await getPool().query<FileRow>(
		`SELECT id, name, folder_id
		 FROM files
		 WHERE folder_id IS NULL
		 ORDER BY name`,
	);

	return result.rows.map(mapFile);
};

export const searchByExactNameInFolder = async (
	folderId: string,
	name: string,
): Promise<File[]> => {
	const result = await getPool().query<FileRow>(
		`SELECT id, name, folder_id
		 FROM files
		 WHERE folder_id = $1 AND name = $2
		 ORDER BY name`,
		[ folderId, name ],
	);

	return result.rows.map(mapFile);
};

export const searchByExactNameGlobal = async (name: string): Promise<File[]> => {
	const result = await getPool().query<FileRow>(
		`SELECT id, name, folder_id
		 FROM files
		 WHERE name = $1
		 ORDER BY name`,
		[ name ],
	);

	return result.rows.map(mapFile);
};

export const searchByPrefix = async (
	prefix: string,
	limit: number,
	filter: PrefixSearchFilter = { scope: 'global' },
): Promise<PrefixSearchResult> => {
	const params: Array<string | number> = [
		`${prefix.replace(/[%_\\]/g, '\\$&')}%`,
		limit,
	];
	let folderClause = '';

	if (filter.scope === 'folder') {
		if (filter.folderId === null) {
			folderClause = ' AND f.folder_id IS NULL';
		} else {
			folderClause = ' AND f.folder_id = $3';
			params.push(filter.folderId);
		}
	}

	const result = await getPool().query<FileSearchRow>(
		`SELECT f.id, f.name, f.folder_id, COALESCE(fo.path, '') AS folder_path,
		        COUNT(*) OVER() AS total_count
		 FROM files f
		 LEFT JOIN folders fo ON f.folder_id = fo.id
		 WHERE f.name LIKE $1 ESCAPE '\\'
		 ${folderClause}
		 ORDER BY f.name
		 LIMIT $2`,
		params,
	);

	const firstRow = result.rows[0];
	const totalCount = firstRow ? Number(firstRow.total_count) : 0;

	return {
		files: result.rows.map(row => ({
			id: row.id,
			name: row.name,
			folderId: row.folder_id,
			folderPath: row.folder_path,
		})),
		totalCount,
	};
};

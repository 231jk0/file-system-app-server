import { AppError } from '@/errors/AppError';
import { File } from '@/repositories/fileRepository';
import * as fileRepository from '@/repositories/fileRepository';
import * as folderRepository from '@/repositories/folderRepository';
import { Folder } from '@/repositories/folderRepository';
import { nameSchema } from '@/utils/validation';

export interface BrowseContents {
	path: string;
	folder: Folder | null;
	subfolders: Folder[];
	files: File[];
}

const parsePathSegments = (path?: string): string[] => {
	if (!path || path.trim() === '' || path.trim() === '/') {
		return [];
	}

	return path.split('/').filter(Boolean);
};

export const createFolder = async ({ name, parentId }: { name: string; parentId?: string }): Promise<Folder> => {
	if (parentId) {
		const parent = await folderRepository.getFolderById(parentId);

		if (!parent) {
			throw new AppError(404, 'Parent folder not found');
		}
	}

	return folderRepository.createFolder({
		name,
		parentId,
	});
};

export const getContentsByPath = async (path?: string): Promise<BrowseContents> => {
	const segments = parsePathSegments(path);

	for (const segment of segments) {
		const validation = nameSchema.safeParse(segment);

		if (!validation.success) {
			throw new AppError(400, 'Invalid path segment');
		}
	}

	if (segments.length === 0) {
		const [ subfolders, files ] = await Promise.all([
			folderRepository.listRootFolders(),
			fileRepository.listRootFiles(),
		]);

		return {
			path: '/',
			folder: null,
			subfolders,
			files,
		};
	}

	const normalizedPath = segments.join('/');
	const folder = await folderRepository.getFolderByPath(normalizedPath);

	if (!folder) {
		throw new AppError(404, `Folder not found at path /${normalizedPath}`);
	}

	const contents = await folderRepository.getFolderWithChildren(folder.id);

	if (!contents) {
		throw new AppError(404, `Folder not found at path /${normalizedPath}`);
	}

	return {
		path: `/${normalizedPath}`,
		folder: contents.folder,
		subfolders: contents.subfolders,
		files: contents.files,
	};
};

export const deleteFolder = async (folderId: string): Promise<void> => {
	const deleted = await folderRepository.deleteFolder(folderId);

	if (!deleted) {
		throw new AppError(404, 'Folder not found');
	}
};

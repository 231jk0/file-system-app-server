import { AppError } from '@/errors/AppError';
import * as fileRepository from '@/repositories/fileRepository';
import { File, PrefixSearchResult } from '@/repositories/fileRepository';
import * as folderRepository from '@/repositories/folderRepository';

const PREFIX_SEARCH_LIMIT = 10;

export const createFile = async ({ name, folderId }: { name: string; folderId?: string }): Promise<File> => {
	if (folderId) {
		const folder = await folderRepository.getFolderById(folderId);

		if (!folder) {
			throw new AppError(404, 'Folder not found');
		}
	}

	return fileRepository.createFile({
		name,
		folderId: folderId ?? null,
	});
};

export const getFileById = async (fileId: string): Promise<File> => {
	const file = await fileRepository.getFileById(fileId);

	if (!file) {
		throw new AppError(404, 'File not found');
	}

	return file;
};

export const deleteFile = async (fileId: string): Promise<void> => {
	const deleted = await fileRepository.deleteFile(fileId);

	if (!deleted) {
		throw new AppError(404, 'File not found');
	}
};

export const searchByExactNameInFolder = async (folderId: string, name: string): Promise<File[]> => {
	const folder = await folderRepository.getFolderById(folderId);

	if (!folder) {
		throw new AppError(404, 'Folder not found');
	}

	return fileRepository.searchByExactNameInFolder(folderId, name);
};

export const searchByExactNameGlobal = async (name: string): Promise<File[]> => {
	return fileRepository.searchByExactNameGlobal(name);
};

export const searchByPrefix = async (prefix: string): Promise<PrefixSearchResult> => {
	return fileRepository.searchByPrefix(prefix, PREFIX_SEARCH_LIMIT);
};

export const searchByPrefixInFolder = async (
	folderId: string | null,
	prefix: string,
): Promise<PrefixSearchResult> => {
	if (folderId !== null) {
		const folder = await folderRepository.getFolderById(folderId);

		if (!folder) {
			throw new AppError(404, 'Folder not found');
		}
	}

	return fileRepository.searchByPrefix(prefix, PREFIX_SEARCH_LIMIT, {
		scope: 'folder',
		folderId,
	});
};

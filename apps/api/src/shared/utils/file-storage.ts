import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

// Base upload directory
const UPLOAD_BASE = path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(UPLOAD_BASE, 'temp');
const PERMANENT_DIR = path.join(UPLOAD_BASE, 'permanent');

/**
 * Ensure upload directories exist
 */
export async function ensureUploadDirectories() {
    try {
        await mkdir(UPLOAD_BASE, { recursive: true });
        await mkdir(TEMP_DIR, { recursive: true });
        await mkdir(PERMANENT_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating upload directories:', error);
    }
}

/**
 * Create client folder structure
 * Structure: permanent/ClientName/DocumentType/
 */
export async function createClientFolder(
    clientName: string,
    documentType: string
): Promise<string> {
    // Sanitize client name for folder name
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const folderPath = path.join(PERMANENT_DIR, sanitizedClientName, documentType);

    try {
        await mkdir(folderPath, { recursive: true });
        return folderPath;
    } catch (error) {
        console.error('Error creating client folder:', error);
        throw new Error('Failed to create client folder');
    }
}

/**
 * Get temp file path for draft upload
 */
export function getTempFilePath(userId: string, documentId: string, filename: string): string {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return path.join(TEMP_DIR, userId, documentId, sanitizedFilename);
}

/**
 * Get permanent file path
 */
export function getPermanentFilePath(
    clientName: string,
    documentType: string,
    filename: string
): string {
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return path.join(PERMANENT_DIR, sanitizedClientName, documentType, sanitizedFilename);
}

/**
 * Get folder path for database storage
 */
export function getFolderPath(clientName: string, documentType: string): string {
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${sanitizedClientName}/${documentType}/`;
}

/**
 * Move file from temp to permanent storage
 */
export async function moveFromTempToPermanent(
    tempPath: string,
    permanentPath: string
): Promise<void> {
    try {
        // Ensure the permanent directory exists
        const permanentDir = path.dirname(permanentPath);
        await mkdir(permanentDir, { recursive: true });

        // Move the file
        await rename(tempPath, permanentPath);

        // Clean up empty temp directories
        await cleanupTempDirectory(path.dirname(tempPath));
    } catch (error) {
        console.error('Error moving file from temp to permanent:', error);
        throw new Error('Failed to move file to permanent storage');
    }
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
    try {
        await access(filePath, fs.constants.F_OK);
        await unlink(filePath);
    } catch (error) {
        // File doesn't exist or already deleted
        console.warn('File not found or already deleted:', filePath);
    }
}

/**
 * Clean up empty temp directories
 */
async function cleanupTempDirectory(dirPath: string): Promise<void> {
    try {
        const files = await promisify(fs.readdir)(dirPath);
        if (files.length === 0) {
            await promisify(fs.rmdir)(dirPath);

            // Recursively clean up parent if empty
            const parentDir = path.dirname(dirPath);
            if (parentDir !== TEMP_DIR) {
                await cleanupTempDirectory(parentDir);
            }
        }
    } catch (error) {
        // Ignore errors in cleanup
    }
}

/**
 * Clean up old draft files (older than 24 hours)
 */
export async function cleanupOldDrafts(): Promise<void> {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    async function cleanDirectory(dir: string) {
        try {
            const entries = await promisify(fs.readdir)(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await cleanDirectory(fullPath);
                } else {
                    const stats = await promisify(fs.stat)(fullPath);
                    if (stats.mtimeMs < oneDayAgo) {
                        await unlink(fullPath);
                        console.log('Cleaned up old draft:', fullPath);
                    }
                }
            }
        } catch (error) {
            console.error('Error cleaning directory:', error);
        }
    }

    await cleanDirectory(TEMP_DIR);
}

/**
 * Get file size
 */
export async function getFileSize(filePath: string): Promise<number> {
    try {
        const stats = await promisify(fs.stat)(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

// Initialize directories on module load
ensureUploadDirectories();

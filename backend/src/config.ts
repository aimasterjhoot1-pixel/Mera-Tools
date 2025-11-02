export const TMP_DIR = process.env.TMP_DIR || './tmp';
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10); // 50MB
export const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL || '7200000', 10); // 2 hours


import fs from 'fs';
import path from 'path';
import { TMP_DIR, CLEANUP_INTERVAL } from '../config';

interface FileMetadata {
  fileId: string;
  uploadedAt: string;
  filePath: string;
}

class CleanupService {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Clean up files older than 2 hours
   */
  private cleanup(): void {
    if (!fs.existsSync(TMP_DIR)) {
      return;
    }

    const files = fs.readdirSync(TMP_DIR);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(TMP_DIR, file);

      try {
        // Check if it's a metadata file
        if (file.endsWith('.meta.json')) {
          const metadata: FileMetadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const uploadedAt = new Date(metadata.uploadedAt).getTime();
          const age = now - uploadedAt;

          // Delete if older than 2 hours
          if (age > CLEANUP_INTERVAL) {
            // Delete metadata file
            fs.unlinkSync(filePath);

            // Delete actual file if it exists
            if (metadata.filePath && fs.existsSync(metadata.filePath)) {
              fs.unlinkSync(metadata.filePath);
            }

            deletedCount++;
          }
        } else {
          // Check regular files (no metadata)
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;

          if (age > CLEANUP_INTERVAL) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    });

    if (deletedCount > 0) {
      console.log(`Cleanup: Deleted ${deletedCount} file(s)`);
    }
  }

  /**
   * Start the cleanup service
   */
  start(intervalMs: number = CLEANUP_INTERVAL): void {
    if (this.intervalId) {
      this.stop();
    }

    // Run cleanup immediately
    this.cleanup();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, Math.min(intervalMs, 3600000)); // Run at least every hour

    console.log(`Cleanup service started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const cleanupService = new CleanupService();
export default cleanupService;


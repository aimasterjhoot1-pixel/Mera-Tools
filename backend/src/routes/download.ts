import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { TMP_DIR } from '../config';

const router = express.Router();

/**
 * GET /api/download/:fileId
 * Download a file by fileId
 */
router.get('/:fileId', (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const metadataPath = path.join(TMP_DIR, `${fileId}.meta.json`);

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const filePath = metadata.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', metadata.mimetype || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(metadata.originalName)}"`
    );

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Optionally delete after download (uncomment if desired)
    // fileStream.on('end', () => {
    //   fs.unlinkSync(filePath);
    //   if (fs.existsSync(metadataPath)) fs.unlinkSync(metadataPath);
    // });
  } catch (error) {
    console.error('Download error:', error);
    const message = error instanceof Error ? error.message : 'Download failed';
    res.status(500).json({ error: message });
  }
});

export default router;


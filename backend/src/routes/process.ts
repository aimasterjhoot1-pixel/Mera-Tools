import express, { Request, Response } from 'express';
import { mergeService } from '../services/mergeService';
import { splitService } from '../services/splitService';
import { compressService } from '../services/compressService';
import { convertService } from '../services/convertService';
import { signService } from '../services/signService';
import { redactService } from '../services/redactService';
import { protectService } from '../services/protectService';
import { formService } from '../services/formService';
import { ocrService } from '../services/ocrService';

const router = express.Router();

/**
 * POST /api/merge
 * Merge multiple PDFs
 */
router.post('/merge', async (req: Request, res: Response) => {
  try {
    const { fileIds, options } = req.body;
    const result = await mergeService.merge(fileIds, options);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Merge failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/split
 * Split PDF by page ranges
 */
router.post('/split', async (req: Request, res: Response) => {
  try {
    const { fileId, ranges } = req.body;
    const result = await splitService.split(fileId, ranges);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Split failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/compress
 * Compress PDF
 */
router.post('/compress', async (req: Request, res: Response) => {
  try {
    const { fileId, quality } = req.body;
    const result = await compressService.compress(fileId, quality);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Compress failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/convert
 * Convert document
 */
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { fileId, targetFormat, options } = req.body;
    const result = await convertService.convert(fileId, targetFormat, options);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Convert failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/sign
 * Add signature to PDF
 */
router.post('/sign', async (req: Request, res: Response) => {
  try {
    const { fileId, signature, page, x, y, scale } = req.body;
    const result = await signService.addSignature(fileId, signature, page, x, y, scale);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/redact
 * Redact PDF
 */
router.post('/redact', async (req: Request, res: Response) => {
  try {
    const { fileId, redactions } = req.body;
    const result = await redactService.redact(fileId, redactions);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Redact failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/protect
 * Add/remove password protection
 */
router.post('/protect', async (req: Request, res: Response) => {
  try {
    const { fileId, action, password } = req.body;
    const result = await protectService.protect(fileId, action, password);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Protect failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/form/fill
 * Fill form fields
 */
router.post('/form/fill', async (req: Request, res: Response) => {
  try {
    const { fileId, fields } = req.body;
    const result = await formService.fillForm(fileId, fields);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fill form failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/ocr
 * OCR processing
 */
router.post('/ocr', async (req: Request, res: Response) => {
  try {
    const { fileId, options } = req.body;
    const result = await ocrService.ocr(fileId, options);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR failed';
    res.status(500).json({ error: message });
  }
});

export default router;


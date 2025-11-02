import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import cleanupService from '../services/cleanupService';
import { TMP_DIR } from '../config';

describe('CleanupService', () => {
  beforeEach(() => {
    // Ensure tmp directory exists
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    cleanupService.stop();
    // Clean up test files
    if (fs.existsSync(TMP_DIR)) {
      const files = fs.readdirSync(TMP_DIR);
      files.forEach((file) => {
        fs.unlinkSync(path.join(TMP_DIR, file));
      });
    }
  });

  it('should start cleanup service', () => {
    cleanupService.start(1000);
    expect(cleanupService).toBeDefined();
  });

  it('should stop cleanup service', () => {
    cleanupService.start(1000);
    cleanupService.stop();
    expect(cleanupService).toBeDefined();
  });
});


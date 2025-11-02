# Mera Dost - PDF Toolkit

A production-quality, fully functional web application for PDF/document manipulation - edit, convert, merge, split, compress, sign, redact, forms, and more.

**Developer:** Muhammad Sharjeel

## Features

- **Edit PDF**: Add text, images, draw, highlight, underline with undo/redo
- **Convert**: Word, PPT, Images, HTML ↔ PDF, text extraction
- **Merge & Split**: Combine multiple PDFs, reorder pages, extract selected pages
- **Compress**: Reduce file size with quality settings
- **Sign & Annotate**: Add signatures and annotations
- **Redact & Protect**: Blackout sensitive data, add/remove password protection
- **Forms**: Fill existing forms or create new form fields
- **OCR**: Extract text from scanned documents (optional)

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (optional, for containerized deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

### Docker Deployment

```bash
docker-compose up --build
```

Access the application at http://localhost:5173

## Architecture

```
/mera-dost
  /frontend          # React + Vite + TypeScript + Tailwind
    /src
      /components    # Reusable UI components
      /pages         # Route pages for each tool
      /lib           # PDF processing libraries
      /services      # API clients
      /hooks         # React hooks
      /styles        # Global styles
  /backend           # Node.js + Express + TypeScript
    /src
      /routes        # API routes
      /services      # Business logic
      /middleware    # Express middleware
      /utils         # Utilities
  /docs              # Documentation, screenshots, demos
  /scripts           # Deployment and utility scripts
```

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **pdf-lib** for PDF manipulation
- **pdf.js** for PDF rendering
- **React Router** for routing

### Backend
- **Node.js** with TypeScript
- **Express** for API server
- **Multer** for file uploads
- **Tesseract.js** (optional) for OCR

### Testing
- **Jest** for unit tests
- **Playwright** for E2E tests

## API Endpoints

See [API Documentation](./docs/API.md) for detailed endpoint specifications.

### Core Endpoints
- `POST /api/upload` - Upload files
- `POST /api/merge` - Merge PDFs
- `POST /api/split` - Split PDF
- `POST /api/compress` - Compress PDF
- `POST /api/convert` - Convert documents
- `POST /api/sign` - Add signature
- `POST /api/redact` - Redact content
- `POST /api/form` - Fill/create forms
- `POST /api/ocr` - OCR processing
- `GET /api/download/:fileId` - Download file

## Privacy & Security

- **No authentication required** - All features available to everyone
- **Auto-deletion** - Files automatically deleted after 2 hours
- **Client-first processing** - Most operations run in browser, files never leave your device
- **Server fallback** - Heavy operations (large files, OCR) use server processing
- **HTTPS ready** - Secure headers and content-type validation

## Development

### Project Structure

Each tool is implemented as an isolated module:
- `frontend/src/pages/tools/[tool-name]` - Tool page component
- `frontend/src/lib/[tool-name]Service.ts` - Client-side processing logic
- `backend/src/services/[tool-name]Service.ts` - Server-side processing (if needed)

### Adding a New Tool

1. Create tool page in `frontend/src/pages/tools/[new-tool]`
2. Implement service in `frontend/src/lib/[new-tool]Service.ts`
3. Add route in `frontend/src/App.tsx`
4. Add API endpoint in `backend/src/routes/` (if server-side needed)
5. Add tests in `frontend/src/__tests__/` and `backend/src/__tests__/`

### Code Quality

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Pre-commit hooks (optional)
- 60%+ test coverage target

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
cd frontend && npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

### Environment Variables

**Backend** (.env):
```
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=52428800
TMP_DIR=./tmp
CLEANUP_INTERVAL=7200000
ADMIN_SECRET=your-secret-key
```

**Frontend** (.env):
```
VITE_API_URL=http://localhost:3000
```

## Feature Status

✅ **Fully Implemented:**
- Edit PDF (text, images, highlights, undo/redo)
- Merge & Split PDFs
- Compress PDFs
- Sign & Annotate
- Redact & Protect
- Forms (fill/create)
- OCR (client-side)

⚠️ **Partial (UI complete, requires additional libraries):**
- Convert tool (Word, PPT, HTML conversions need server-side libraries)

See [Features Documentation](./docs/FEATURES.md) for detailed status.

## Limitations & Future Enhancements

### Current Limitations
- Some conversions require additional server-side libraries
- OCR for large files works client-side but may be slow
- Password-protected PDFs require password input during upload
- Very large files (>50MB) may timeout on client-side

### Recommended Next Steps
1. Add authentication (optional) - User accounts, preferences, history
2. Add payment gateway - Premium features, usage limits
3. Cloud storage integration - Google Drive, Dropbox (with explicit opt-in)
4. Advanced OCR - Server-side Tesseract with better accuracy
5. Batch processing UI - Queue and progress tracking
6. Full PDF.js viewer integration for Edit tool
7. Advanced compression with image optimization

## License

MIT License - see [LICENSE](./LICENSE) file

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Support

For issues and questions, please open an issue on GitHub.


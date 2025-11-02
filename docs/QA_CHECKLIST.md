# QA Checklist

## Pre-Deployment Checklist

### Functionality Tests

#### Edit PDF
- [ ] Upload a PDF successfully
- [ ] Add text to PDF
- [ ] Add image to PDF
- [ ] Add highlight annotation
- [ ] Undo operation works
- [ ] Redo operation works
- [ ] Download edited PDF
- [ ] File downloads with correct name

#### Convert
- [ ] Upload Word document
- [ ] Convert Word to PDF (if server-side enabled)
- [ ] Upload images
- [ ] Convert images to PDF
- [ ] Upload HTML
- [ ] Convert HTML to PDF (if enabled)
- [ ] Extract text from PDF
- [ ] Download converted file

#### Merge & Split
- [ ] Upload multiple PDFs
- [ ] Reorder files before merging
- [ ] Merge PDFs successfully
- [ ] Upload single PDF for splitting
- [ ] Select pages to extract
- [ ] Split PDF successfully
- [ ] Download merged/split PDF

#### Compress
- [ ] Upload PDF
- [ ] Select compression quality (High/Medium/Low)
- [ ] See estimated size reduction
- [ ] Compress PDF
- [ ] Download compressed PDF
- [ ] Verify file size reduction

#### Sign & Annotate
- [ ] Upload PDF
- [ ] Draw signature
- [ ] Type signature
- [ ] Upload signature image
- [ ] Place signature on PDF
- [ ] Download signed PDF

#### Redact & Protect
- [ ] Upload PDF
- [ ] Add redaction areas
- [ ] Apply redactions
- [ ] Download redacted PDF
- [ ] Verify redacted areas are blacked out
- [ ] Set password protection
- [ ] Download protected PDF
- [ ] Verify password is required to open

#### Forms
- [ ] Upload PDF with form fields
- [ ] Fill form fields
- [ ] Download filled form
- [ ] Create new form field
- [ ] Download PDF with new field

#### OCR
- [ ] Upload scanned image/PDF
- [ ] Select language
- [ ] Extract text
- [ ] Download extracted text
- [ ] Verify text accuracy

### Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Design

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Performance Tests

- [ ] Small PDF (<1MB) processes in <5s
- [ ] Medium PDF (1-10MB) processes in <30s
- [ ] Large PDF (>10MB) shows appropriate message
- [ ] Progress indicators display for long operations
- [ ] No memory leaks during extended use

### Security Tests

- [ ] File size limits enforced
- [ ] Invalid file types rejected
- [ ] Malicious file names sanitized
- [ ] CORS headers configured correctly
- [ ] No sensitive data in error messages

### Error Handling

- [ ] Invalid file shows clear error
- [ ] Network error handled gracefully
- [ ] Server error shows user-friendly message
- [ ] Timeout errors handled

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Semantic HTML structure

### File Cleanup

- [ ] Files deleted after 2 hours
- [ ] Cleanup service runs on schedule
- [ ] No orphaned files remain

## Manual Test Scenarios

### Scenario 1: Basic Edit Flow
1. Go to Edit PDF page
2. Upload a PDF
3. Add text "Test"
4. Add an image
5. Download the PDF
6. Verify changes are present

### Scenario 2: Merge Multiple PDFs
1. Go to Merge & Split page
2. Upload 3 PDFs
3. Reorder them
4. Merge
5. Download
6. Verify all pages are present in order

### Scenario 3: Compress Large PDF
1. Go to Compress page
2. Upload a 20MB PDF
3. Select Medium quality
4. Compress
5. Verify size reduction
6. Verify quality is acceptable

## Test Data

Use the following test files:

- `test-small.pdf` (<1MB, 5 pages)
- `test-medium.pdf` (5-10MB, 50 pages)
- `test-large.pdf` (>10MB, 200 pages)
- `test-form.pdf` (with interactive form fields)
- `test-scanned.pdf` (image-based PDF for OCR)

## Known Limitations

- OCR accuracy depends on image quality
- Password-protected PDFs require password during upload
- Very large files (>50MB) require server-side processing
- Some conversions require additional libraries


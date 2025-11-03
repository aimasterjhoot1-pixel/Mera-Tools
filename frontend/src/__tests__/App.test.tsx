import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock PDFViewer to avoid pdfjs-dist issues in Jest
jest.mock('../components/PDFViewer', () => ({
  __esModule: true,
  default: () => <div>PDF Viewer Mock</div>,
}));

// Mock the CSS import
jest.mock('pdfjs-dist/web/pdf_viewer.css', () => ({}));

import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    const heading = screen.getByRole('heading', { name: /mera tool - pdf toolkit/i });
    expect(heading).toBeTruthy();
  });
});
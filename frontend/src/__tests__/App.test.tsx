import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock PDFViewer component to avoid pdfjs-dist rendering issues in Jest
jest.mock('../components/PDFViewer', () => ({
  __esModule: true,
  default: function PDFViewerMock() {
    return <div data-testid="pdf-viewer-mock">PDF Viewer Mock</div>;
  },
}));

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
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white text-lg font-semibold mb-4">Mera Tool</h3>
            <p className="text-sm mb-4">
              Free PDF toolkit for editing, converting, merging, and more. No account needed.
            </p>
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-sm">
              <strong className="text-yellow-400">🔒 Privacy First:</strong>{' '}
              <span className="text-yellow-200">
                Files auto-delete after 2 hours. No permanent storage.
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tools/edit" className="hover:text-primary-400 transition-colors">
                  Edit PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/convert" className="hover:text-primary-400 transition-colors">
                  Convert
                </Link>
              </li>
              <li>
                <Link to="/tools/merge-split" className="hover:text-primary-400 transition-colors">
                  Merge & Split
                </Link>
              </li>
              <li>
                <Link to="/tools/compress" className="hover:text-primary-400 transition-colors">
                  Compress
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Info</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="hover:text-primary-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-primary-400 transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary-400 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/LICENSE" className="hover:text-primary-400 transition-colors">
                  License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>
            © {new Date().getFullYear()} Mera Tool. MIT License. Built with privacy in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}


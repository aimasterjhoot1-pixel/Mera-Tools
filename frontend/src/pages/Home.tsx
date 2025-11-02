import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const tools = [
  {
    name: 'Edit PDF',
    path: '/tools/edit',
    icon: '✏️',
    description: 'Add text, images, draw, highlight, and annotate PDFs',
    color: 'primary',
  },
  {
    name: 'Convert',
    path: '/tools/convert',
    icon: '🔄',
    description: 'Convert between PDF, Word, PPT, images, HTML, and text',
    color: 'accent',
  },
  {
    name: 'Merge & Split',
    path: '/tools/merge-split',
    icon: '📑',
    description: 'Combine multiple PDFs or split pages',
    color: 'primary',
  },
  {
    name: 'Compress',
    path: '/tools/compress',
    icon: '🗜️',
    description: 'Reduce file size with quality settings',
    color: 'accent',
  },
  {
    name: 'Sign',
    path: '/tools/sign',
    icon: '✍️',
    description: 'Add electronic signatures and annotations',
    color: 'primary',
  },
  {
    name: 'Redact',
    path: '/tools/redact',
    icon: '🖊️',
    description: 'Blackout sensitive data and add password protection',
    color: 'accent',
  },
  {
    name: 'Forms',
    path: '/tools/forms',
    icon: '📝',
    description: 'Fill existing forms or create new form fields',
    color: 'primary',
  },
  {
    name: 'OCR',
    path: '/tools/ocr',
    icon: '👁️',
    description: 'Extract text from scanned documents',
    color: 'accent',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-primary-600">Mera Tool</span> - PDF Toolkit
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Free, privacy-first PDF tools. Edit, convert, merge, compress, and more.
            <br />
            <span className="text-lg text-gray-500">No account needed. Files auto-delete after 2 hours.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/tools/edit"
              className="btn-primary text-lg px-8 py-3 inline-block"
            >
              Get Started
            </Link>
            <a
              href="#tools"
              className="btn-secondary text-lg px-8 py-3 inline-block"
            >
              Browse Tools
            </a>
          </div>
        </motion.div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          All PDF Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Link
                to={tool.path}
                className="card block h-full hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{tool.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {tool.name}
                </h3>
                <p className="text-gray-600 text-sm">{tool.description}</p>
                <div className="mt-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      tool.color === 'primary'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-accent-100 text-accent-700'
                    }`}
                  >
                    {tool.color === 'primary' ? 'Primary' : 'Advanced'}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-600">
              Files are processed in your browser when possible. Server files auto-delete after 2 hours.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Fast & Free</h3>
            <p className="text-gray-600">
              No account needed. No payment required. Process PDFs in seconds.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
            <p className="text-gray-600">
              Intuitive interface with clear instructions. Drag, drop, and download.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


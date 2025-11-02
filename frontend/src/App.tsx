import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import EditPDF from './pages/tools/EditPDF';
import Convert from './pages/tools/Convert';
import MergeSplit from './pages/tools/MergeSplit';
import Compress from './pages/tools/Compress';
import SignAnnotate from './pages/tools/SignAnnotate';
import RedactProtect from './pages/tools/RedactProtect';
import Forms from './pages/tools/Forms';
import OCR from './pages/tools/OCR';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/edit" element={<EditPDF />} />
        <Route path="/tools/convert" element={<Convert />} />
        <Route path="/tools/merge-split" element={<MergeSplit />} />
        <Route path="/tools/compress" element={<Compress />} />
        <Route path="/tools/sign" element={<SignAnnotate />} />
        <Route path="/tools/redact" element={<RedactProtect />} />
        <Route path="/tools/forms" element={<Forms />} />
        <Route path="/tools/ocr" element={<OCR />} />
      </Routes>
    </Layout>
  );
}

export default App;


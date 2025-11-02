import { useState } from 'react';
import FileUploader, { UploadedFile } from '../../components/FileUploader';
import { PDFDocument } from '../../lib/pdfService';
import { savePDF } from '../../lib/pdfService';
import toast from 'react-hot-toast';

type Mode = 'fill' | 'create';

export default function Forms() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [mode, setMode] = useState<Mode>('fill');
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleFileSelect = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    setUploadedFile(files[0]);
    setFormFields({});
    toast.success('PDF loaded');
  };

  const handleFillForm = async () => {
    if (!uploadedFile || Object.keys(formFields).length === 0) {
      toast.error('Please fill at least one form field');
      return;
    }

    setProcessing(true);
    try {
      const pdfBytes = await uploadedFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);

      // Fill form fields
      const form = pdf.getForm();
      Object.entries(formFields).forEach(([fieldName, value]) => {
        try {
          const field = form.getTextField(fieldName);
          field.setText(value);
        } catch {
          // Field might not exist or be a different type
          toast.error(`Field "${fieldName}" not found or not editable`);
        }
      });

      // Flatten form to prevent further editing
      form.flatten();

      const filename = uploadedFile.name.replace('.pdf', '_filled.pdf');
      await savePDF(pdf, filename);
      toast.success('Form filled successfully!');
    } catch (error) {
      toast.error(`Error filling form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateForm = async () => {
    if (!uploadedFile || !newFieldName || !newFieldValue) {
      toast.error('Please enter field name and value');
      return;
    }

    setProcessing(true);
    try {
      const pdfBytes = await uploadedFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const page = pdf.getPage(0);
      const form = pdf.getForm();

      // Create a new text field
      const textField = form.createTextField(newFieldName);
      textField.setText(newFieldValue);
      textField.addToPage(page, {
        x: 100,
        y: page.getHeight() - 200,
        width: 200,
        height: 30,
      });

      const filename = uploadedFile.name.replace('.pdf', '_with_form.pdf');
      await savePDF(pdf, filename);
      toast.success('Form field created successfully!');
      
      // Reset
      setNewFieldName('');
      setNewFieldValue('');
    } catch (error) {
      toast.error(`Error creating form field: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fill & Create PDF Forms</h1>
          <p className="text-gray-600">
            Fill existing interactive form fields or create new form fields in your PDF.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setMode('fill')}
              className={`btn ${mode === 'fill' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Fill Form
            </button>
            <button
              onClick={() => setMode('create')}
              className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Create Form Field
            </button>
          </div>
        </div>

        {!uploadedFile ? (
          <FileUploader
            onFilesSelected={handleFileSelect}
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            maxSize={50 * 1024 * 1024}
          />
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{uploadedFile.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setFormFields({});
                  }}
                  className="btn-secondary"
                >
                  Change File
                </button>
              </div>
            </div>

            {mode === 'fill' ? (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Form Fields</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter values for the form fields in your PDF. Field names should match those in the PDF.
                  </p>

                  <div className="space-y-4">
                    {Object.entries(formFields).map(([fieldName, value]) => (
                      <div key={fieldName} className="flex gap-2">
                        <input
                          type="text"
                          value={fieldName}
                          disabled
                          className="input flex-1"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setFormFields({ ...formFields, [fieldName]: e.target.value })
                          }
                          className="input flex-2"
                          placeholder="Enter value"
                        />
                        <button
                          onClick={() => {
                            const newFields = { ...formFields };
                            delete newFields[fieldName];
                            setFormFields(newFields);
                          }}
                          className="btn-secondary"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Field name"
                        className="input flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            setFormFields({ ...formFields, [input.value]: '' });
                            input.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const name = prompt('Enter field name:');
                          if (name) setFormFields({ ...formFields, [name]: '' });
                        }}
                        className="btn-secondary"
                      >
                        Add Field
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFillForm}
                  disabled={processing || Object.keys(formFields).length === 0}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {processing ? 'Filling Form...' : 'Fill & Download'}
                </button>
              </>
            ) : (
              <>
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Create New Form Field</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Name
                      </label>
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="e.g., Name, Email, Date"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Value
                      </label>
                      <input
                        type="text"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="Default value"
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateForm}
                  disabled={processing || !newFieldName || !newFieldValue}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {processing ? 'Creating...' : 'Create Field & Download'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// Mock for pdfjs-dist to avoid issues in Jest tests
module.exports = {
  getDocument: jest.fn(function getDocument() {
    return {
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn(function getPage() {
          return Promise.resolve({
            getViewport: jest.fn(function getViewport() {
              return { width: 100, height: 100 };
            }),
            render: jest.fn(function render() {
              return { promise: Promise.resolve() };
            }),
          });
        }),
      }),
    };
  }),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
};


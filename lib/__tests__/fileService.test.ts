import { categorizeFileType, formatFileSize } from '../fileService';

describe('fileService utilities', () => {
  describe('categorizeFileType', () => {
    it('should categorize resume files correctly', () => {
      expect(categorizeFileType('resume.pdf')).toBe('resume');
      expect(categorizeFileType('이력서.docx')).toBe('resume');
      expect(categorizeFileType('RESUME.PDF')).toBe('resume');
    });

    it('should categorize contract files correctly', () => {
      expect(categorizeFileType('contract.pdf')).toBe('contract');
      expect(categorizeFileType('계약서.pdf')).toBe('contract');
      expect(categorizeFileType('CONTRACT.PDF')).toBe('contract');
    });

    it('should categorize document files correctly', () => {
      expect(categorizeFileType('document.pdf')).toBe('document');
      expect(categorizeFileType('문서.pdf')).toBe('document');
    });

    it('should default to other for unknown files', () => {
      expect(categorizeFileType('image.jpg')).toBe('other');
      expect(categorizeFileType('video.mp4')).toBe('other');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle large file sizes', () => {
      expect(formatFileSize(2147483648)).toBe('2 GB');
    });
  });
});





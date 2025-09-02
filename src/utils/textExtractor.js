/**
 * Text extraction utility for various file formats
 * Supports: PDF, DOC, DOCX, TXT files
 */

/**
 * Extract text content from various file types
 * @param {File} file - The file to extract text from
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromFile = async (file) => {
  try {
    if (file.type === "text/plain") {
      // Handle .txt files
      return await readTextFile(file);
    } else if (file.type === "application/pdf") {
      // Handle PDF files
      return await extractPDFText(file);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Handle .docx files
      return await extractDocxText(file);
    } else if (file.type === "application/msword") {
      // Handle .doc files
      return await extractDocText(file);
    } else {
      throw new Error(
        "Unsupported file type. Please use PDF, DOC, DOCX, or TXT files."
      );
    }
  } catch (error) {
    throw new Error(`Error extracting text: ${error.message}`);
  }
};

/**
 * Read text from plain text files
 */
const readTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Extract text from PDF files
 */
const extractPDFText = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source for PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from DOCX files
 */
const extractDocxText = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from DOC files
 */
const extractDocText = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`DOC extraction failed: ${error.message}`);
  }
};

/**
 * Get file type information for display
 */
export const getFileTypeInfo = (fileType) => {
  const typeMap = {
    "text/plain": "Text Document",
    "application/pdf": "PDF Document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Word Document (.docx)",
    "application/msword": "Word Document (.doc)",
  };

  return typeMap[fileType] || "Unknown File Type";
};

/**
 * Validate file type and size
 */
export const validateFile = (file, maxSize = 5 * 1024 * 1024) => {
  const allowedTypes = [
    "text/plain",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please upload a PDF, DOC, DOCX, or TXT file");
  }

  if (file.size > maxSize) {
    throw new Error(
      `File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    );
  }

  return true;
};

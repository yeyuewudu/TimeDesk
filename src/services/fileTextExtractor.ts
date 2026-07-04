import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import mammoth from "mammoth";
import type { SourceType } from "../types/analysis";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_LENGTH = 12_000;

export interface ExtractedFileText {
  text: string;
  sourceType: SourceType;
  fileName: string;
  truncated: boolean;
  warning?: string;
}

export async function extractTextFromFile(file: File): Promise<ExtractedFileText> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("文件较大，MVP 暂支持 15MB 以内的文件。");
  }

  const ext = getExtension(file.name);
  if (ext === "doc") {
    throw new Error("当前版本暂不支持 .doc 老格式，请转换为 .docx 后再导入。");
  }

  let text = "";
  let sourceType: SourceType;

  if (ext === "pdf") {
    sourceType = "pdf";
    text = await extractPdfText(file);
    if (text.trim().length < 30) {
      throw new Error("这个 PDF 可能是扫描版，当前版本暂不支持 OCR。");
    }
  } else if (ext === "docx") {
    sourceType = "docx";
    text = await extractDocxText(file);
  } else if (ext === "txt") {
    sourceType = "txt";
    text = await file.text();
  } else if (ext === "md" || ext === "markdown") {
    sourceType = "md";
    text = await file.text();
  } else {
    throw new Error("暂只支持 PDF、DOCX、TXT 和 MD 文件。");
  }

  const normalizedText = normalizeText(text);
  const truncated = normalizedText.length > MAX_TEXT_LENGTH;
  return {
    text: truncated ? normalizedText.slice(0, MAX_TEXT_LENGTH) : normalizedText,
    sourceType,
    fileName: file.name,
    truncated,
    warning: truncated ? "文本超过 12000 字符，已先截断用于本次整理。" : undefined,
  };
}

async function extractPdfText(file: File) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

async function extractDocxText(file: File) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : "";
}

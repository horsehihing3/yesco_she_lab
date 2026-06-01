package com.smartehs.service;

import com.smartehs.mapper.FileMetadataMapper;
import com.smartehs.model.FileMetadata;
import com.smartehs.model.TranslationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xslf.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentTranslationService {

    private final TranslationService translationService;
    private final FileMetadataMapper fileMetadataMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final Set<String> TRANSLATABLE_EXTENSIONS = Set.of(".pptx", ".docx", ".xlsx", ".pdf");

    // 한글/중문 글리프 임베딩용 시스템 폰트 후보 경로 (윈도우/리눅스 일반 위치)
    private static final List<String> CJK_FONT_CANDIDATES = List.of(
            "C:/Windows/Fonts/malgun.ttf",
            "C:/Windows/Fonts/malgunbd.ttf",
            "C:/Windows/Fonts/NanumGothic.ttf",
            "C:/Windows/Fonts/gulim.ttc",
            "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/Library/Fonts/AppleGothic.ttf",
            "/System/Library/Fonts/AppleSDGothicNeo.ttc"
    );

    private static volatile File cachedCjkFontFile = null;

    private record TextEntry(String text, Consumer<String> setter) {}

    public boolean isTranslatable(String filename) {
        if (filename == null) return false;
        String lower = filename.toLowerCase();
        return TRANSLATABLE_EXTENSIONS.stream().anyMatch(lower::endsWith);
    }

    private List<String> getTargetLanguages(String sourceLanguage) {
        List<String> targets = new ArrayList<>(List.of("ko", "en", "zh"));
        targets.remove(sourceLanguage);
        return targets;
    }

    @Async("documentTranslationExecutor")
    public void translateDocumentAsync(Long originalFileId, String sourceLanguage) {
        try {
            log.info("Starting async translation for fileId={}, sourceLang={}", originalFileId, sourceLanguage);
            fileMetadataMapper.updateTranslationStatus(originalFileId, TranslationStatus.TRANSLATING);

            FileMetadata original = fileMetadataMapper.findById(originalFileId);
            if (original == null) {
                log.error("Original file not found: {}", originalFileId);
                return;
            }

            byte[] originalBytes = Files.readAllBytes(Paths.get(original.getFilePath()));
            String filename = original.getOriginalFilename().toLowerCase();
            List<String> targetLanguages = getTargetLanguages(sourceLanguage);

            // Parallel translation for both target languages
            List<CompletableFuture<Void>> futures = new ArrayList<>();

            for (String targetLang : targetLanguages) {
                CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                    try {
                        byte[] translatedBytes;
                        if (filename.endsWith(".pptx")) {
                            translatedBytes = translatePptx(originalBytes, sourceLanguage, targetLang);
                        } else if (filename.endsWith(".docx")) {
                            translatedBytes = translateDocx(originalBytes, sourceLanguage, targetLang);
                        } else if (filename.endsWith(".xlsx")) {
                            translatedBytes = translateXlsx(originalBytes, sourceLanguage, targetLang);
                        } else if (filename.endsWith(".pdf")) {
                            translatedBytes = translatePdf(originalBytes, sourceLanguage, targetLang);
                        } else {
                            return;
                        }
                        saveTranslatedFile(original, translatedBytes, sourceLanguage, targetLang);
                        log.info("Successfully translated fileId={} to {}", originalFileId, targetLang);
                    } catch (Exception e) {
                        log.error("Failed to translate fileId={} to {}: {}", originalFileId, targetLang, e.getMessage(), e);
                    }
                });
                futures.add(future);
            }

            // Wait for both languages to complete
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            fileMetadataMapper.updateTranslationStatus(originalFileId, TranslationStatus.COMPLETED);
            log.info("Translation completed for fileId={}", originalFileId);

        } catch (Exception e) {
            log.error("Translation failed for fileId={}: {}", originalFileId, e.getMessage(), e);
            fileMetadataMapper.updateTranslationStatus(originalFileId, TranslationStatus.FAILED);
        }
    }

    // ==================== PPTX ====================

    private byte[] translatePptx(byte[] pptxBytes, String sourceLang, String targetLang) throws IOException {
        try (InputStream is = new ByteArrayInputStream(pptxBytes);
             XMLSlideShow ppt = new XMLSlideShow(is)) {

            List<TextEntry> entries = new ArrayList<>();
            for (XSLFSlide slide : ppt.getSlides()) {
                collectFromShapes(slide.getShapes(), entries);
                XSLFNotes notes = slide.getNotes();
                if (notes != null) {
                    for (XSLFShape shape : notes.getShapes()) {
                        if (shape instanceof XSLFTextShape textShape) {
                            collectFromTextShape(textShape, entries);
                        }
                    }
                }
            }

            translateEntries(entries, sourceLang, targetLang);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ppt.write(out);
            return out.toByteArray();
        }
    }

    private void collectFromShapes(List<XSLFShape> shapes, List<TextEntry> entries) {
        for (XSLFShape shape : shapes) {
            if (shape instanceof XSLFTextShape textShape) {
                collectFromTextShape(textShape, entries);
            } else if (shape instanceof XSLFGroupShape groupShape) {
                collectFromShapes(groupShape.getShapes(), entries);
            } else if (shape instanceof XSLFTable table) {
                for (XSLFTableRow row : table.getRows()) {
                    for (XSLFTableCell cell : row.getCells()) {
                        collectFromTextShape(cell, entries);
                    }
                }
            }
        }
    }

    private void collectFromTextShape(XSLFTextShape textShape, List<TextEntry> entries) {
        for (XSLFTextParagraph paragraph : textShape.getTextParagraphs()) {
            for (XSLFTextRun run : paragraph.getTextRuns()) {
                String text = run.getRawText();
                if (text != null && !text.trim().isEmpty()) {
                    entries.add(new TextEntry(text, run::setText));
                }
            }
        }
    }

    // ==================== DOCX ====================

    private byte[] translateDocx(byte[] docxBytes, String sourceLang, String targetLang) throws IOException {
        try (InputStream is = new ByteArrayInputStream(docxBytes);
             XWPFDocument doc = new XWPFDocument(is)) {

            List<TextEntry> entries = new ArrayList<>();
            for (XWPFParagraph paragraph : doc.getParagraphs()) {
                collectFromDocxParagraph(paragraph, entries);
            }
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        for (XWPFParagraph paragraph : cell.getParagraphs()) {
                            collectFromDocxParagraph(paragraph, entries);
                        }
                    }
                }
            }
            for (XWPFHeader header : doc.getHeaderList()) {
                for (XWPFParagraph paragraph : header.getParagraphs()) {
                    collectFromDocxParagraph(paragraph, entries);
                }
            }
            for (XWPFFooter footer : doc.getFooterList()) {
                for (XWPFParagraph paragraph : footer.getParagraphs()) {
                    collectFromDocxParagraph(paragraph, entries);
                }
            }

            translateEntries(entries, sourceLang, targetLang);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    private void collectFromDocxParagraph(XWPFParagraph paragraph, List<TextEntry> entries) {
        for (XWPFRun run : paragraph.getRuns()) {
            String text = run.getText(0);
            if (text != null && !text.trim().isEmpty()) {
                entries.add(new TextEntry(text, translated -> run.setText(translated, 0)));
            }
        }
    }

    // ==================== XLSX ====================

    private byte[] translateXlsx(byte[] xlsxBytes, String sourceLang, String targetLang) throws IOException {
        try (InputStream is = new ByteArrayInputStream(xlsxBytes);
             XSSFWorkbook wb = new XSSFWorkbook(is)) {

            List<TextEntry> entries = new ArrayList<>();
            for (int s = 0; s < wb.getNumberOfSheets(); s++) {
                Sheet sheet = wb.getSheetAt(s);
                for (Row row : sheet) {
                    for (Cell cell : row) {
                        if (cell.getCellType() == CellType.STRING) {
                            String text = cell.getStringCellValue();
                            if (text != null && !text.trim().isEmpty()) {
                                entries.add(new TextEntry(text, cell::setCellValue));
                            }
                        }
                    }
                }
            }

            translateEntries(entries, sourceLang, targetLang);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    // ==================== PDF ====================
    // PDFBox 는 기존 PDF 의 텍스트를 in-place 수정하기 어려워, 텍스트만 추출 → 번역 → 새 PDF 생성.
    // 원본 레이아웃은 사라지지만 번역된 텍스트는 페이지별로 보존됨.

    private byte[] translatePdf(byte[] pdfBytes, String sourceLang, String targetLang) throws IOException {
        // 1) 페이지별 텍스트 추출
        List<String> pageTexts = new ArrayList<>();
        try (PDDocument source = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            int pages = source.getNumberOfPages();
            for (int i = 1; i <= pages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                pageTexts.add(stripper.getText(source));
            }
        }

        if (pageTexts.isEmpty()) {
            // 빈 PDF 면 원본 그대로 반환
            return pdfBytes;
        }

        // 2) 페이지별로 번역
        List<String> translatedPages = new ArrayList<>();
        String src = mapLangCode(sourceLang);
        String tgt = mapLangCode(targetLang);
        for (String pageText : pageTexts) {
            if (pageText == null || pageText.isBlank()) {
                translatedPages.add("");
                continue;
            }
            try {
                translatedPages.add(translationService.translate(pageText, src, tgt));
            } catch (Exception e) {
                log.warn("PDF page translation failed, keeping original: {}", e.getMessage());
                translatedPages.add(pageText);
            }
        }

        // 3) 새 PDF 작성
        try (PDDocument out = new PDDocument()) {
            PDFont font = loadCjkFont(out);
            float fontSize = 11f;
            float leading = 14f;
            float margin = 40f;

            for (String pageText : translatedPages) {
                PDPage page = new PDPage(PDRectangle.A4);
                out.addPage(page);
                if (pageText == null || pageText.isBlank()) continue;

                PDRectangle box = page.getMediaBox();
                float maxWidth = box.getWidth() - margin * 2;
                float startY = box.getHeight() - margin;

                try (PDPageContentStream cs = new PDPageContentStream(out, page)) {
                    cs.beginText();
                    cs.setFont(font, fontSize);
                    cs.setLeading(leading);
                    cs.newLineAtOffset(margin, startY);

                    float currentY = startY;
                    for (String paragraph : pageText.split("\\r?\\n")) {
                        // 단어 단위 줄바꿈
                        List<String> lines = wrapLine(paragraph, font, fontSize, maxWidth);
                        for (String line : lines) {
                            if (currentY < margin) break; // 페이지 한도 초과 시 잘림 (현재 PDF 페이지 1:1 대응)
                            try {
                                cs.showText(sanitize(line));
                            } catch (Exception e) {
                                // 폰트가 지원하지 않는 글리프 - 안전하게 ASCII 만 남김
                                cs.showText(line.replaceAll("[^\\x00-\\x7F]", "?"));
                            }
                            cs.newLine();
                            currentY -= leading;
                        }
                    }
                    cs.endText();
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            out.save(baos);
            return baos.toByteArray();
        }
    }

    /**
     * 줄 너비를 넘으면 단어 경계로 줄바꿈.
     */
    private List<String> wrapLine(String text, PDFont font, float fontSize, float maxWidth) {
        List<String> result = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            result.add("");
            return result;
        }
        String[] words = text.split(" ");
        StringBuilder current = new StringBuilder();
        for (String word : words) {
            String candidate = current.length() == 0 ? word : current + " " + word;
            float w;
            try {
                w = font.getStringWidth(sanitize(candidate)) / 1000f * fontSize;
            } catch (Exception e) {
                w = 0;
            }
            if (w > maxWidth && current.length() > 0) {
                result.add(current.toString());
                current = new StringBuilder(word);
            } else {
                current = new StringBuilder(candidate);
            }
        }
        if (current.length() > 0) result.add(current.toString());
        return result;
    }

    /** 일부 컨트롤 문자 제거 (PDFBox 가 거부하는 문자) */
    private String sanitize(String s) {
        if (s == null) return "";
        return s.replace((char)0xA0, ' ').replace("\r", "").replace("\t", "    ").replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "");
    }

    /**
     * 시스템 폰트 후보 중 첫 번째로 발견되는 CJK 폰트를 PDF 에 임베드해 반환.
     * 못 찾으면 PDFBox 기본 라틴 폰트(Helvetica) 로 fallback (한글/중문 글리프 깨짐 가능).
     */
    private PDFont loadCjkFont(PDDocument doc) {
        File fontFile = cachedCjkFontFile;
        if (fontFile == null) {
            for (String path : CJK_FONT_CANDIDATES) {
                File candidate = new File(path);
                if (candidate.exists() && candidate.canRead()) {
                    fontFile = candidate;
                    break;
                }
            }
            cachedCjkFontFile = fontFile;
        }
        if (fontFile != null) {
            try (InputStream fontStream = new FileInputStream(fontFile)) {
                return PDType0Font.load(doc, fontStream, true);
            } catch (Exception e) {
                log.warn("Failed to load CJK font from {}: {}", fontFile, e.getMessage());
            }
        }
        log.warn("No CJK font found; PDF translation will fall back to Helvetica (non-Latin glyphs may be missing)");
        return new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    }

    // ==================== Translation with Dedup Cache ====================

    /**
     * Translate all entries using a dedup cache.
     * Same text is translated only once, then applied to all matching entries.
     * This is much faster than translating each run individually.
     */
    private void translateEntries(List<TextEntry> entries, String sourceLang, String targetLang) {
        if (entries.isEmpty()) return;

        String source = mapLangCode(sourceLang);
        String target = mapLangCode(targetLang);

        // Step 1: Build dedup cache - collect unique texts
        Map<String, String> translationCache = new ConcurrentHashMap<>();
        Set<String> uniqueTexts = new LinkedHashSet<>();
        for (TextEntry entry : entries) {
            uniqueTexts.add(entry.text());
        }

        log.info("Translating {} entries ({} unique) from {} to {}",
                entries.size(), uniqueTexts.size(), source, target);

        // Step 2: Translate each unique text once
        int count = 0;
        for (String text : uniqueTexts) {
            try {
                String translated = translationService.translate(text, source, target);
                translationCache.put(text, translated);
                count++;

                // Small delay every 10 calls to avoid rate limiting
                if (count % 10 == 0) {
                    Thread.sleep(100);
                }
            } catch (Exception e) {
                log.warn("Translation failed for text, keeping original: {}", e.getMessage());
                translationCache.put(text, text);
            }
        }

        log.info("Translated {} unique texts", count);

        // Step 3: Apply translations from cache
        for (TextEntry entry : entries) {
            String translated = translationCache.getOrDefault(entry.text(), entry.text());
            entry.setter().accept(translated);
        }
    }

    // ==================== Utilities ====================

    private String mapLangCode(String lang) {
        if ("zh".equals(lang)) {
            return "zh-CN";
        }
        return lang;
    }

    private synchronized void saveTranslatedFile(FileMetadata original, byte[] translatedBytes, String sourceLang, String targetLang) throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String extension = getFileExtension(original.getOriginalFilename());
        String storedFilename = UUID.randomUUID() + "_" + timestamp + extension;

        Path entityDir = Paths.get(uploadDir, original.getEntityType());
        Files.createDirectories(entityDir);
        Path targetPath = entityDir.resolve(storedFilename);
        Files.write(targetPath, translatedBytes);

        // Translate the filename itself
        String baseName = original.getOriginalFilename().replaceAll("\\.[^.]+$", "");
        String translatedBaseName = translationService.translate(baseName, mapLangCode(sourceLang), mapLangCode(targetLang));
        String translatedFilename = translatedBaseName + extension;

        FileMetadata translated = FileMetadata.builder()
                .originalFilename(translatedFilename)
                .storedFilename(storedFilename)
                .filePath(targetPath.toString())
                .fileSize((long) translatedBytes.length)
                .contentType(original.getContentType())
                .entityType(original.getEntityType())
                .entityId(original.getEntityId())
                .uploadedBy(original.getUploadedBy())
                .language(targetLang)
                .parentFileId(original.getId())
                .translationStatus(TranslationStatus.COMPLETED)
                .build();

        fileMetadataMapper.insert(translated);
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex >= 0) ? filename.substring(dotIndex) : "";
    }
}

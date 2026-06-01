package com.smartehs.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartehs.exception.BadRequestException;
import com.smartehs.model.FileMetadata;
import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.usermodel.Range;
import org.apache.poi.hwpf.usermodel.Table;
import org.apache.poi.hwpf.usermodel.TableCell;
import org.apache.poi.hwpf.usermodel.TableRow;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileConversionService {

    private final FileStorageService fileStorageService;

    /**
     * Office 문서를 PDF로 변환
     */
    public byte[] convertToPdf(Long fileId) {
        FileMetadata metadata = fileStorageService.getFileMetadata(fileId);
        String filename = metadata.getOriginalFilename().toLowerCase();

        try {
            Path filePath = Paths.get(metadata.getFilePath());
            byte[] fileBytes = Files.readAllBytes(filePath);

            if (filename.endsWith(".docx")) {
                return convertDocxToPdf(fileBytes);
            } else if (filename.endsWith(".doc")) {
                return convertDocToPdf(fileBytes);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                return convertExcelToPdf(fileBytes, filename.endsWith(".xlsx"));
            } else if (filename.endsWith(".pptx") || filename.endsWith(".ppt")) {
                return convertPptxToPdf(fileBytes);
            } else {
                throw new BadRequestException("지원하지 않는 파일 형식입니다: " + filename);
            }
        } catch (IOException e) {
            log.error("파일 읽기 실패: {}", filename, e);
            throw new RuntimeException("파일을 읽을 수 없습니다: " + filename, e);
        }
    }

    /**
     * Word (.docx) to PDF
     */
    private byte[] convertDocxToPdf(byte[] docxBytes) {
        try (InputStream is = new ByteArrayInputStream(docxBytes);
             XWPFDocument document = new XWPFDocument(is);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PdfOptions options = PdfOptions.create();
            PdfConverter.getInstance().convert(document, out, options);

            return out.toByteArray();
        } catch (Exception e) {
            log.error("DOCX to PDF 변환 실패", e);
            throw new RuntimeException("Word 문서 변환에 실패했습니다", e);
        }
    }

    /**
     * Word (.doc) to PDF - 구형 Word 형식
     */
    private byte[] convertDocToPdf(byte[] docBytes) {
        try (InputStream is = new ByteArrayInputStream(docBytes);
             HWPFDocument hwpfDocument = new HWPFDocument(is);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // 한글 폰트 설정
            BaseFont baseFont;
            try {
                baseFont = BaseFont.createFont("c:/windows/fonts/malgun.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception e) {
                baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            }
            Font font = new Font(baseFont, 11);
            Font boldFont = new Font(baseFont, 11, Font.BOLD);

            Range range = hwpfDocument.getRange();
            int numParagraphs = range.numParagraphs();

            // 이미 처리한 테이블 문단 범위를 추적
            int skipUntil = -1;

            for (int i = 0; i < numParagraphs; i++) {
                // 이미 처리한 테이블의 문단은 건너뛰기
                if (i < skipUntil) {
                    continue;
                }

                org.apache.poi.hwpf.usermodel.Paragraph para = range.getParagraph(i);

                // 테이블인지 확인
                if (para.isInTable()) {
                    try {
                        Table table = range.getTable(para);
                        PdfPTable pdfTable = convertDocTable(table, font);
                        document.add(pdfTable);

                        // 테이블의 모든 문단을 건너뛰도록 설정
                        skipUntil = i + getTableParagraphCount(table);
                    } catch (IllegalArgumentException e) {
                        // 테이블의 첫 번째 문단이 아닌 경우 무시 (이미 처리됨)
                        continue;
                    }
                } else {
                    String text = para.text();
                    if (text != null) {
                        text = text.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x07]", "").trim();
                        if (!text.isEmpty()) {
                            // 볼드 여부 확인
                            boolean isBold = false;
                            if (para.numCharacterRuns() > 0) {
                                isBold = para.getCharacterRun(0).isBold();
                            }

                            Paragraph pdfParagraph = new Paragraph(text, isBold ? boldFont : font);
                            pdfParagraph.setSpacingAfter(5);
                            document.add(pdfParagraph);
                        }
                    }
                }
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("DOC to PDF 변환 실패", e);
            throw new RuntimeException("Word 문서 변환에 실패했습니다", e);
        }
    }

    /**
     * DOC 테이블을 PDF 테이블로 변환
     */
    private PdfPTable convertDocTable(Table table, Font font) {
        int numRows = table.numRows();
        if (numRows == 0) return new PdfPTable(1);

        int numCols = table.getRow(0).numCells();
        PdfPTable pdfTable = new PdfPTable(numCols);
        pdfTable.setWidthPercentage(100);
        pdfTable.setSpacingBefore(10);
        pdfTable.setSpacingAfter(10);

        for (int r = 0; r < numRows; r++) {
            TableRow row = table.getRow(r);
            for (int c = 0; c < row.numCells(); c++) {
                TableCell cell = row.getCell(c);
                String cellText = getCellText(cell);

                PdfPCell pdfCell = new PdfPCell(new Phrase(cellText, font));
                pdfCell.setPadding(5);

                // 첫 번째 행은 헤더로 처리
                if (r == 0) {
                    pdfCell.setBackgroundColor(new Color(220, 220, 220));
                }

                pdfTable.addCell(pdfCell);
            }
        }

        return pdfTable;
    }

    /**
     * DOC 테이블 셀의 텍스트 추출
     */
    private String getCellText(TableCell cell) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cell.numParagraphs(); i++) {
            org.apache.poi.hwpf.usermodel.Paragraph para = cell.getParagraph(i);
            String text = para.text();
            if (text != null) {
                text = text.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x07]", "").trim();
                if (!text.isEmpty()) {
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(text);
                }
            }
        }
        return sb.toString();
    }

    /**
     * 테이블의 총 문단 수 계산
     */
    private int getTableParagraphCount(Table table) {
        int count = 0;
        for (int r = 0; r < table.numRows(); r++) {
            TableRow row = table.getRow(r);
            for (int c = 0; c < row.numCells(); c++) {
                count += row.getCell(c).numParagraphs();
            }
        }
        return count;
    }

    /**
     * Excel (.xlsx, .xls) to PDF
     */
    private byte[] convertExcelToPdf(byte[] excelBytes, boolean isXlsx) {
        try (InputStream is = new ByteArrayInputStream(excelBytes);
             Workbook workbook = isXlsx ? new XSSFWorkbook(is) : WorkbookFactory.create(is);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Document document = new Document(PageSize.A4.rotate()); // 가로 방향
            PdfWriter.getInstance(document, out);
            document.open();

            // 한글 폰트 설정
            BaseFont baseFont;
            try {
                baseFont = BaseFont.createFont("c:/windows/fonts/malgun.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception e) {
                // 폰트 파일이 없으면 기본 폰트 사용
                baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            }
            Font font = new Font(baseFont, 9);
            Font headerFont = new Font(baseFont, 9, Font.BOLD);

            for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
                Sheet sheet = workbook.getSheetAt(sheetIndex);

                if (sheetIndex > 0) {
                    document.newPage();
                }

                // 시트 이름 추가
                Paragraph sheetTitle = new Paragraph(sheet.getSheetName(), new Font(baseFont, 12, Font.BOLD));
                sheetTitle.setSpacingAfter(10);
                document.add(sheetTitle);

                // 최대 컬럼 수 찾기
                int maxColumns = 0;
                for (Row row : sheet) {
                    if (row.getLastCellNum() > maxColumns) {
                        maxColumns = row.getLastCellNum();
                    }
                }

                if (maxColumns == 0) continue;

                PdfPTable table = new PdfPTable(maxColumns);
                table.setWidthPercentage(100);

                // 데이터 추가
                boolean isFirstRow = true;
                for (Row row : sheet) {
                    for (int cellIndex = 0; cellIndex < maxColumns; cellIndex++) {
                        Cell cell = row.getCell(cellIndex);
                        String cellValue = getCellValueAsString(cell);

                        PdfPCell pdfCell = new PdfPCell(new Phrase(cellValue, isFirstRow ? headerFont : font));
                        pdfCell.setPadding(3);
                        if (isFirstRow) {
                            pdfCell.setBackgroundColor(new Color(220, 220, 220));
                        }
                        table.addCell(pdfCell);
                    }
                    isFirstRow = false;
                }

                document.add(table);
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Excel to PDF 변환 실패", e);
            throw new RuntimeException("Excel 문서 변환에 실패했습니다", e);
        }
    }

    /**
     * PowerPoint (.pptx) to PDF
     */
    private byte[] convertPptxToPdf(byte[] pptxBytes) {
        try (InputStream is = new ByteArrayInputStream(pptxBytes);
             XMLSlideShow ppt = new XMLSlideShow(is);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Dimension pgSize = ppt.getPageSize();
            float scale = 1.5f; // 해상도 향상

            Document document = new Document(new Rectangle(pgSize.width, pgSize.height));
            PdfWriter.getInstance(document, out);
            document.open();

            for (XSLFSlide slide : ppt.getSlides()) {
                // 슬라이드를 이미지로 렌더링
                BufferedImage img = new BufferedImage(
                        (int) (pgSize.width * scale),
                        (int) (pgSize.height * scale),
                        BufferedImage.TYPE_INT_RGB
                );
                Graphics2D graphics = img.createGraphics();
                graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, img.getWidth(), img.getHeight());
                graphics.scale(scale, scale);

                slide.draw(graphics);
                graphics.dispose();

                // 이미지를 PDF에 추가
                ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
                ImageIO.write(img, "PNG", imgOut);
                Image pdfImage = Image.getInstance(imgOut.toByteArray());
                pdfImage.scaleToFit(pgSize.width, pgSize.height);

                document.newPage();
                document.add(pdfImage);
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("PPTX to PDF 변환 실패", e);
            throw new RuntimeException("PowerPoint 문서 변환에 실패했습니다", e);
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double numValue = cell.getNumericCellValue();
                if (numValue == Math.floor(numValue)) {
                    yield String.valueOf((long) numValue);
                }
                yield String.valueOf(numValue);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    yield cell.getStringCellValue();
                }
            }
            default -> "";
        };
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.ChecklistTemplateMasterRequest.ChecklistItemRequest;
import com.smartehs.exception.BadRequestException;
import com.smartehs.mapper.ChecklistTemplateItemMapper;
import com.smartehs.model.ChecklistTemplateItem;
import com.smartehs.model.ChecklistResultItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChecklistExcelService {

    private final ChecklistTemplateItemMapper templateItemMapper;

    private static final int HEADER_ROW = 3;
    private static final int DATA_START_ROW = 4;
    private static final int COL_COUNT = 9;

    /**
     * 엑셀 파일을 파싱하여 아이템 리스트로 반환 (서식 업로드용)
     */
    public List<ChecklistItemRequest> parseExcel(MultipartFile file) {
        List<ChecklistItemRequest> items = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            validateExcelTemplate(sheet);
            int lastRow = sheet.getLastRowNum();

            for (int i = DATA_START_ROW; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String category     = getCellValue(row, 0);
                String checkItem    = getCellValue(row, 1);
                String checkContent = getCellValue(row, 2);
                String isNormal     = getCellValue(row, 3);
                String isAbnormal   = getCellValue(row, 4);
                String remarks      = getCellValue(row, 5);
                String checkStandard = getCellValue(row, 6);
                String actionTaken  = getCellValue(row, 7);
                String confirm      = getCellValue(row, 8);

                if (category.contains("점검책임자") || category.contains("시설관리자")) continue;
                if (category.isEmpty() && checkItem.isEmpty() && checkContent.isEmpty() && checkStandard.isEmpty()) continue;

                items.add(new ChecklistItemRequest(category, checkItem, checkContent, isNormal, isAbnormal, remarks, checkStandard, actionTaken, confirm));
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("엑셀 파싱 실패: " + e.getMessage(), e);
        }

        return items;
    }

    /**
     * 엑셀 파일을 파싱하여 메타 정보와 항목 리스트를 함께 반환 (결과 업로드용)
     */
    public ExcelParseResult parseExcelWithMeta(MultipartFile file) {
        List<ChecklistItemRequest> items = new ArrayList<>();
        String title = null, checkDate = null, checker = null, checkManager = null, facilityManager = null;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            validateExcelTemplate(sheet);
            int lastRow = sheet.getLastRowNum();

            // 제목: A1
            title = getCellValue(sheet.getRow(0), 0);

            // 점검일자, 점검자: 2행
            Row row1 = sheet.getRow(1);
            if (row1 != null) {
                String a2 = getCellValue(row1, 0);
                if (a2.contains("점검일자")) {
                    String after = a2.replaceAll(".*점검일자[:\\s]*", "").trim();
                    if (!after.isEmpty()) checkDate = after;
                    else {
                        String b2 = getCellValue(row1, 1);
                        if (!b2.isEmpty()) checkDate = b2;
                    }
                }
                String e2 = getCellValue(row1, 4);
                if (e2.contains("점검자")) {
                    String after = e2.replaceAll(".*점검자[:\\s]*", "").trim();
                    if (!after.isEmpty()) checker = after;
                    else {
                        String f2 = getCellValue(row1, 5);
                        if (!f2.isEmpty()) checker = f2;
                    }
                }
            }

            // 데이터 + 푸터 파싱
            for (int i = DATA_START_ROW; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String category     = getCellValue(row, 0);
                String checkItem    = getCellValue(row, 1);
                String checkContent = getCellValue(row, 2);
                String isNormal     = getCellValue(row, 3);
                String isAbnormal   = getCellValue(row, 4);
                String remarks      = getCellValue(row, 5);
                String checkStandard = getCellValue(row, 6);
                String actionTaken  = getCellValue(row, 7);
                String confirm      = getCellValue(row, 8);

                boolean isFooter = false;
                for (int c = 0; c <= 8; c++) {
                    String cellVal = getCellValue(row, c);
                    if (cellVal.contains("점검책임자")) {
                        isFooter = true;
                        String after = cellVal.replaceAll(".*점검책임자[:\\s]*", "").trim();
                        if (!after.isEmpty()) checkManager = after;
                        else if (c + 1 <= 8) {
                            String next = getCellValue(row, c + 1);
                            if (!next.isEmpty()) checkManager = next;
                        }
                    }
                    if (cellVal.contains("시설관리자")) {
                        isFooter = true;
                        String after = cellVal.replaceAll(".*시설관리자[:\\s]*", "").trim();
                        if (!after.isEmpty()) facilityManager = after;
                        else if (c + 1 <= 8) {
                            String next = getCellValue(row, c + 1);
                            if (!next.isEmpty()) facilityManager = next;
                        }
                    }
                }
                if (isFooter) continue;
                if (category.isEmpty() && checkItem.isEmpty() && checkContent.isEmpty() && checkStandard.isEmpty()) continue;

                items.add(new ChecklistItemRequest(category, checkItem, checkContent, isNormal, isAbnormal, remarks, checkStandard, actionTaken, confirm));
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("엑셀 파싱 실패: " + e.getMessage(), e);
        }

        return new ExcelParseResult(title, checkDate, checker, checkManager, facilityManager, items);
    }

    /**
     * 업로드된 엑셀 데이터가 선택한 서식과 일치하는지 검증
     */
    public void validateAgainstTemplate(Long templateId, List<ChecklistItemRequest> excelItems) {
        List<ChecklistTemplateItem> templateItems = templateItemMapper.findByMasterId(templateId);

        if (templateItems.size() != excelItems.size()) {
            throw new BadRequestException("업로드한 파일이 선택한 서식과 일치하지 않습니다. (행 개수 불일치: 서식=" + templateItems.size() + "행, 엑셀=" + excelItems.size() + "행)");
        }

        for (int i = 0; i < templateItems.size(); i++) {
            ChecklistTemplateItem tpl = templateItems.get(i);
            ChecklistItemRequest excel = excelItems.get(i);
            int rowNum = i + 5;

            String tplCat = tpl.getCategory() != null ? tpl.getCategory().trim() : "";
            String excelCat = excel.getCategory() != null ? excel.getCategory().trim() : "";
            if (!tplCat.equals(excelCat)) {
                throw new BadRequestException("업로드한 파일이 선택한 서식과 일치하지 않습니다. (" + rowNum + "행 '구분' 불일치)");
            }

            String tplItem = tpl.getCheckItem() != null ? tpl.getCheckItem().trim() : "";
            String excelItem = excel.getCheckItem() != null ? excel.getCheckItem().trim() : "";
            if (!tplItem.equals(excelItem)) {
                throw new BadRequestException("업로드한 파일이 선택한 서식과 일치하지 않습니다. (" + rowNum + "행 '점검항목' 불일치)");
            }

            String tplContent = tpl.getCheckContent() != null ? tpl.getCheckContent().trim() : "";
            String excelContent = excel.getCheckContent() != null ? excel.getCheckContent().trim() : "";
            if (!tplContent.equals(excelContent)) {
                throw new BadRequestException("업로드한 파일이 선택한 서식과 일치하지 않습니다. (" + rowNum + "행 '점검내용' 불일치)");
            }

            String tplStd = tpl.getCheckStandard() != null ? tpl.getCheckStandard().trim() : "";
            String excelStd = excel.getCheckStandard() != null ? excel.getCheckStandard().trim() : "";
            if (!tplStd.equals(excelStd)) {
                throw new BadRequestException("업로드한 파일이 선택한 서식과 일치하지 않습니다. (" + rowNum + "행 '점검기준' 불일치)");
            }
        }
    }

    /**
     * 체크리스트 서식을 엑셀로 다운로드
     */
    public byte[] downloadChecklist(String title, List<ChecklistTemplateItem> itemList) {
        List<String[]> dataRows = itemList.stream()
                .map(item -> new String[]{
                        item.getCategory(), item.getCheckItem(), item.getCheckContent(),
                        item.getIsNormal(), item.getIsAbnormal(), item.getRemarks(),
                        item.getCheckStandard(), item.getActionTaken(), item.getConfirm()
                }).toList();

        return generateExcel(title, dataRows, "점검책임자:", "시설관리자:", null, null);
    }

    /**
     * 체크리스트 결과를 엑셀로 다운로드
     */
    public byte[] downloadResult(String title, String checkDate, String checker,
                                  String checkManager, String facilityManager,
                                  List<ChecklistResultItem> itemList) {
        List<String[]> dataRows = itemList.stream()
                .map(item -> new String[]{
                        item.getCategory(), item.getCheckItem(), item.getCheckContent(),
                        item.getIsNormal(), item.getIsAbnormal(), item.getRemarks(),
                        item.getCheckStandard(), item.getActionTaken(), item.getConfirm()
                }).toList();

        String footerLeft = checkManager != null ? "점검책임자: " + checkManager : "점검책임자:";
        String footerRight = facilityManager != null ? "시설관리자: " + facilityManager : "시설관리자:";

        return generateExcel(title, dataRows, footerLeft, footerRight, checkDate, checker);
    }

    private byte[] generateExcel(String title, List<String[]> dataRows,
                                  String footerLeft, String footerRight,
                                  String checkDate, String checker) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Workbook workbook;
            Sheet sheet;

            ClassPathResource templateResource = new ClassPathResource("templates/excel/checklist_template.xlsx");
            if (templateResource.exists()) {
                try (InputStream is = templateResource.getInputStream()) {
                    workbook = new XSSFWorkbook(is);
                }
                sheet = workbook.getSheetAt(0);
            } else {
                workbook = new XSSFWorkbook();
                sheet = workbook.createSheet("체크리스트");
                String[] headers = {"구분", "점검항목", "점검내용", "정상", "이상", "비고", "점검기준", "조치사항", "확인"};
                Row headerRow = sheet.createRow(HEADER_ROW);
                CellStyle hStyle = workbook.createCellStyle();
                Font hFont = workbook.createFont();
                hFont.setBold(true);
                hStyle.setFont(hFont);
                applyThinBorder(hStyle);
                hStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
                hStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                for (int c = 0; c < headers.length; c++) {
                    Cell cell = headerRow.createCell(c);
                    cell.setCellValue(headers[c]);
                    cell.setCellStyle(hStyle);
                }
            }

            workbook.setSheetName(0, title.length() > 31 ? title.substring(0, 31) : title);

            // 타이틀
            Row titleRow = sheet.getRow(0);
            if (titleRow == null) titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.getCell(0);
            if (titleCell == null) titleCell = titleRow.createCell(0);
            titleCell.setCellValue(title);

            // 점검일자, 점검자
            if (checkDate != null && !checkDate.isBlank()) {
                Row row1 = sheet.getRow(1);
                if (row1 == null) row1 = sheet.createRow(1);
                for (int c = 0; c <= 8; c++) {
                    Cell c1 = row1.getCell(c);
                    if (c1 != null && c1.getCellType() == CellType.STRING
                            && c1.getStringCellValue().contains("점검일자")) {
                        Cell valCell = row1.getCell(c + 1);
                        if (valCell == null) valCell = row1.createCell(c + 1);
                        valCell.setCellValue(checkDate);
                        break;
                    }
                }
            }
            if (checker != null && !checker.isBlank()) {
                for (int r = 1; r <= 2; r++) {
                    Row infoRow = sheet.getRow(r);
                    if (infoRow == null) continue;
                    for (int c = 0; c <= 8; c++) {
                        Cell c1 = infoRow.getCell(c);
                        if (c1 != null && c1.getCellType() == CellType.STRING
                                && c1.getStringCellValue().contains("점검자")) {
                            Cell valCell = infoRow.getCell(c + 1);
                            if (valCell == null) valCell = infoRow.createCell(c + 1);
                            valCell.setCellValue(checker);
                            r = 3;
                            break;
                        }
                    }
                }
            }

            // 구분 스타일 캡처
            CellStyle tplCategoryCellStyle = null;
            int lastRowNum = sheet.getLastRowNum();
            for (int r = DATA_START_ROW; r <= lastRowNum; r++) {
                Row tplRow = sheet.getRow(r);
                if (tplRow == null) continue;
                Cell tplCell = tplRow.getCell(0);
                if (tplCell != null && tplCell.getCellType() == CellType.STRING
                        && tplCell.getStringCellValue() != null
                        && !tplCell.getStringCellValue().trim().isEmpty()) {
                    tplCategoryCellStyle = tplCell.getCellStyle();
                    break;
                }
            }

            // 데이터 영역 초기화
            for (int i = sheet.getNumMergedRegions() - 1; i >= 0; i--) {
                CellRangeAddress region = sheet.getMergedRegion(i);
                if (region.getFirstRow() >= DATA_START_ROW) {
                    sheet.removeMergedRegion(i);
                }
            }
            for (int i = lastRowNum; i >= DATA_START_ROW; i--) {
                Row row = sheet.getRow(i);
                if (row != null) sheet.removeRow(row);
            }

            // 데이터 스타일
            Font dataFont = workbook.createFont();
            dataFont.setBold(false);
            dataFont.setColor(IndexedColors.BLACK.getIndex());
            Row hdrRow = sheet.getRow(HEADER_ROW);
            if (hdrRow != null && hdrRow.getCell(1) != null) {
                Font tplFont = workbook.getFontAt(hdrRow.getCell(1).getCellStyle().getFontIndex());
                dataFont.setFontName(tplFont.getFontName());
                dataFont.setFontHeightInPoints(tplFont.getFontHeightInPoints());
            }

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setFont(dataFont);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataStyle.setFillPattern(FillPatternType.NO_FILL);
            applyThinBorder(dataStyle);

            // 구분 스타일
            CellStyle categoryStyle = workbook.createCellStyle();
            categoryStyle.cloneStyleFrom(dataStyle);
            Font categoryFont = workbook.createFont();
            categoryFont.setFontName(dataFont.getFontName());
            categoryFont.setFontHeightInPoints(dataFont.getFontHeightInPoints());
            categoryFont.setBold(true);
            categoryFont.setColor(IndexedColors.BLACK.getIndex());

            if (tplCategoryCellStyle != null) {
                try {
                    if (tplCategoryCellStyle instanceof XSSFCellStyle xssfTpl
                            && categoryStyle instanceof XSSFCellStyle xssfCat) {
                        XSSFColor fgColor = xssfTpl.getFillForegroundXSSFColor();
                        if (fgColor != null) xssfCat.setFillForegroundColor(fgColor);
                    } else {
                        categoryStyle.setFillForegroundColor(tplCategoryCellStyle.getFillForegroundColor());
                    }
                    categoryStyle.setFillPattern(tplCategoryCellStyle.getFillPattern());
                    categoryStyle.setAlignment(tplCategoryCellStyle.getAlignment());
                    categoryStyle.setVerticalAlignment(tplCategoryCellStyle.getVerticalAlignment());
                    Font tplCatFont = workbook.getFontAt(tplCategoryCellStyle.getFontIndex());
                    categoryFont.setFontName(tplCatFont.getFontName());
                    categoryFont.setFontHeightInPoints(tplCatFont.getFontHeightInPoints());
                    categoryFont.setBold(true);
                } catch (Exception ignored) {
                    categoryStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
                    categoryStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                }
            } else {
                categoryStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
                categoryStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            }
            categoryStyle.setFont(categoryFont);
            applyThinBorder(categoryStyle);

            CellStyle checkStandardStyle = workbook.createCellStyle();
            checkStandardStyle.cloneStyleFrom(dataStyle);
            checkStandardStyle.setAlignment(HorizontalAlignment.CENTER);

            // 데이터 채우기
            for (int i = 0; i < dataRows.size(); i++) {
                int rowIdx = DATA_START_ROW + i;
                Row row = sheet.createRow(rowIdx);
                String[] values = dataRows.get(i);

                for (int c = 0; c < COL_COUNT; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(values[c] != null ? values[c] : "");

                    if (c == 0 && values[c] != null && !values[c].isBlank()) {
                        cell.setCellStyle(categoryStyle);
                    } else if (c == 6) {
                        cell.setCellStyle(checkStandardStyle);
                    } else {
                        cell.setCellStyle(dataStyle);
                    }
                }
            }

            // 푸터
            int dataEndRow = DATA_START_ROW + Math.max(dataRows.size() - 1, 0);
            int footerRowIdx = dataEndRow + 3;

            Font footerFont = workbook.createFont();
            footerFont.setFontName(dataFont.getFontName());
            footerFont.setFontHeightInPoints(dataFont.getFontHeightInPoints());
            footerFont.setBold(true);

            CellStyle footerStyle = workbook.createCellStyle();
            footerStyle.setFont(footerFont);
            footerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            Row footerRow = sheet.createRow(footerRowIdx);
            Cell fCell1 = footerRow.createCell(0);
            fCell1.setCellValue(footerLeft);
            fCell1.setCellStyle(footerStyle);
            sheet.addMergedRegion(new CellRangeAddress(footerRowIdx, footerRowIdx, 0, 2));

            Cell fCell2 = footerRow.createCell(4);
            fCell2.setCellValue(footerRight);
            fCell2.setCellStyle(footerStyle);
            sheet.addMergedRegion(new CellRangeAddress(footerRowIdx, footerRowIdx, 4, 6));

            workbook.write(out);
            workbook.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("엑셀 다운로드 실패: " + e.getMessage(), e);
        }
    }

    private void validateExcelTemplate(Sheet sheet) {
        int lastRow = sheet.getLastRowNum();
        if (lastRow < 4) throw new BadRequestException("엑셀 파일의 행 수가 부족합니다. 최소 5행 이상이어야 합니다.");

        Row row0 = sheet.getRow(0);
        if (row0 == null) throw new BadRequestException("1행이 존재하지 않습니다.");
        boolean row0HasValue = false;
        for (int c = 0; c <= 8; c++) {
            if (!getCellValue(row0, c).isBlank()) { row0HasValue = true; break; }
        }
        if (!row0HasValue) throw new BadRequestException("1행에 제목 텍스트가 없습니다.");

        Row row1 = sheet.getRow(1);
        if (row1 == null) throw new BadRequestException("2행이 존재하지 않습니다.");
        if (!getCellValue(row1, 0).contains("점검일자")) throw new BadRequestException("2행 A열에 '점검일자:' 텍스트가 없습니다.");
        if (!getCellValue(row1, 4).contains("점검자")) throw new BadRequestException("2행 E열에 '점검자:' 텍스트가 없습니다.");

        String[] expectedHeaders = {"구분", "점검항목", "점검내용", "정상", "이상", "비고", "점검기준", "조치사항", "확인"};
        Row headerRow = sheet.getRow(3);
        if (headerRow == null) throw new BadRequestException("4행에 헤더가 없습니다.");
        for (int c = 0; c < expectedHeaders.length; c++) {
            String actual = getCellValue(headerRow, c).trim();
            if (!expectedHeaders[c].equals(actual)) {
                throw new BadRequestException("4행 " + (char)('A' + c) + "열: 기대값='" + expectedHeaders[c] + "', 실제값='" + actual + "'");
            }
        }
    }

    private String getCellValue(Row row, int colIndex) {
        if (row == null) return "";
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getStringCellValue().trim();
            default -> "";
        };
    }

    private void applyThinBorder(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    // Excel parse result DTO
    public record ExcelParseResult(
            String title, String checkDate, String checker,
            String checkManager, String facilityManager,
            List<ChecklistItemRequest> items
    ) {}
}

package com.smartehs.service;

import com.smartehs.model.HealthCheckupRecord;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * KMI 한국의학연구소 일반건강검진 결과지 파싱.
 * 단일 양식 지원 (이 양식 외 PDF는 정확히 추출 안 될 수 있음).
 */
@Slf4j
@Service
public class HealthCheckupPdfParser {

    /** PDF InputStream → HealthCheckupRecord 추출 */
    public HealthCheckupRecord parse(InputStream pdfStream) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdfStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(doc);
            return parseText(text);
        }
    }

    HealthCheckupRecord parseText(String text) {
        HealthCheckupRecord r = new HealthCheckupRecord();

        r.setName(extract(text, "수검자\\s*성명\\s*([\\p{IsHangul}]{2,5})"));
        r.setExamDate(extractDate(text));
        r.setHospitalName(extractHospital(text));
        r.setAge(extractInt(text, "연령\\s*(\\d{1,3})\\s*세"));

        // 고혈압 (수축기/이완기)
        Matcher bp = Pattern.compile("고혈압\\s*\\(?수축기\\s*/\\s*이완기\\)?\\s*(\\d{2,3})\\s*/\\s*(\\d{2,3})\\s*mmHg").matcher(text);
        if (bp.find()) {
            r.setBpSystolic(Integer.parseInt(bp.group(1)));
            r.setBpDiastolic(Integer.parseInt(bp.group(2)));
        }
        r.setBpGrade(deriveBpGrade(r.getBpSystolic(), r.getBpDiastolic()));

        // 약물치료 (전체 진찰 문진의 약물치료가 무/유)
        String medAll = extract(text, "약물치료\\s*([무유])");
        // 단일 약물치료 필드만 있고 질환별로 분리되지 않음 — 동일 값 사용
        r.setBpMed(medAll);
        r.setDmMed(medAll);
        r.setLipidMed(medAll);

        // 공복혈당
        r.setBst(extractInt(text, "공복혈당\\s*\\(mg/dL\\)\\s*(\\d{2,4})"));
        r.setDmGrade(deriveDmGrade(r.getBst()));

        // 콜레스테롤
        r.setTc(extractInt(text, "총콜레스테롤\\s*\\(mg/dL\\)\\s*(\\d{2,4})"));
        r.setHdl(extractInt(text, "고밀도콜레스테롤\\s*\\(mg/dL\\)\\s*(\\d{2,4})"));
        r.setTg(extractInt(text, "중성지방\\s*\\(mg/dL\\)\\s*(\\d{2,4})"));
        r.setLdl(extractInt(text, "저밀도콜레스테롤\\s*\\(mg/dL\\)\\s*(\\d{2,4})"));
        r.setLipidGrade(deriveLipidGrade(r.getTc(), r.getLdl(), r.getHdl(), r.getTg()));

        r.setFollowUp(extractFollowUp(text));

        return r;
    }

    private String extract(String text, String regex) {
        Matcher m = Pattern.compile(regex).matcher(text);
        return m.find() ? m.group(1).trim() : null;
    }

    private Integer extractInt(String text, String regex) {
        String s = extract(text, regex);
        if (s == null) return null;
        try { return Integer.parseInt(s); }
        catch (NumberFormatException e) { return null; }
    }

    private String extractDate(String text) {
        Matcher m = Pattern.compile("검진일\\s*(\\d{4})\\s*년\\s*(\\d{1,2})\\s*월\\s*(\\d{1,2})\\s*일").matcher(text);
        if (m.find()) {
            return String.format("%s-%02d-%02d",
                    m.group(1), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3)));
        }
        return null;
    }

    private String extractHospital(String text) {
        Matcher m = Pattern.compile("\\(?재\\)?([\\p{IsHangul}]+의원|[\\p{IsHangul}]+의원\\s*[\\p{IsHangul}]+)").matcher(text);
        if (m.find()) return m.group().trim();
        if (text.contains("한국의학연구소")) return "한국의학연구소";
        return null;
    }

    private String extractFollowUp(String text) {
        // "▷ 기타 :" 다음부터 "※"까지의 텍스트 추출
        Matcher m = Pattern.compile("▷\\s*기타\\s*:\\s*([\\s\\S]+?)(?=※|▷|$)").matcher(text);
        if (m.find()) return m.group(1).trim();
        return null;
    }

    static String deriveBpGrade(Integer sys, Integer dia) {
        if (sys == null || dia == null) return null;
        if (sys >= 140 || dia >= 90) return "고혈압의심";
        if (sys >= 120 || dia >= 80) return "고혈압전단계";
        return "정상";
    }

    static String deriveDmGrade(Integer bst) {
        if (bst == null) return null;
        if (bst >= 126) return "당뇨병의심";
        if (bst >= 100) return "공복혈당장애의심";
        return "정상";
    }

    static String deriveLipidGrade(Integer tc, Integer ldl, Integer hdl, Integer tg) {
        if (tc == null && ldl == null && hdl == null && tg == null) return null;
        if (tc != null && tc >= 240) return "고콜레스테롤혈증의심";
        if (ldl != null && ldl >= 130) return "고콜레스테롤혈증의심";
        if (tg != null && tg >= 150) return "고중성지방혈증의심";
        if (hdl != null && hdl < 40) return "낮은HDL콜레스테롤의심";
        return "정상";
    }
}

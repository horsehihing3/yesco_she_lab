package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 작업환경측정 더미데이터 보강 — Flyway 비활성 환경에서도 V150 와 동일.
 *
 * 빈 테이블(또는 3건 미만)일 때만 시드 데이터 삽입.
 * 컴플라이언스 대시보드/통보·보고/개선조치 탭에서 의미있는 데이터 표시용.
 */
@Slf4j
@Order(80)
@Component
@RequiredArgsConstructor
public class WemRicherDummyDataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            seedFactors();
            seedPlans();
            seedResults();
            seedImprovements();
        } catch (Exception e) {
            log.warn("WEM 더미데이터 시드 실패", e);
        }
    }

    private boolean tableHasFewerRows(String table, int threshold) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (exists == null || exists == 0) return false;
            Integer rows = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
            return rows == null || rows < threshold;
        } catch (Exception e) {
            return false;
        }
    }

    private void seedFactors() {
        if (!tableHasFewerRows("tb_wem_factor", 3)) return;
        String sql = "INSERT INTO tb_wem_factor (factor_name, factor_name_en, cas_number, factor_type, twa, stel, ceiling_value, unit, msds_linked, is_permitted, used_process, remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        Object[][] rows = {
            {"벤젠",          "Benzene",              "71-43-2",    "ORGANIC",  "0.5",   "2.5",   null, "ppm",   1, 1, "도장공정 #1, #2 / 세척",                "발암 1A · 우선관리물질"},
            {"톨루엔",        "Toluene",              "108-88-3",   "ORGANIC",  "50",    "150",   null, "ppm",   1, 0, "도장공정 #1, #2 / 인쇄 / 세척 / 접착",  "화학적 인자"},
            {"크실렌",        "Xylene",               "1330-20-7",  "ORGANIC",  "100",   "150",   null, "ppm",   1, 0, "도장공정 #1, #2 / 인쇄 / 코팅",         "화학적 인자"},
            {"결정형 유리규산", "Crystalline Silica",   "14808-60-7", "DUST",     "0.05",  null,    null, "mg/㎥", 1, 1, "절단공정 #2, #3 / 연마",                "발암 1A · 호흡성분진"},
            {"소음",          "Noise",                null,         "PHYSICAL", "90",    null,    "140","dB(A)", 0, 0, "용접공정 #1, #2 / 절단공정 / 조립",     "8h TWA 90 / 충격소음 140 Peak"},
            {"용접흄",        "Welding Fume",         null,         "DUST",     "5",     null,    null, "mg/㎥", 1, 0, "용접공정 #1, #2",                        "Mn, Cr 함유"},
            {"디클로로메탄",  "DCM",                  "75-09-2",    "ORGANIC",  "50",    null,    null, "ppm",   1, 0, "세척 / 박리",                            "화학적 인자"},
            {"포름알데히드",  "Formaldehyde",         "50-00-0",    "ORGANIC",  "0.3",   null,    "1",  "ppm",   1, 1, "접착 / 도장공정",                        "발암 1B · Ceiling 1ppm"},
            {"MEK",           "Methyl Ethyl Ketone",  "78-93-3",    "ORGANIC",  "200",   "300",   null, "ppm",   1, 0, "도장공정 #2 / 세척",                    "화학적 인자"},
            {"망간",          "Manganese",            "7439-96-5",  "METAL",    "1",     null,    null, "mg/㎥", 1, 0, "용접공정 #1, #2",                        "금속 분진/흄"},
        };
        int total = 0;
        for (Object[] r : rows) total += jdbcTemplate.update(sql, r);
        if (total > 0) log.info("WEM tb_wem_factor 시드: {}건", total);
    }

    private void seedPlans() {
        if (!tableHasFewerRows("tb_wem_plan", 3)) return;
        String sql = "INSERT INTO tb_wem_plan (plan_year, process_name, department, hazard_type, measurement_cycle, last_measurement_date, next_measurement_date, status, measurement_agency, agency_code, contract_period, remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        Object[][] rows = {
            {2026, "도장공정 #1", "생산기술팀", "ORGANIC",  "6개월", "2026-03-12", "2026-09-12", "PLANNED",  "㈜한국위생환경",  "서울-2024-058", "2025-01-01 ~ 2026-12-31", "톨루엔/크실렌/MEK"},
            {2026, "도장공정 #2", "생산기술팀", "ORGANIC",  "3개월", "2026-04-22", "2026-07-22", "EXCEED",   "㈜한국위생환경",  "서울-2024-058", "2025-01-01 ~ 2026-12-31", "톨루엔 노출기준 초과 → 단축 측정"},
            {2026, "용접공정 #1", "생산기술팀", "PHYSICAL", "6개월", "2025-10-15", "2026-04-15", "OVERDUE",  "대한산업보건원",  "경기-2023-112", "2024-07-01 ~ 2027-06-30", "기한 초과 — 즉시 측정 필요"},
            {2026, "용접공정 #2", "생산기술팀", "PHYSICAL", "6개월", "2026-04-08", "2026-10-08", "PLANNED",  "대한산업보건원",  "경기-2023-112", "2024-07-01 ~ 2027-06-30", "용접흄/소음/Mn"},
            {2026, "절단공정 #1", "생산팀",     "DUST",     "6개월", "2026-04-15", "2026-10-15", "PLANNED",  "㈜그린환경기술",  "인천-2024-021", "2024-10-01 ~ 2026-09-30", "결정형 유리규산"},
            {2026, "절단공정 #2", "생산팀",     "DUST",     "3개월", "2026-03-28", "2026-06-28", "PLANNED",  "㈜그린환경기술",  "인천-2024-021", "2024-10-01 ~ 2026-09-30", "발암성 → 단축 측정"},
            {2026, "절단공정 #3", "생산팀",     "DUST",     "3개월", "2025-11-20", "2026-02-20", "OVERDUE",  "㈜그린환경기술",  "인천-2024-021", "2024-10-01 ~ 2026-09-30", "분진 발암성 인자"},
            {2026, "조립공정 #1", "생산팀",     "PHYSICAL", "6개월", "2026-04-15", "2026-10-15", "PLANNED",  "대한산업보건원",  "경기-2023-112", "2024-07-01 ~ 2027-06-30", "소음"},
            {2026, "포장공정 #1", "물류팀",     "DUST",     "6개월", "2026-03-20", "2026-09-20", "PLANNED",  "㈜그린환경기술",  "인천-2024-021", "2024-10-01 ~ 2026-09-30", "소음/분진"},
        };
        int total = 0;
        for (Object[] r : rows) total += jdbcTemplate.update(sql, r);
        if (total > 0) log.info("WEM tb_wem_plan 시드: {}건", total);
    }

    private void seedResults() {
        if (!tableHasFewerRows("tb_wem_result", 3)) return;
        String sql = "INSERT INTO tb_wem_result (process_name, factor_name, sample_type, measured_value, twa_value, stel_value, exposure_standard, exceed_rate, judgment, has_report, measurement_date, measurement_agency, remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
        Object[][] rows = {
            {"도장공정 #2", "톨루엔",      "PERSONAL", "67.0", "67.0", "102.0", "50",   134, "EXCEED_1X", 1, "2026-04-22", "㈜한국위생환경",  "시료 P-01 · 노출지수 1.34"},
            {"도장공정 #2", "크실렌",      "PERSONAL", "42.3", "42.3", "60.5",  "100",  42,  "NORMAL",    1, "2026-04-22", "㈜한국위생환경",  "시료 P-02"},
            {"도장공정 #2", "MEK",         "PERSONAL", "88.5", "88.5", "120.0", "200",  44,  "NORMAL",    1, "2026-04-22", "㈜한국위생환경",  "시료 P-03"},
            {"도장공정 #1", "톨루엔",      "PERSONAL", "20.5", "20.5", "32.0",  "50",   41,  "NORMAL",    1, "2026-03-12", "㈜한국위생환경",  "시료 P-01"},
            {"조립공정 #1", "소음",        "PERSONAL", "78",   "78",   "85",    "90",   31,  "NORMAL",    1, "2026-04-15", "대한산업보건원",  "8h TWA 78dB(A)"},
            {"용접공정 #2", "용접흄",      "PERSONAL", "2.4",  "2.4",  "4.0",   "5",    48,  "NORMAL",    1, "2026-04-08", "대한산업보건원",  "8개 시료"},
            {"용접공정 #2", "망간",        "PERSONAL", "0.32", "0.32", "0.55",  "1",    32,  "NORMAL",    1, "2026-04-08", "대한산업보건원",  "금속 분석"},
            {"절단공정 #2", "결정형 유리규산", "AREA", "0.041","0.041",null,    "0.05", 82,  "NORMAL",    1, "2026-03-28", "㈜그린환경기술",  "발암성 단축측정"},
            {"포장공정 #1", "소음",        "PERSONAL", "76",   "76",   null,    "90",   18,  "NORMAL",    1, "2026-03-20", "㈜그린환경기술",  "시료 4점"},
        };
        int total = 0;
        for (Object[] r : rows) total += jdbcTemplate.update(sql, r);
        if (total > 0) log.info("WEM tb_wem_result 시드: {}건", total);
    }

    private void seedImprovements() {
        if (!tableHasFewerRows("tb_wem_improvement", 3)) return;
        String sql = "INSERT INTO tb_wem_improvement (process_name, factor_name, measured_value, exposure_standard, exceed_rate, exceed_level, department, measurement_date, measurement_agency, deadline, improvement_plan, status, completion_date, remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        Object[][] rows = {
            {"도장공정 #2", "톨루엔",     "67.0",  "50",   134, "EXCEED_1X", "생산기술팀", "2026-04-22", "㈜한국위생환경", "2026-05-13", "국소배기장치 풍속 점검(0.4→0.7m/s) · 방독마스크 RPE 지급 · 저VOC 도료 대체 검토 · 개선 후 재측정", "IN_PROGRESS", null,         "CASE WE-2026-014 · 책임자 박지훈"},
            {"절단공정 #3", "결정형 유리규산", "0.061", "0.05", 122, "EXCEED_1X", "안전팀",     "2026-03-28", "㈜그린환경기술", "2026-06-15", "습식작업 도입 · 집진기 용량 증설 · N95 마스크 · 특수건강진단 연계",                              "IN_PROGRESS", null,         "CASE WE-2026-011 · 책임자 이수정 · 진행률 75%"},
            {"용접공정 #1", "소음",       "94",    "90",   104, "EXCEED_1X", "시설팀",     "2025-09-15", "대한산업보건원", "2025-11-30", "소음원 방음커버 시공 · 흡음 패널 추가 · 청력보호구 의무 착용 표시",                            "COMPLETED",   "2025-11-25", "CASE WE-2026-007 · 개선 전 94dB → 개선 후 82dB (-12dB)"},
        };
        int total = 0;
        for (Object[] r : rows) total += jdbcTemplate.update(sql, r);
        if (total > 0) log.info("WEM tb_wem_improvement 시드: {}건", total);
    }
}

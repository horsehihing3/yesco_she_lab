package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 보호구·장비(PPE) 8개 도메인 더미데이터 시드.
 * - Order(60): Schema(40) + Code(45) + PersonRefColumns(50) 이후 실행
 * - 멱등: 각 테이블에 데이터가 이미 있으면 스킵
 * - PersonRef created_by/modified_by 는 시드 사용자(SYSTEM SEED)로 채움
 */
@Slf4j
@Order(60)
@Component
@RequiredArgsConstructor
public class PpeDummyDataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    // 작성자 — T_IDM_USER 채지환 (UID:288146, 생산/운영혁신)EHS Part)
    private static final String SEED_PERSON_REF = "{\"userId\":288146,\"name\":\"채지환\",\"team\":\"생산/운영혁신)EHS Part\",\"position\":\"사원\"}";

    @Override
    public void run(String... args) {
        seedItems();
        seedStocks();
        seedInouts();
        seedIssues();
        seedInspections();
        seedWears();
        seedPerformances();
        seedBudgets();
    }

    private boolean isEmpty(String table) {
        Integer cnt = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM " + table + " WHERE is_deleted = 0", Integer.class);
        return cnt == null || cnt == 0;
    }

    // ────────────────────────────────────────────────────────────────
    // 1. 품목 마스터
    // ────────────────────────────────────────────────────────────────
    private void seedItems() {
        if (!isEmpty("tb_ppe_item")) return;
        Object[][] data = {
            // code, name, category, modelNo, kcCertNo, grade, supplier, price, cycle, certExpiry, minStock, note
            {"PPE-001", "산업용 안전모 ABS형",     "HEAD",        "SH-100A",  "KCS-2024-0123", "1등급", "대한안전(주)",       18000,  24, "2025-12-31", 50,  ""},
            {"PPE-002", "방진 마스크 1급",         "RESPIRATORY", "DS-M1000", "KCS-2023-0456", "1급",   "안전산업(주)",       3500,   3,  "2025-03-31", 200, "필터 월 1회 교체"},
            {"PPE-003", "안전화 중편 S1P",         "FOOT",        "SF-700S",  "KCS-2024-0789", "S1P",   "대한안전(주)",       85000,  12, "2026-06-30", 30,  ""},
            {"PPE-004", "차광 보안경 2호",         "EYE",         "EG-2000",  "KCS-2023-0321", "2호",   "세이프티코리아",     12000,  6,  "2025-08-31", 40,  "용접 작업용"},
            {"PPE-005", "안전 장갑 가죽제",        "HAND",        "GL-L100",  "",              "일반",  "안전산업(주)",       4500,   3,  null,         100, ""},
            {"PPE-006", "추락 방지 안전대 Y형",    "FALL",        "HL-Y200",  "KCS-2024-0555", "특급",  "한국안전(주)",       145000, 24, "2026-03-31", 20,  "6개월 정기검사 필수"},
            {"PPE-007", "귀마개 EP-3",             "HEARING",     "EP-3000",  "KCS-2023-0999", "일반",  "세이프티코리아",     500,    1,  "2025-09-30", 300, ""},
            {"PPE-008", "방화 방호복 상하",        "BODY",        "FR-200",   "KCS-2024-0777", "특급",  "한국안전(주)",       280000, 36, "2026-12-31", 10,  ""},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_item (item_code, name, category, model_no, kc_cert_no, grade, supplier, " +
                "unit_price, replace_cycle, cert_expiry, min_stock, note, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8],
                r[9] != null ? LocalDate.parse((String) r[9]) : null,
                r[10], r[11],
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 품목 {}건 시드", data.length);
    }

    // ────────────────────────────────────────────────────────────────
    // 2. 재고
    // ────────────────────────────────────────────────────────────────
    private void seedStocks() {
        if (!isEmpty("tb_ppe_stock")) return;
        Object[][] data = {
            // itemId, itemName, location, qty, minQty, optQty, expiryDate
            {1L, "산업용 안전모 ABS형",   "CENTRAL", 120, 50,  100, "2026-12-31"},
            {2L, "방진 마스크 1급",       "SAFETY",  85,  200, 300, "2025-08-31"},
            {3L, "안전화 중편 S1P",       "CENTRAL", 45,  30,  60,  "2027-06-30"},
            {4L, "차광 보안경 2호",       "FIELD_A", 18,  40,  60,  "2026-08-31"},
            {5L, "안전 장갑 가죽제",      "FIELD_B", 320, 100, 200, "2025-07-31"},
            {6L, "추락 방지 안전대 Y형",  "CENTRAL", 28,  20,  40,  "2028-03-31"},
            {7L, "귀마개 EP-3",           "SAFETY",  580, 300, 500, "2025-09-30"},
            {8L, "방화 방호복 상하",      "CENTRAL", 12,  10,  20,  "2028-12-31"},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_stock (item_id, item_name, location, quantity, min_qty, opt_qty, expiry_date, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                r[0], r[1], r[2], r[3], r[4], r[5], LocalDate.parse((String) r[6]),
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 재고 {}건 시드", data.length);
    }

    // ────────────────────────────────────────────────────────────────
    // 3. 입출고
    // ────────────────────────────────────────────────────────────────
    private void seedInouts() {
        if (!isEmpty("tb_ppe_inout")) return;
        Object[][] data = {
            {"2026-06-01", 1L, "산업용 안전모 ABS형",  "IN",  50, "CENTRAL", "채지환"},
            {"2026-06-05", 2L, "방진 마스크 1급",      "OUT", 30, "SAFETY",  "하건우"},
            {"2026-06-10", 3L, "안전화 중편 S1P",      "IN",  20, "CENTRAL", "채지환"},
            {"2026-06-12", 5L, "안전 장갑 가죽제",     "OUT", 50, "FIELD_B", "김형진"},
            {"2026-06-15", 7L, "귀마개 EP-3",          "IN",  200,"SAFETY",  "채지환"},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_inout (inout_date, item_id, item_name, inout_type, quantity, location, manager, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                LocalDate.parse((String) r[0]), r[1], r[2], r[3], r[4], r[5], r[6],
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 입출고 {}건 시드", data.length);
    }

    // ────────────────────────────────────────────────────────────────
    // 4. 지급·반납
    // ────────────────────────────────────────────────────────────────
    private void seedIssues() {
        if (!isEmpty("tb_ppe_issue")) return;
        Object[][] data = {
            // 실제 T_IDM_USER 활성 사용자 (Operation팀 5명)
            {"2026-06-01", "이용준", "2607655", "생산/운영혁신)Operation팀", 1L, "산업용 안전모 ABS형",  1, "NEW",    "2028-06-01", "ISSUED",  true},
            {"2026-06-02", "전시아", "2681728", "생산/운영혁신)Operation팀", 2L, "방진 마스크 1급",      2, "CYCLE",  "2026-09-02", "ISSUED",  true},
            {"2026-06-03", "조정민", "2002406", "생산/운영혁신)Operation팀", 6L, "추락 방지 안전대 Y형",  1, "NEW",    "2028-06-03", "ISSUED",  true},
            {"2026-06-05", "백나현", "2613879", "생산/운영혁신)Operation팀", 4L, "차광 보안경 2호",      1, "DAMAGE", "2026-12-05", "REPLACE", false},
            {"2026-06-07", "허서영", "2620696", "생산/운영혁신)Operation팀", 3L, "안전화 중편 S1P",      1, "NEW",    "2027-06-07", "LOSS",    true},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_issue (issue_date, worker_name, emp_id, department, item_id, item_name, quantity, " +
                "issue_reason, return_date, status, signed, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                LocalDate.parse((String) r[0]), r[1], r[2], r[3], r[4], r[5], r[6], r[7],
                LocalDate.parse((String) r[8]), r[9], r[10],
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 지급·반납 {}건 시드", data.length);
    }

    // ────────────────────────────────────────────────────────────────
    // 5. 검사·점검
    // ────────────────────────────────────────────────────────────────
    private void seedInspections() {
        if (!isEmpty("tb_ppe_inspection")) return;
        Object[][] data = {
            // 점검자: EHS Part 3명 (채지환·하건우·김형진)
            {"2026-06-01", 6L, "추락 방지 안전대 Y형",  "PPE-006", "REGULAR", "채지환", "PASS",         "2026-12-01", "이상 없음"},
            {"2026-06-05", 2L, "방진 마스크 1급",       "PPE-002", "SELF",    "하건우", "CONDITIONAL",  "2026-07-05", "필터 교체 필요"},
            {"2026-06-08", 4L, "차광 보안경 2호",       "PPE-004", "PRE",     "김형진", "FAIL",         "2026-06-15", "렌즈 파손, 사용 중지"},
            {"2026-05-20", 1L, "산업용 안전모 ABS형",   "PPE-001", "SELF",    "채지환", "PASS",         "2026-11-20", "정상"},
            {"2026-04-10", 3L, "안전화 중편 S1P",       "PPE-003", "REGULAR", "하건우", "DISPOSE",      null,         "밑창 분리, 즉시 폐기 처리"},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_inspection (inspection_date, item_id, item_name, item_code, inspection_type, " +
                "inspector, result, next_date, note, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                LocalDate.parse((String) r[0]), r[1], r[2], r[3], r[4], r[5], r[6],
                r[7] != null ? LocalDate.parse((String) r[7]) : null, r[8],
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 검사·점검 {}건 시드", data.length);
    }

    // ────────────────────────────────────────────────────────────────
    // 6. 착용 이행
    // ────────────────────────────────────────────────────────────────
    private void seedWears() {
        if (!isEmpty("tb_ppe_wear")) return;
        Object[][] data = {
            // 근로자: Operation팀 5명, 확인자: EHS Part 3명
            {"2026-06-10T09:00", "이용준", "생산/운영혁신)Operation팀", "A동 프레스실",  "안전모, 안전화, 장갑",        "OK",        "채지환", ""},
            {"2026-06-10T10:30", "전시아", "생산/운영혁신)Operation팀", "B동 용접실",    "안전모, 보안경, 방진마스크",  "IMPROPER",  "하건우", "마스크 미착용 → 즉시 착용 지도"},
            {"2026-06-11T08:45", "조정민", "생산/운영혁신)Operation팀", "옥상 설비구역", "안전모, 안전대, 안전화",      "OK",        "김형진", ""},
            {"2026-06-11T14:00", "백나현", "생산/운영혁신)Operation팀", "A동 프레스실",  "안전모, 안전화, 귀마개",      "VIOLATION", "채지환", "귀마개 미착용 → 교육 실시, 보호구 지급"},
            {"2026-06-12T09:15", "허서영", "생산/운영혁신)Operation팀", "C동 검사실",    "안전화, 보안경",              "OK",        "하건우", ""},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_wear (check_datetime, worker_name, department, work_zone, required_ppe, " +
                "wear_status, checker, action_taken, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                LocalDateTime.parse((String) r[0]), r[1], r[2], r[3], r[4], r[5], r[6], r[7],
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 착용 이행 {}건 시드", data.length);
    }

    // ────────────────────────────────────────────────────────────────
    // 7. 성능 평가
    // ────────────────────────────────────────────────────────────────
    private void seedPerformances() {
        if (!isEmpty("tb_ppe_performance")) return;
        Object[][] data = {
            // 평가자: EHS Part 3명
            {"2026-06-01", 2L, "방진 마스크 1급",      "분진포집효율",        "80% 이상",   "87.3%",     "MEET",  "하건우"},
            {"2026-06-03", 1L, "산업용 안전모 ABS형",  "내관통성(추 낙하)",   "관통 없음",  "관통 없음", "MEET",  "채지환"},
            {"2026-06-05", 4L, "차광 보안경 2호",      "광투과율",            "3~8%",       "12.4%",     "BELOW", "김형진"},
            {"2026-06-08", 6L, "추락 방지 안전대 Y형", "최대하중",            "15kN 이상",  "18.2kN",    "MEET",  "채지환"},
            {"2026-06-10", 7L, "귀마개 EP-3",          "차음값(SNR)",         "25dB 이상",  "22dB",      "BELOW", "하건우"},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_performance (evaluation_date, item_id, item_name, performance_standard, " +
                "standard_value, measured_value, result, evaluator, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                LocalDate.parse((String) r[0]), r[1], r[2], r[3], r[4], r[5], r[6], r[7],
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 성능 평가 {}건 시드", data.length);
    }

    // ────────────────────────────────────────────────────────────────
    // 8. 비용·예산 (현재 연도 5개 부서)
    // ────────────────────────────────────────────────────────────────
    private void seedBudgets() {
        if (!isEmpty("tb_ppe_budget")) return;
        int year = LocalDate.now().getYear();
        Object[][] data = {
            // 실제 부서명 (Operation팀·EHS Part·구매팀 등)
            {year, "생산/운영혁신)Operation팀",  35_000_000L, 24_800_000L},
            {year, "생산/운영혁신)EHS Part",     12_000_000L,  8_400_000L},
            {year, "생산/운영혁신)구매팀",       15_000_000L,  9_200_000L},
            {year, "생산/운영혁신)RCubeWZ개발팀", 8_000_000L,  4_200_000L},
            {year, "생산/운영혁신)Field Quality", 7_000_000L,  3_400_000L},
        };
        for (Object[] r : data) {
            jdbcTemplate.update(
                "INSERT INTO tb_ppe_budget (budget_year, department, budget_amount, spent_amount, " +
                "created_by, modified_by, created_at, modified_at, is_deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME(), 0)",
                r[0], r[1], r[2], r[3],
                SEED_PERSON_REF, SEED_PERSON_REF
            );
        }
        log.info("PpeDummyData: 예산 {}건 시드", data.length);
    }
}

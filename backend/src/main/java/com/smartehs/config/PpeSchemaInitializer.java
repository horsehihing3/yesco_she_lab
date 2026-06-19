package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 보호구·장비(PPE) 8개 도메인 테이블 초기 생성기. Flyway 비활성이라 스키마는 Initializer 로 관리.
 * Order(40): PersonRefColumnsInitializer(50) 보다 먼저 실행되어 메타 컬럼이 미리 존재하도록.
 *
 * 도메인:
 *  1. tb_ppe_item          — 품목 마스터
 *  2. tb_ppe_stock         — 창고별 재고
 *  3. tb_ppe_inout         — 입출고 이력
 *  4. tb_ppe_issue         — 지급·반납
 *  5. tb_ppe_inspection    — 검사·점검
 *  6. tb_ppe_wear          — 착용 이행
 *  7. tb_ppe_performance   — 성능 평가
 *  8. tb_ppe_budget        — 비용·예산
 *
 * 공통 메타 컬럼(8개 테이블 동일): created_by/modified_by NVARCHAR(MAX, PersonRef JSON),
 *   created_at/modified_at DATETIME2, is_deleted BIT.
 */
@Slf4j
@Order(40)
@Component
@RequiredArgsConstructor
public class PpeSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        int created = 0;
        created += createIfMissing("tb_ppe_item",        ITEM_DDL);
        created += createIfMissing("tb_ppe_stock",       STOCK_DDL);
        created += createIfMissing("tb_ppe_inout",       INOUT_DDL);
        created += createIfMissing("tb_ppe_issue",       ISSUE_DDL);
        created += createIfMissing("tb_ppe_inspection",  INSPECTION_DDL);
        created += createIfMissing("tb_ppe_wear",        WEAR_DDL);
        created += createIfMissing("tb_ppe_performance", PERFORMANCE_DDL);
        created += createIfMissing("tb_ppe_budget",      BUDGET_DDL);
        log.info("PpeSchemaInitializer: 보호구·장비 테이블 {}개 신규 생성", created);
    }

    private int createIfMissing(String table, String ddl) {
        Integer exists = jdbcTemplate.queryForObject(
            "SELECT CASE WHEN OBJECT_ID(?, 'U') IS NULL THEN 0 ELSE 1 END",
            Integer.class, table);
        if (exists != null && exists == 1) return 0;
        jdbcTemplate.execute(ddl);
        return 1;
    }

    // ── 1. 품목 마스터 ────────────────────────────────────────────────
    private static final String ITEM_DDL =
        "CREATE TABLE tb_ppe_item (" +
        "  id              BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  item_code       NVARCHAR(50)  NULL," +     // PPE-001 등
        "  name            NVARCHAR(200) NOT NULL," + // 품목명
        "  category        NVARCHAR(100) NULL," +     // 두부보호/호흡기/발/눈/손/추락/청력/전신
        "  model_no        NVARCHAR(100) NULL," +     // 모델번호
        "  kc_cert_no      NVARCHAR(100) NULL," +     // KC 인증번호
        "  grade           NVARCHAR(50)  NULL," +     // 성능 등급
        "  supplier        NVARCHAR(200) NULL," +     // 공급업체
        "  unit_price      INT           NULL," +     // 단가(원)
        "  replace_cycle   INT           NULL," +     // 교체 주기(개월)
        "  cert_expiry     DATE          NULL," +     // 인증 만료일
        "  min_stock       INT           NULL," +     // 최소 재고 기준
        "  note            NVARCHAR(MAX) NULL," +
        "  created_by      NVARCHAR(MAX) NULL," +
        "  modified_by     NVARCHAR(MAX) NULL," +
        "  created_at      DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at     DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted      BIT           NOT NULL DEFAULT 0" +
        ")";

    // ── 2. 창고별 재고 ────────────────────────────────────────────────
    private static final String STOCK_DDL =
        "CREATE TABLE tb_ppe_stock (" +
        "  id              BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  item_id         BIGINT        NULL," +     // FK -> tb_ppe_item.id
        "  item_name       NVARCHAR(200) NULL," +     // 비정규화(조회 성능)
        "  location        NVARCHAR(100) NULL," +     // 중앙창고/안전용품창고/현장창고A/현장창고B
        "  quantity        INT           NULL," +     // 현재고
        "  min_qty         INT           NULL," +     // 최소 기준
        "  opt_qty         INT           NULL," +     // 적정 재고
        "  expiry_date     DATE          NULL," +     // 유효 기간
        "  note            NVARCHAR(MAX) NULL," +
        "  created_by      NVARCHAR(MAX) NULL," +
        "  modified_by     NVARCHAR(MAX) NULL," +
        "  created_at      DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at     DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted      BIT           NOT NULL DEFAULT 0" +
        ")";

    // ── 3. 입출고 이력 ────────────────────────────────────────────────
    private static final String INOUT_DDL =
        "CREATE TABLE tb_ppe_inout (" +
        "  id              BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  inout_date      DATE          NULL," +
        "  item_id         BIGINT        NULL," +
        "  item_name       NVARCHAR(200) NULL," +
        "  inout_type      NVARCHAR(20)  NULL," +     // IN(입고) | OUT(출고)
        "  quantity        INT           NULL," +
        "  location        NVARCHAR(100) NULL," +
        "  expiry_date     DATE          NULL," +     // 입고 시 유효 기간
        "  manager         NVARCHAR(100) NULL," +     // 담당자
        "  note            NVARCHAR(MAX) NULL," +
        "  created_by      NVARCHAR(MAX) NULL," +
        "  modified_by     NVARCHAR(MAX) NULL," +
        "  created_at      DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at     DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted      BIT           NOT NULL DEFAULT 0" +
        ")";

    // ── 4. 지급·반납 ─────────────────────────────────────────────────
    private static final String ISSUE_DDL =
        "CREATE TABLE tb_ppe_issue (" +
        "  id              BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  issue_date      DATE          NULL," +
        "  worker_name     NVARCHAR(100) NULL," +
        "  emp_id          NVARCHAR(50)  NULL," +
        "  department      NVARCHAR(100) NULL," +
        "  item_id         BIGINT        NULL," +
        "  item_name       NVARCHAR(200) NULL," +
        "  quantity        INT           NULL," +
        "  issue_reason    NVARCHAR(50)  NULL," +     // 신규지급/정기교체/파손교체/분실재지급
        "  return_date     DATE          NULL," +     // 반납 예정일
        "  status          NVARCHAR(20)  NULL," +     // 지급완료/반납완료/교체요청/분실신고
        "  signed          BIT           NULL DEFAULT 0," +
        "  signature_image NVARCHAR(MAX) NULL," +     // base64 (optional)
        "  note            NVARCHAR(MAX) NULL," +
        "  created_by      NVARCHAR(MAX) NULL," +
        "  modified_by     NVARCHAR(MAX) NULL," +
        "  created_at      DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at     DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted      BIT           NOT NULL DEFAULT 0" +
        ")";

    // ── 5. 검사·점검 ─────────────────────────────────────────────────
    private static final String INSPECTION_DDL =
        "CREATE TABLE tb_ppe_inspection (" +
        "  id               BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  inspection_date  DATE          NULL," +
        "  item_id          BIGINT        NULL," +
        "  item_name        NVARCHAR(200) NULL," +
        "  item_code        NVARCHAR(50)  NULL," +
        "  inspection_type  NVARCHAR(20)  NULL," +    // 정기검사/자체점검/사전점검
        "  inspector        NVARCHAR(100) NULL," +
        "  result           NVARCHAR(20)  NULL," +    // 합격/조건부합격/불합격/폐기
        "  next_date        DATE          NULL," +    // 다음 점검 예정
        "  note             NVARCHAR(MAX) NULL," +
        "  created_by       NVARCHAR(MAX) NULL," +
        "  modified_by      NVARCHAR(MAX) NULL," +
        "  created_at       DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at      DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted       BIT           NOT NULL DEFAULT 0" +
        ")";

    // ── 6. 착용 이행 ─────────────────────────────────────────────────
    private static final String WEAR_DDL =
        "CREATE TABLE tb_ppe_wear (" +
        "  id              BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  check_datetime  DATETIME2     NULL," +
        "  worker_name     NVARCHAR(100) NULL," +
        "  department      NVARCHAR(100) NULL," +
        "  work_zone       NVARCHAR(200) NULL," +
        "  required_ppe    NVARCHAR(500) NULL," +     // 필수 보호구 CSV
        "  wear_status     NVARCHAR(20)  NULL," +     // 착용확인/미착용/부적정착용
        "  checker         NVARCHAR(100) NULL," +
        "  action_taken    NVARCHAR(MAX) NULL," +
        "  note            NVARCHAR(MAX) NULL," +
        "  created_by      NVARCHAR(MAX) NULL," +
        "  modified_by     NVARCHAR(MAX) NULL," +
        "  created_at      DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at     DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted      BIT           NOT NULL DEFAULT 0" +
        ")";

    // ── 7. 성능 평가 ─────────────────────────────────────────────────
    private static final String PERFORMANCE_DDL =
        "CREATE TABLE tb_ppe_performance (" +
        "  id                    BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  evaluation_date       DATE          NULL," +
        "  item_id               BIGINT        NULL," +
        "  item_name             NVARCHAR(200) NULL," +
        "  performance_standard  NVARCHAR(200) NULL," + // 성능 기준 (분진포집효율 등)
        "  standard_value        NVARCHAR(100) NULL," + // 기준치 (80% 이상)
        "  measured_value        NVARCHAR(100) NULL," + // 측정값 (85.3%)
        "  result                NVARCHAR(20)  NULL," + // 기준충족/성능미달/평가중
        "  evaluator             NVARCHAR(100) NULL," +
        "  note                  NVARCHAR(MAX) NULL," +
        "  created_by            NVARCHAR(MAX) NULL," +
        "  modified_by           NVARCHAR(MAX) NULL," +
        "  created_at            DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at           DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted            BIT           NOT NULL DEFAULT 0" +
        ")";

    // ── 8. 비용·예산 ─────────────────────────────────────────────────
    private static final String BUDGET_DDL =
        "CREATE TABLE tb_ppe_budget (" +
        "  id              BIGINT IDENTITY(1,1) PRIMARY KEY," +
        "  budget_year     INT           NULL," +     // 연도
        "  department      NVARCHAR(100) NULL," +     // 부서별 (전체일 경우 NULL)
        "  budget_amount   BIGINT        NULL," +     // 배정 예산(원)
        "  spent_amount    BIGINT        NULL," +     // 집행 금액(원)
        "  note            NVARCHAR(MAX) NULL," +
        "  created_by      NVARCHAR(MAX) NULL," +
        "  modified_by     NVARCHAR(MAX) NULL," +
        "  created_at      DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  modified_at     DATETIME2     NULL DEFAULT SYSDATETIME()," +
        "  is_deleted      BIT           NOT NULL DEFAULT 0" +
        ")";
}

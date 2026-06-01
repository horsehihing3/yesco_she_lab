package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 위험성 평가 관련 테이블에서 빠져있을 수 있는 컬럼을 앱 시작 시 보강한다.
 * Flyway가 비활성화된 환경에서 V85, V97 같은 ALTER 마이그레이션이 누락된 DB에서도
 * 정상 동작하도록 하기 위한 구성.
 */
@Slf4j
@Order(10)
@Component
@RequiredArgsConstructor
public class RiskAssessmentSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureColumn("tb_risk_activity_process", "evaluation_date", "NVARCHAR(30) NULL");
        ensureColumn("tb_risk_activity_process", "evaluator",       "NVARCHAR(500) NULL");
        ensureColumn("tb_risk_assessment",      "form_id",          "BIGINT NULL");
        ensureColumn("tb_risk_assessment",      "form_title",       "NVARCHAR(500) NULL");
        backfillFormTitle();
    }

    /**
     * form_id 는 채워져 있는데 form_title 이 NULL/빈값인 행을 양식 제목으로 1회 백필.
     */
    private void backfillFormTitle() {
        try {
            Integer ok = jdbcTemplate.queryForObject(
                "SELECT CASE WHEN OBJECT_ID('tb_risk_assessment', 'U') IS NOT NULL " +
                "  AND OBJECT_ID('tb_risk_assessment_form', 'U') IS NOT NULL THEN 1 ELSE 0 END",
                Integer.class);
            if (ok == null || ok == 0) return;
            int updated = jdbcTemplate.update(
                "UPDATE a SET a.form_title = f.title " +
                "  FROM tb_risk_assessment a " +
                "  INNER JOIN tb_risk_assessment_form f ON f.id = a.form_id " +
                "  WHERE a.form_id IS NOT NULL " +
                "    AND (a.form_title IS NULL OR LTRIM(RTRIM(a.form_title)) = N'')");
            if (updated > 0) log.info("form_title 백필 완료: {}건", updated);
        } catch (Exception e) {
            log.warn("form_title 백필 실패 (스키마 미준비 가능)", e);
        }
    }

    private void ensureColumn(String table, String column, String typeDef) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (tableExists == null || tableExists == 0) {
                log.debug("{} 테이블이 아직 없어 컬럼 보강 건너뜀: {}", table, column);
                return;
            }
            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
                Integer.class, table, column);
            if (colExists != null && colExists > 0) return;

            String ddl = "ALTER TABLE " + table + " ADD " + column + " " + typeDef;
            log.info("스키마 보강: {}", ddl);
            jdbcTemplate.execute(ddl);
        } catch (Exception e) {
            log.error("{}.{} 컬럼 보강 실패", table, column, e);
        }
    }
}

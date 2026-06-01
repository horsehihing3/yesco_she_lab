package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 결재 흐름이 있는 plan 테이블에 reject_reason 컬럼 추가.
 * Flyway 비활성 환경에서도 V148 와 동일 동작.
 */
@Slf4j
@Order(95)
@Component
@RequiredArgsConstructor
public class RejectReasonColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        for (String table : new String[]{
                "tb_ehs_annual_plan", "tb_audit_plan", "tb_emergency_plan", "tb_contractor_plan"
        }) {
            ensureRejectReasonColumn(table);
        }
        backfillDummyRejectReasons();
    }

    private void ensureRejectReasonColumn(String table) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (tableExists == null || tableExists == 0) return;

            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = 'reject_reason'",
                Integer.class, table);
            if (colExists != null && colExists > 0) return;

            jdbcTemplate.execute("ALTER TABLE " + table + " ADD reject_reason NVARCHAR(MAX) NULL");
            log.info("{}.reject_reason 컬럼 추가", table);
        } catch (Exception e) {
            log.warn("{}.reject_reason 컬럼 추가 실패", table, e);
        }
    }

    private void backfillDummyRejectReasons() {
        try {
            // 연간 계획: DRAFT 1건에 샘플 반려사유
            if (columnExists("tb_ehs_annual_plan", "reject_reason")) {
                jdbcTemplate.update(
                    "UPDATE TOP (1) tb_ehs_annual_plan " +
                    "   SET reject_reason = N'예산 책정이 부족합니다. 1분기 KPI 기준 재산정 후 재상신해주세요.' " +
                    " WHERE status = 'DRAFT' AND (reject_reason IS NULL OR LTRIM(RTRIM(reject_reason)) = N'')");
            }
            // 협력사 계획: REJECTED 1건
            if (columnExists("tb_contractor_plan", "reject_reason")) {
                jdbcTemplate.update(
                    "UPDATE TOP (1) tb_contractor_plan " +
                    "   SET reject_reason = N'작업 일정이 다른 협력사와 중복됩니다. 일정 조정 후 재상신해주세요.' " +
                    " WHERE status = 'REJECTED' AND (reject_reason IS NULL OR LTRIM(RTRIM(reject_reason)) = N'')");
            }
        } catch (Exception e) {
            log.warn("더미 reject_reason 백필 실패", e);
        }
    }

    private boolean columnExists(String table, String column) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
            Integer.class, table, column);
        return n != null && n > 0;
    }
}

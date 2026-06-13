package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_audit_plan 에 수정자 컬럼 추가.
 * Flyway 비활성 환경에서 스키마 보강용.
 */
@Slf4j
@Order(96)
// @Component  // [PersonRef-3 / 2026-06-13] flat 컬럼 DROP 완료로 비활성 — JSON(PersonRefColumnsInitializer) 단일소스, obsolete 초기화기
@RequiredArgsConstructor
public class AuditPlanModifierColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureColumn("tb_audit_plan", "modified_by_user_id", "BIGINT NULL");
        ensureColumn("tb_audit_plan", "modified_by_name", "NVARCHAR(200) NULL");
    }

    private void ensureColumn(String table, String column, String definition) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (tableExists == null || tableExists == 0) return;

            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
                Integer.class, table, column);
            if (colExists != null && colExists > 0) return;

            jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " " + definition);
            log.info("{}.{} 컬럼 추가", table, column);
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 추가 실패", table, column, e);
        }
    }
}

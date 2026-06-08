package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_legal_compliance_plan / tb_legal_compliance_exec 에 수정자 컬럼 추가.
 */
@Slf4j
@Order(97)
@Component
@RequiredArgsConstructor
public class LegalComplianceModifierColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureColumn("tb_legal_compliance_plan", "modified_by_user_id", "BIGINT NULL");
        ensureColumn("tb_legal_compliance_plan", "modified_by_name",    "NVARCHAR(200) NULL");
        ensureColumn("tb_legal_compliance_exec", "modified_by_user_id", "BIGINT NULL");
        ensureColumn("tb_legal_compliance_exec", "modified_by_name",    "NVARCHAR(200) NULL");
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

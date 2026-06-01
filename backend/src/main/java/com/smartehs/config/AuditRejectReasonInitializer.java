package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 감사 실시(tb_audit) 에 reject_reason 컬럼 추가.
 * V153 와 동일 동작.
 */
@Slf4j
@Order(84)
@Component
@RequiredArgsConstructor
public class AuditRejectReasonInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_audit'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_audit') AND name = 'reject_reason'",
                Integer.class);
            if (colExists == null || colExists == 0) {
                jdbcTemplate.execute("ALTER TABLE tb_audit ADD reject_reason NVARCHAR(MAX) NULL");
                log.info("tb_audit.reject_reason 컬럼 추가");
            }
        } catch (Exception e) {
            log.warn("tb_audit.reject_reason 초기화 실패", e);
        }
    }
}

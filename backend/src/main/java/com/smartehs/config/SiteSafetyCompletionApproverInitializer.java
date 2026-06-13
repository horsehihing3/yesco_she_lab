package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * V187에서 DROP된 tb_site_safety_plan 완료 승인자 사전지정 컬럼 복구.
 * (V192 SQL과 동일 동작 — Flyway 비활성 환경용)
 */
@Slf4j
@Order(95)
// @Component  // [PersonRef-3 / 2026-06-13] flat 컬럼 DROP 완료로 비활성 — JSON(PersonRefColumnsInitializer) 단일소스, obsolete 초기화기
@RequiredArgsConstructor
public class SiteSafetyCompletionApproverInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_site_safety_plan'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            for (String[] col : List.of(
                new String[]{"completion_approver_user_id",  "BIGINT NULL"},
                new String[]{"completion_approver_team",     "NVARCHAR(200) NULL"},
                new String[]{"completion_approver_position", "NVARCHAR(200) NULL"},
                new String[]{"completion_approver_name",     "NVARCHAR(200) NULL"}
            )) {
                ensureColumn(col[0], col[1]);
            }
        } catch (Exception e) {
            log.warn("SiteSafety 완료 승인자 컬럼 복구 실패", e);
        }
    }

    private void ensureColumn(String column, String typeDef) {
        try {
            Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_site_safety_plan') AND name = ?",
                Integer.class, column);
            if (n != null && n > 0) return;
            jdbcTemplate.execute("ALTER TABLE tb_site_safety_plan ADD " + column + " " + typeDef);
            log.info("tb_site_safety_plan 컬럼 복구: {} {}", column, typeDef);
        } catch (Exception e) {
            log.warn("tb_site_safety_plan.{} 컬럼 추가 실패", column, e);
        }
    }
}

package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 위험성 평가 결재 흐름 분리 컬럼 추가 + 더미데이터 백필.
 * Flyway 비활성 환경에서도 V145 와 동일 동작.
 */
@Slf4j
@Order(78)
// @Component  // [PersonRef-3 / 2026-06-13] flat 컬럼 DROP 완료로 비활성 — JSON(PersonRefColumnsInitializer) 단일소스, obsolete 초기화기
@RequiredArgsConstructor
public class RiskAssessmentApprovalSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_risk_assessment'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            for (String[] col : List.of(
                new String[]{"plan_approver_user_id",        "BIGINT NULL"},
                new String[]{"plan_approver_team",           "NVARCHAR(100) NULL"},
                new String[]{"plan_approver_position",       "NVARCHAR(50) NULL"},
                new String[]{"plan_approver_name",           "NVARCHAR(100) NULL"},
                new String[]{"plan_approved_at",             "DATETIME2 NULL"},
                new String[]{"plan_approved_by",             "NVARCHAR(100) NULL"},
                new String[]{"completion_approver_user_id",  "BIGINT NULL"},
                new String[]{"completion_approver_team",     "NVARCHAR(100) NULL"},
                new String[]{"completion_approver_position", "NVARCHAR(50) NULL"},
                new String[]{"completion_approver_name",     "NVARCHAR(100) NULL"},
                new String[]{"completion_approved_at",       "DATETIME2 NULL"},
                new String[]{"completion_approved_by",       "NVARCHAR(100) NULL"}
            )) {
                ensureColumn("tb_risk_assessment", col[0], col[1]);
            }

            // 옛 approver_name → plan_approver_name 1회 백필
            if (columnExists("tb_risk_assessment", "approver_name")
                && columnExists("tb_risk_assessment", "plan_approver_name")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_risk_assessment " +
                    "   SET plan_approver_name = COALESCE(plan_approver_name, approver_name) " +
                    " WHERE approver_name IS NOT NULL AND plan_approver_name IS NULL");
                if (n > 0) log.info("plan_approver_name 백필: {}건", n);
            }

            // 더미 결재선 백필
            int seeded = jdbcTemplate.update(
                "UPDATE tb_risk_assessment " +
                "   SET plan_approver_team       = COALESCE(NULLIF(plan_approver_team, N''),       N'안전보건팀'), " +
                "       plan_approver_position   = COALESCE(NULLIF(plan_approver_position, N''),   N'팀장'), " +
                "       plan_approver_name       = COALESCE(NULLIF(plan_approver_name, N''),       N'홍성기'), " +
                "       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'), " +
                "       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'), " +
                "       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'), " +
                "       modified_at = GETDATE()");
            if (seeded > 0) log.info("위험성 평가 더미 결재선 백필: {}건", seeded);
        } catch (Exception e) {
            log.warn("위험성 평가 결재 분리 초기화 실패", e);
        }
    }

    private boolean columnExists(String table, String column) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
            Integer.class, table, column);
        return n != null && n > 0;
    }

    private void ensureColumn(String table, String column, String typeDef) {
        try {
            if (columnExists(table, column)) return;
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " " + typeDef);
            log.info("스키마 보강: ALTER TABLE {} ADD {} {}", table, column, typeDef);
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 추가 실패", table, column, e);
        }
    }
}

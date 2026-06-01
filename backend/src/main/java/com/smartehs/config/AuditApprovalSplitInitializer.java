package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 감사 결재 분리(plan_approver / completion_approver) 컬럼 보강 + 더미 백필.
 * Flyway 비활성 환경에서도 V141 와 동일 동작.
 */
@Slf4j
@Order(90)
@Component
@RequiredArgsConstructor
public class AuditApprovalSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // tb_audit_plan : 계획 승인자
            if (tableExists("tb_audit_plan")) {
                for (String[] col : List.of(
                    new String[]{"plan_approver_user_id",  "BIGINT NULL"},
                    new String[]{"plan_approver_team",     "NVARCHAR(100) NULL"},
                    new String[]{"plan_approver_position", "NVARCHAR(50) NULL"},
                    new String[]{"plan_approver_name",     "NVARCHAR(100) NULL"},
                    new String[]{"plan_approved_at",       "DATETIME2 NULL"},
                    new String[]{"plan_approved_by",       "NVARCHAR(100) NULL"}
                )) {
                    ensureColumn("tb_audit_plan", col[0], col[1]);
                }

                if (columnExists("tb_audit_plan", "approved_at") && columnExists("tb_audit_plan", "plan_approved_at")) {
                    int n = jdbcTemplate.update(
                        "UPDATE tb_audit_plan " +
                        "   SET plan_approved_at = COALESCE(plan_approved_at, approved_at), " +
                        "       plan_approved_by = COALESCE(plan_approved_by, approved_by) " +
                        " WHERE approved_at IS NOT NULL AND plan_approved_at IS NULL");
                    if (n > 0) log.info("audit_plan plan_approved_at/by 백필: {}건", n);
                }

                int seeded = jdbcTemplate.update(
                    "UPDATE tb_audit_plan " +
                    "   SET plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'안전보건팀'), " +
                    "       plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'), " +
                    "       plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'), " +
                    "       modified_at = GETDATE() " +
                    " WHERE plan_approver_name IS NULL OR LTRIM(RTRIM(plan_approver_name)) = N''");
                if (seeded > 0) log.info("audit_plan 더미 plan_approver 백필: {}건", seeded);
            }

            // tb_audit : 완료 승인자
            if (tableExists("tb_audit")) {
                for (String[] col : List.of(
                    new String[]{"completion_approver_user_id",  "BIGINT NULL"},
                    new String[]{"completion_approver_team",     "NVARCHAR(100) NULL"},
                    new String[]{"completion_approver_position", "NVARCHAR(50) NULL"},
                    new String[]{"completion_approver_name",     "NVARCHAR(100) NULL"},
                    new String[]{"completion_approved_at",       "DATETIME2 NULL"},
                    new String[]{"completion_approved_by",       "NVARCHAR(100) NULL"}
                )) {
                    ensureColumn("tb_audit", col[0], col[1]);
                }

                int seeded = jdbcTemplate.update(
                    "UPDATE tb_audit " +
                    "   SET completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'), " +
                    "       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'), " +
                    "       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'), " +
                    "       modified_at = GETDATE() " +
                    " WHERE completion_approver_name IS NULL OR LTRIM(RTRIM(completion_approver_name)) = N''");
                if (seeded > 0) log.info("audit 더미 completion_approver 백필: {}건", seeded);
            }
        } catch (Exception e) {
            log.warn("감사 결재 분리 초기화 실패", e);
        }
    }

    private boolean tableExists(String table) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
        return n != null && n > 0;
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

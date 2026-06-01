package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 감사 계획/실시 양쪽에 plan_/completion_ 결재자 모두 보유하도록 스키마 보강 + 백필.
 *   tb_audit_plan: completion_approver_* (계획 단계에서 완료 승인자 미리 지정)
 *   tb_audit:      plan_approver_*, created_by_* (실시 단계에서도 표시·편집)
 * Flyway 비활성 환경에서도 V151 와 동일 동작.
 */
@Slf4j
@Order(76)
@Component
@RequiredArgsConstructor
public class AuditApprovalFullSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            extendPlanTable();
            extendAuditTable();
            backfillPlanCompletionApprover();
            backfillAuditFromPlan();
            backfillAuditDefaults();
        } catch (Exception e) {
            log.warn("감사 결재자 풀스플릿 초기화 실패", e);
        }
    }

    private void extendPlanTable() {
        if (!tableExists("tb_audit_plan")) return;
        for (String[] col : List.of(
            new String[]{"completion_approver_user_id",  "BIGINT NULL"},
            new String[]{"completion_approver_team",     "NVARCHAR(100) NULL"},
            new String[]{"completion_approver_position", "NVARCHAR(50) NULL"},
            new String[]{"completion_approver_name",     "NVARCHAR(100) NULL"},
            new String[]{"completion_approved_at",       "DATETIME2 NULL"},
            new String[]{"completion_approved_by",       "NVARCHAR(100) NULL"}
        )) {
            ensureColumn("tb_audit_plan", col[0], col[1]);
        }
    }

    private void extendAuditTable() {
        if (!tableExists("tb_audit")) return;
        for (String[] col : List.of(
            new String[]{"plan_approver_user_id",  "BIGINT NULL"},
            new String[]{"plan_approver_team",     "NVARCHAR(100) NULL"},
            new String[]{"plan_approver_position", "NVARCHAR(50) NULL"},
            new String[]{"plan_approver_name",     "NVARCHAR(100) NULL"},
            new String[]{"plan_approved_at",       "DATETIME2 NULL"},
            new String[]{"plan_approved_by",       "NVARCHAR(100) NULL"},
            new String[]{"created_by_user_id",     "BIGINT NULL"},
            new String[]{"created_by_name",        "NVARCHAR(100) NULL"}
        )) {
            ensureColumn("tb_audit", col[0], col[1]);
        }
    }

    private void backfillPlanCompletionApprover() {
        if (!tableExists("tb_audit_plan") || !columnExists("tb_audit_plan", "completion_approver_name")) return;
        int n = jdbcTemplate.update(
            "UPDATE tb_audit_plan " +
            "   SET completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'), " +
            "       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'), " +
            "       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'), " +
            "       modified_at = GETDATE() " +
            " WHERE deleted = 0 AND (completion_approver_name IS NULL OR completion_approver_name = N'')");
        if (n > 0) log.info("AuditPlan completion_approver 더미 백필: {}건", n);
    }

    private void backfillAuditFromPlan() {
        if (!tableExists("tb_audit") || !tableExists("tb_audit_plan")) return;
        if (!columnExists("tb_audit", "plan_approver_name")) return;
        try {
            int n = jdbcTemplate.update(
                "UPDATE a " +
                "   SET a.plan_approver_user_id  = COALESCE(a.plan_approver_user_id,  p.plan_approver_user_id), " +
                "       a.plan_approver_team     = COALESCE(NULLIF(a.plan_approver_team, N''),     p.plan_approver_team), " +
                "       a.plan_approver_position = COALESCE(NULLIF(a.plan_approver_position, N''), p.plan_approver_position), " +
                "       a.plan_approver_name     = COALESCE(NULLIF(a.plan_approver_name, N''),     p.plan_approver_name), " +
                "       a.plan_approved_at       = COALESCE(a.plan_approved_at,       p.plan_approved_at), " +
                "       a.plan_approved_by       = COALESCE(NULLIF(a.plan_approved_by, N''),       p.plan_approved_by), " +
                "       a.created_by_user_id     = COALESCE(a.created_by_user_id,     p.created_by_user_id), " +
                "       a.created_by_name        = COALESCE(NULLIF(a.created_by_name, N''),        p.created_by_name) " +
                "  FROM tb_audit a " +
                "  JOIN tb_audit_plan p ON a.plan_id = p.id " +
                " WHERE a.deleted = 0");
            if (n > 0) log.info("Audit plan_approver/created_by → AuditPlan 복사 백필: {}건", n);
        } catch (Exception e) {
            log.warn("Audit ← AuditPlan 백필 실패: {}", e.getMessage());
        }
    }

    private void backfillAuditDefaults() {
        if (!tableExists("tb_audit") || !columnExists("tb_audit", "plan_approver_name")) return;
        int n = jdbcTemplate.update(
            "UPDATE tb_audit " +
            "   SET plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'안전보건팀'), " +
            "       plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'), " +
            "       plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'), " +
            "       created_by_name        = COALESCE(NULLIF(created_by_name, N''),        N'김민수'), " +
            "       modified_at = GETDATE() " +
            " WHERE deleted = 0 AND (plan_approver_name IS NULL OR plan_approver_name = N'')");
        if (n > 0) log.info("Audit plan_approver/created_by 기본 더미 백필: {}건", n);
    }

    private boolean tableExists(String table) {
        try {
            Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            return n != null && n > 0;
        } catch (Exception e) { return false; }
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

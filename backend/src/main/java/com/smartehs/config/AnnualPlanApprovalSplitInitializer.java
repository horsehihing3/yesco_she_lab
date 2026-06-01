package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 연간 계획 결재 분리(plan_approver / completion_approver) 컬럼 보강 + 데이터 마이그레이션.
 * Flyway 비활성 환경에서도 V139 와 동일 동작.
 */
@Slf4j
@Order(70)
@Component
@RequiredArgsConstructor
public class AnnualPlanApprovalSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_ehs_annual_plan'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            // 1) 새 컬럼 추가
            for (String[] col : List.of(
                new String[]{"plan_approver_user_id",       "BIGINT NULL"},
                new String[]{"plan_approver_team",          "NVARCHAR(100) NULL"},
                new String[]{"plan_approver_position",      "NVARCHAR(50) NULL"},
                new String[]{"plan_approver_name",          "NVARCHAR(100) NULL"},
                new String[]{"completion_approver_user_id", "BIGINT NULL"},
                new String[]{"completion_approver_team",    "NVARCHAR(100) NULL"},
                new String[]{"completion_approver_position","NVARCHAR(50) NULL"},
                new String[]{"completion_approver_name",    "NVARCHAR(100) NULL"},
                new String[]{"plan_approved_at",            "DATETIME2 NULL"},
                new String[]{"plan_approved_by",            "NVARCHAR(100) NULL"},
                new String[]{"completion_approved_at",      "DATETIME2 NULL"},
                new String[]{"completion_approved_by",      "NVARCHAR(100) NULL"}
            )) {
                ensureColumn("tb_ehs_annual_plan", col[0], col[1]);
            }

            // 2) 옛 approver_* 데이터 → plan_approver_* 1회 백필
            if (columnExists("tb_ehs_annual_plan", "approver_name")
                && columnExists("tb_ehs_annual_plan", "plan_approver_name")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_ehs_annual_plan " +
                    "   SET plan_approver_user_id  = COALESCE(plan_approver_user_id,  approver_user_id), " +
                    "       plan_approver_team     = COALESCE(plan_approver_team,     approver_team), " +
                    "       plan_approver_position = COALESCE(plan_approver_position, approver_position), " +
                    "       plan_approver_name     = COALESCE(plan_approver_name,     approver_name) " +
                    " WHERE approver_name IS NOT NULL AND plan_approver_name IS NULL");
                if (n > 0) log.info("plan_approver_* 백필: {}건", n);
            }
            if (columnExists("tb_ehs_annual_plan", "approved_at")
                && columnExists("tb_ehs_annual_plan", "plan_approved_at")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_ehs_annual_plan " +
                    "   SET plan_approved_at = COALESCE(plan_approved_at, approved_at), " +
                    "       plan_approved_by = COALESCE(plan_approved_by, approved_by) " +
                    " WHERE approved_at IS NOT NULL AND plan_approved_at IS NULL");
                if (n > 0) log.info("plan_approved_at/by 백필: {}건", n);
            }

            // 3) 더미데이터에 completion_approver 기본값 채우기
            int seeded = jdbcTemplate.update(
                "UPDATE tb_ehs_annual_plan " +
                "   SET completion_approver_team     = COALESCE(completion_approver_team,     N'노경지원팀'), " +
                "       completion_approver_position = COALESCE(completion_approver_position, N'팀장'), " +
                "       completion_approver_name     = COALESCE(completion_approver_name,     N'홍성기') " +
                " WHERE plan_approver_name IS NOT NULL");
            if (seeded > 0) log.info("completion_approver 기본값 백필: {}건", seeded);
        } catch (Exception e) {
            log.warn("연간 계획 결재 분리 초기화 실패", e);
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

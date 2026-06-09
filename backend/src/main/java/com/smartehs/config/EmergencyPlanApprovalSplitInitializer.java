package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 비상 대응 계획 결재 분리 + 훈련 일정 컬럼 추가 + 더미데이터 백필.
 * Flyway 비활성 환경에서도 V143 와 동일 동작.
 */
@Slf4j
@Order(75)
@Component
@RequiredArgsConstructor
public class EmergencyPlanApprovalSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_emergency_plan'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            // 1) 새 컬럼 추가
            for (String[] col : List.of(
                new String[]{"training_start_date",          "DATE NULL"},
                new String[]{"training_end_date",            "DATE NULL"},
                new String[]{"status",                       "NVARCHAR(40) NULL"},
                new String[]{"writer_user_id",               "BIGINT NULL"},
                new String[]{"writer_team",                  "NVARCHAR(100) NULL"},
                new String[]{"writer_position",              "NVARCHAR(50) NULL"},
                new String[]{"writer_name",                  "NVARCHAR(100) NULL"},
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
                new String[]{"completion_approved_by",       "NVARCHAR(100) NULL"},
                new String[]{"modified_by_user_id",         "BIGINT NULL"},
                new String[]{"modified_by_name",            "NVARCHAR(100) NULL"},
                new String[]{"modified_by_team",            "NVARCHAR(100) NULL"},
                new String[]{"modified_by_position",        "NVARCHAR(50) NULL"}
            )) {
                ensureColumn("tb_emergency_plan", col[0], col[1]);
            }

            // 2) 기존 approved_* → completion_approved_* 1회 백필
            if (columnExists("tb_emergency_plan", "approved_at")
                && columnExists("tb_emergency_plan", "completion_approved_at")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_emergency_plan " +
                    "   SET completion_approved_at = COALESCE(completion_approved_at, approved_at), " +
                    "       completion_approved_by = COALESCE(completion_approved_by, approved_by) " +
                    " WHERE approved_at IS NOT NULL AND completion_approved_at IS NULL");
                if (n > 0) log.info("completion_approved_* 백필: {}건", n);
            }

            // 3) status 백필
            int s = jdbcTemplate.update(
                "UPDATE tb_emergency_plan " +
                "   SET status = CASE WHEN approved = 1 THEN N'DONE' ELSE N'DRAFT' END " +
                " WHERE status IS NULL OR LTRIM(RTRIM(status)) = N''");
            if (s > 0) log.info("status 백필: {}건", s);

            // 4) training_start/end_date 백필 (옛 last_reviewed/next_review)
            if (columnExists("tb_emergency_plan", "last_reviewed")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_emergency_plan " +
                    "   SET training_start_date = COALESCE(training_start_date, last_reviewed) " +
                    " WHERE last_reviewed IS NOT NULL AND training_start_date IS NULL");
                if (n > 0) log.info("training_start_date 백필: {}건", n);
            }
            if (columnExists("tb_emergency_plan", "next_review")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_emergency_plan " +
                    "   SET training_end_date = COALESCE(training_end_date, next_review) " +
                    " WHERE next_review IS NOT NULL AND training_end_date IS NULL");
                if (n > 0) log.info("training_end_date 백필: {}건", n);
            }

            // 5) 더미데이터: 작성자 / 승인자 / 훈련 일정 기본값
            int seeded = jdbcTemplate.update(
                "UPDATE tb_emergency_plan " +
                "   SET writer_team     = COALESCE(NULLIF(writer_team, N''),     N'안전보건팀'), " +
                "       writer_position = COALESCE(NULLIF(writer_position, N''), N'대리'), " +
                "       writer_name     = COALESCE(NULLIF(writer_name, N''),     N'김민수'), " +
                "       plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'안전보건팀'), " +
                "       plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'), " +
                "       plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'), " +
                "       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'), " +
                "       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'), " +
                "       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'), " +
                "       training_start_date = COALESCE(training_start_date, DATEADD(DAY,  7, CAST(GETDATE() AS DATE))), " +
                "       training_end_date   = COALESCE(training_end_date,   DATEADD(DAY, 14, CAST(GETDATE() AS DATE))), " +
                "       modified_at = GETDATE() " +
                " WHERE deleted = 0");
            if (seeded > 0) log.info("비상계획 더미 결재선/일정 백필: {}건", seeded);
        } catch (Exception e) {
            log.warn("비상 계획 결재 분리 초기화 실패", e);
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

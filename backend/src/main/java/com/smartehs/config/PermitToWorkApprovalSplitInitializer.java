package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 작업 허가(tb_permit_to_work) 결재 흐름 분리 컬럼 보강 + 더미데이터 백필.
 * Flyway 비활성 환경에서도 V149 와 동일 동작.
 *
 *   plan_approver_*       : 계획 결재
 *   completion_approver_* : 완료 결재
 *   reject_reason         : 반려 사유
 */
@Slf4j
@Order(75)
@Component
@RequiredArgsConstructor
public class PermitToWorkApprovalSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_permit_to_work'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            // 1) 새 컬럼 추가
            for (String[] col : List.of(
                new String[]{"plan_approver_user_id",       "BIGINT NULL"},
                new String[]{"plan_approver_team",          "NVARCHAR(100) NULL"},
                new String[]{"plan_approver_position",      "NVARCHAR(50) NULL"},
                new String[]{"plan_approver_name",          "NVARCHAR(100) NULL"},
                new String[]{"plan_approved_at",            "DATETIME2 NULL"},
                new String[]{"plan_approved_by",            "NVARCHAR(100) NULL"},
                new String[]{"completion_approver_user_id", "BIGINT NULL"},
                new String[]{"completion_approver_team",    "NVARCHAR(100) NULL"},
                new String[]{"completion_approver_position","NVARCHAR(50) NULL"},
                new String[]{"completion_approver_name",    "NVARCHAR(100) NULL"},
                new String[]{"completion_approved_at",      "DATETIME2 NULL"},
                new String[]{"completion_approved_by",      "NVARCHAR(100) NULL"},
                new String[]{"reject_reason",               "NVARCHAR(MAX) NULL"}
            )) {
                ensureColumn("tb_permit_to_work", col[0], col[1]);
            }

            // 2) 옛 approver_* → plan_approver_* 1회 백필
            if (columnExists("tb_permit_to_work", "approver_name")
                && columnExists("tb_permit_to_work", "plan_approver_name")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_permit_to_work " +
                    "   SET plan_approver_team = COALESCE(plan_approver_team, approver_dept), " +
                    "       plan_approver_name = COALESCE(plan_approver_name, approver_name) " +
                    " WHERE approver_name IS NOT NULL AND plan_approver_name IS NULL");
                if (n > 0) log.info("PTW plan_approver_* 백필: {}건", n);
            }
            if (columnExists("tb_permit_to_work", "approved_at")
                && columnExists("tb_permit_to_work", "plan_approved_at")) {
                int n = jdbcTemplate.update(
                    "UPDATE tb_permit_to_work " +
                    "   SET plan_approved_at = COALESCE(plan_approved_at, approved_at) " +
                    " WHERE approved_at IS NOT NULL AND plan_approved_at IS NULL");
                if (n > 0) log.info("PTW plan_approved_at 백필: {}건", n);
            }

            // 3) 더미 결재선 백필 (NULL/공란만)
            int seeded = jdbcTemplate.update(
                "UPDATE tb_permit_to_work " +
                "   SET plan_approver_team       = COALESCE(NULLIF(plan_approver_team, N''),       N'안전보건팀'), " +
                "       plan_approver_position   = COALESCE(NULLIF(plan_approver_position, N''),   N'팀장'), " +
                "       plan_approver_name       = COALESCE(NULLIF(plan_approver_name, N''),       N'홍성기'), " +
                "       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'), " +
                "       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'), " +
                "       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민') " +
                " WHERE deleted = 0");
            if (seeded > 0) log.info("PTW 결재선 더미 백필: {}건", seeded);

            // 4) reject_reason 더미 데이터 (REJECTED 상태)
            int rj = jdbcTemplate.update(
                "UPDATE tb_permit_to_work " +
                "   SET reject_reason = N'안전 조치 미흡으로 반려합니다. 보완 후 재상신해주세요.' " +
                " WHERE status = 'REJECTED' AND (reject_reason IS NULL OR reject_reason = N'')");
            if (rj > 0) log.info("PTW reject_reason 더미 백필: {}건", rj);

            // 5) PERMIT_STATUS 코드그룹에 신규 상태 추가
            ensurePermitStatusCode("PENDING_APPROVAL", "계획 결재 대기", "Plan Approval Pending", "计划审批待批准", 15);
            ensurePermitStatusCode("COMPLETION_PENDING", "완료 결재 대기", "Completion Approval Pending", "完成审批待批准", 35);
            ensurePermitStatusCode("DONE", "완료", "Done", "已完成", 40);
        } catch (Exception e) {
            log.warn("PTW 결재 분리 초기화 실패", e);
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

    private void ensurePermitStatusCode(String code, String ko, String en, String zh, int sortOrder) {
        try {
            Long groupId = jdbcTemplate.queryForObject(
                "SELECT id FROM tb_code_group WHERE group_code = 'PERMIT_STATUS'", Long.class);
            if (groupId == null) return;
            Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tb_code_detail WHERE group_id = ? AND code = ?",
                Integer.class, groupId, code);
            if (existing == null || existing == 0) {
                jdbcTemplate.update(
                    "INSERT INTO tb_code_detail (group_id, code, code_name_ko, code_name_en, code_name_zh, sort_order, is_active) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 1)",
                    groupId, code, ko, en, zh, sortOrder);
                log.info("PERMIT_STATUS 코드 추가: {} ({})", code, ko);
            }
        } catch (Exception e) {
            log.warn("PERMIT_STATUS {} 코드 추가 실패: {}", code, e.getMessage());
        }
    }
}

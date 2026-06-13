package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 협력사 계획 결재 흐름 분리 컬럼 추가 + 더미데이터 백필.
 * Flyway 비활성 환경에서도 V146 와 동일 동작.
 */
@Slf4j
@Order(82)
// @Component  // [PersonRef-3 / 2026-06-13] flat 컬럼 DROP 완료로 비활성 — JSON(PersonRefColumnsInitializer) 단일소스, obsolete 초기화기
@RequiredArgsConstructor
public class ContractorPlanApprovalSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_contractor_plan'", Integer.class);
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
                ensureColumn("tb_contractor_plan", col[0], col[1]);
            }

            // 옛 approver_name → plan_approver_name 1회 백필
            int n1 = jdbcTemplate.update(
                "UPDATE tb_contractor_plan " +
                "   SET plan_approver_name = COALESCE(plan_approver_name, approver_name) " +
                " WHERE approver_name IS NOT NULL AND plan_approver_name IS NULL");
            if (n1 > 0) log.info("협력사 plan_approver_name 백필: {}건", n1);

            // 옛 approved_at/by → plan_approved_* 1회 백필
            int n2 = jdbcTemplate.update(
                "UPDATE tb_contractor_plan " +
                "   SET plan_approved_at = COALESCE(plan_approved_at, approved_at), " +
                "       plan_approved_by = COALESCE(plan_approved_by, approved_by) " +
                " WHERE approved_at IS NOT NULL AND plan_approved_at IS NULL");
            if (n2 > 0) log.info("협력사 plan_approved_at/by 백필: {}건", n2);

            // 더미 결재선 백필
            int seeded = jdbcTemplate.update(
                "UPDATE tb_contractor_plan " +
                "   SET plan_approver_team       = COALESCE(NULLIF(plan_approver_team, N''),       N'안전보건팀'), " +
                "       plan_approver_position   = COALESCE(NULLIF(plan_approver_position, N''),   N'팀장'), " +
                "       plan_approver_name       = COALESCE(NULLIF(plan_approver_name, N''),       N'홍성기'), " +
                "       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'), " +
                "       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'), " +
                "       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'), " +
                "       modified_at = GETDATE() " +
                " WHERE deleted = 0");
            if (seeded > 0) log.info("협력사 더미 결재선 백필: {}건", seeded);

            // PERMIT_STATUS 코드그룹에 신규 상태 추가
            Integer groupCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tb_code_group WHERE group_code = 'PERMIT_STATUS'", Integer.class);
            if (groupCount != null && groupCount > 0) {
                Long groupId = jdbcTemplate.queryForObject(
                    "SELECT id FROM tb_code_group WHERE group_code = 'PERMIT_STATUS'", Long.class);
                addPermitStatusCode(groupId, "PENDING_APPROVAL", "계획 결재 대기", "Plan Approval Pending", "计划审批待批准", 15);
                addPermitStatusCode(groupId, "COMPLETION_PENDING", "완료 결재 대기", "Completion Approval Pending", "完成审批待批准", 35);
                addPermitStatusCode(groupId, "DONE", "완료", "Done", "已完成", 40);
            }
        } catch (Exception e) {
            log.warn("협력사 계획 결재 분리 초기화 실패", e);
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

    private void addPermitStatusCode(Long groupId, String code, String nameKo, String nameEn, String nameZh, int sortOrder) {
        try {
            Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tb_code_detail WHERE group_id = ? AND code = ?",
                Integer.class, groupId, code);
            if (existing != null && existing > 0) return;
            jdbcTemplate.update(
                "INSERT INTO tb_code_detail (group_id, code, code_name_ko, code_name_en, code_name_zh, sort_order, is_active) " +
                "VALUES (?, ?, ?, ?, ?, ?, 1)",
                groupId, code, nameKo, nameEn, nameZh, sortOrder);
            log.info("PERMIT_STATUS 코드 추가: {} ({})", code, nameKo);
        } catch (Exception e) {
            log.warn("PERMIT_STATUS 코드 추가 실패: {}", code, e);
        }
    }
}

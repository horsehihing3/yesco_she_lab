package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 연간 계획 더미데이터에 description / plan_approver / completion_approver 빈값 보강.
 * Flyway 비활성 환경에서 V140 와 동일 동작.
 */
@Slf4j
@Order(80)
// @Component  // [PersonRef-3 / 2026-06-13] flat 컬럼 DROP 완료로 비활성 — JSON(PersonRefColumnsInitializer) 단일소스, obsolete 초기화기
@RequiredArgsConstructor
public class AnnualPlanDummyApproverFiller implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_ehs_annual_plan'", Integer.class);
            if (tableExists == null || tableExists == 0) return;
            // 필요한 신규 컬럼이 다 있어야 의미가 있음
            for (String col : new String[]{"plan_approver_name", "completion_approver_name"}) {
                Integer c = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_annual_plan') AND name = ?",
                    Integer.class, col);
                if (c == null || c == 0) return;
            }

            int d = jdbcTemplate.update(
                "UPDATE tb_ehs_annual_plan " +
                "   SET description = COALESCE(NULLIF(LTRIM(RTRIM(description)), N''), N'SHE 경영시스템 운영을 위한 연간 계획') " +
                " WHERE description IS NULL OR LTRIM(RTRIM(description)) = N''");
            if (d > 0) log.info("연간 계획 description 백필: {}건", d);

            int n = jdbcTemplate.update(
                "UPDATE tb_ehs_annual_plan " +
                "   SET plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'노경지원팀'), " +
                "       plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'), " +
                "       plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'), " +
                "       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'), " +
                "       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'), " +
                "       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'), " +
                "       modified_at = GETDATE() " +
                " WHERE plan_approver_name IS NULL OR completion_approver_name IS NULL " +
                "    OR LTRIM(RTRIM(plan_approver_name)) = N'' " +
                "    OR LTRIM(RTRIM(completion_approver_name)) = N''");
            if (n > 0) log.info("연간 계획 더미 승인자 백필: {}건", n);
        } catch (Exception e) {
            log.warn("연간 계획 더미 승인자 백필 실패", e);
        }
    }
}

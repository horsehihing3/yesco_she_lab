package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 사람 필드(작성자/수정자/계획·완료승인자)를 JSON 1컬럼(PersonRef)으로 저장하기 위한 스키마.
 * - 각 역할의 JSON 컬럼(created_by 등)을 조건부 추가 (fresh/기존 DB 공통)
 * - 기존 flat 16컬럼이 있으면 거기서 1회 backfill (JSON이 NULL인 행만 — 멱등, 앱이 쓴 JSON 보존)
 * Flyway 비활성이라 스키마는 초기화기로 관리. 테이블 전환 시 TABLES 에 항목 추가.
 *
 * 역할 = JSON컬럼 / flat prefix:
 *   created_by, modified_by, plan_approver, completion_approver
 */
@Slf4j
@Order(50)
@Component
@RequiredArgsConstructor
public class PersonRefColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    /** {테이블, 역할 컬럼(=flat prefix) 목록} */
    private static final String[] ALL4 = {"created_by", "modified_by", "plan_approver", "completion_approver"};
    private static final String[] CM   = {"created_by", "modified_by"};
    private static final String[] C    = {"created_by"};

    private static final List<Object[]> TABLES = List.<Object[]>of(
        // 4역할 (작성/수정/계획승인/완료승인)
        new Object[]{"tb_ehs_annual_plan", ALL4},
        // tb_audit: modified_by 는 레거시 username 문자열 컬럼(nvarchar 100)이라 JSON 역할에서 제외 — 수정자는 flat 유지
        new Object[]{"tb_audit", new String[]{"created_by", "plan_approver", "completion_approver"}},
        new Object[]{"tb_audit_plan", ALL4}, new Object[]{"tb_contractor_plan", ALL4},
        new Object[]{"tb_emergency_plan", ALL4}, new Object[]{"tb_psm_moc", ALL4},
        // 특수 조합
        new Object[]{"tb_permit_to_work", new String[]{"created_by", "plan_approver", "completion_approver"}},
        new Object[]{"tb_risk_assessment", new String[]{"plan_approver", "completion_approver"}},
        // tb_site_safety_plan: modified_by 는 레거시 username 문자열 컬럼이라 제외(수정자 flat).
        // plan_approver 는 기존에 user_id 컬럼만 있고 team/name 컬럼이 없어 INSERT가 깨져 있었음 → JSON으로 통합(컬럼 신규생성).
        new Object[]{"tb_site_safety_plan", new String[]{"created_by", "plan_approver", "completion_approver"}},
        // 작성+수정
        new Object[]{"tb_contractor_registration", CM},
        // tb_health_checkup_plan: created_by 는 레거시 문자열(nvarchar200) 컬럼이라 제외(작성자 flat). 수정자/승인자는 JSON.
        new Object[]{"tb_health_checkup_plan", new String[]{"modified_by", "plan_approver", "completion_approver"}},
        // tb_legal_compliance_exec: modified_by 는 레거시 username 문자열이라 제외(수정자 flat). 작성/승인자는 JSON.
        new Object[]{"tb_legal_compliance_exec", new String[]{"created_by", "plan_approver", "completion_approver"}},
        new Object[]{"tb_legal_compliance_plan", ALL4},
        new Object[]{"tb_process_activity_form", CM}, new Object[]{"tb_psm_data", CM},
        new Object[]{"tb_psm_hazop", CM}, new Object[]{"tb_psm_incident", CM},
        new Object[]{"tb_psm_ptw", CM}, new Object[]{"tb_psm_wo", CM},
        new Object[]{"tb_safety_accident_form", CM}, new Object[]{"tb_safety_hazard_form", CM},
        new Object[]{"tb_wem_factor", CM}, new Object[]{"tb_wem_improvement", CM},
        new Object[]{"tb_wem_plan", CM}, new Object[]{"tb_wem_result", CM},
        // 작성자만
        new Object[]{"tb_dp_cvd", C}, new Object[]{"tb_dp_hearing", C}, new Object[]{"tb_dp_infect", C},
        new Object[]{"tb_dp_msd", C}, new Object[]{"tb_dp_respi", C}, new Object[]{"tb_dp_stress", C},
        new Object[]{"tb_dp_thermal", C}, new Object[]{"tb_ehs_manager", C}, new Object[]{"tb_emergency_contact", C},
        // tb_health_checkup_record: created_by 가 레거시 문자열 컬럼이고 유일 역할이라 JSON 전환 제외(전체 flat 유지)
        new Object[]{"tb_legal_law", C},
        new Object[]{"tb_od_aftercare", C}, new Object[]{"tb_od_exposure", C}, new Object[]{"tb_od_org", C},
        new Object[]{"tb_od_plan", C}, new Object[]{"tb_od_worker", C}
    );

    @Override
    public void run(String... args) {
        int cols = 0, filled = 0;
        for (Object[] entry : TABLES) {
            String table = (String) entry[0];
            for (String role : (String[]) entry[1]) {
                try {
                    cols += addColumn(table, role);
                    filled += backfill(table, role);
                } catch (Exception e) {
                    log.warn("PersonRefColumns {}.{} 실패: {}", table, role, e.getMessage());
                }
            }
        }
        log.info("PersonRefColumnsInitializer: 컬럼 {}개 추가, {}행 backfill", cols, filled);
    }

    private int addColumn(String table, String jsonCol) {
        Integer exists = jdbcTemplate.queryForObject("SELECT COL_LENGTH(?, ?)", Integer.class, table, jsonCol);
        if (exists != null) return 0;
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + jsonCol + " NVARCHAR(MAX) NULL");
        return 1;
    }

    /** flat 컬럼(prefix_user_id 등)이 존재하고 JSON 이 NULL 인 행만 backfill */
    private int backfill(String table, String prefix) {
        Integer flatExists = jdbcTemplate.queryForObject("SELECT COL_LENGTH(?, ?)", Integer.class, table, prefix + "_name");
        if (flatExists == null) return 0; // flat 컬럼 없으면(이미 drop 등) 스킵
        String sql =
            "UPDATE t SET " + prefix + " = (" +
            "  SELECT x." + prefix + "_user_id AS userId, x." + prefix + "_name AS [name], " +
            "         x." + prefix + "_team AS team, x." + prefix + "_position AS position " +
            "  FROM " + table + " x WHERE x.id = t.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) " +
            "FROM " + table + " t " +
            "WHERE t." + prefix + " IS NULL AND (t." + prefix + "_user_id IS NOT NULL OR t." + prefix + "_name IS NOT NULL)";
        return jdbcTemplate.update(sql);
    }
}

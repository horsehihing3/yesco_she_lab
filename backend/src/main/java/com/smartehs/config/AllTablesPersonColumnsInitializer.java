package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 모든 도메인 테이블에 created_by / modified_by 4개 컬럼 세트를 보장.
 * ensureColumn 은 컬럼이 이미 존재하면 스킵하므로 중복 실행에 안전.
 */
@Slf4j
@Order(106)
// @Component  // [PersonRef-3 / 2026-06-13] flat 컬럼 DROP 완료로 비활성 — JSON(PersonRefColumnsInitializer) 단일소스, obsolete 초기화기
@RequiredArgsConstructor
public class AllTablesPersonColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    // created_by 4컬럼만 필요한 테이블
    private static final String[] CREATED_ONLY = {
        "tb_dp_cvd", "tb_dp_hearing", "tb_dp_infect", "tb_dp_msd",
        "tb_dp_respi", "tb_dp_stress", "tb_dp_thermal",
        "tb_ehs_manager", "tb_emergency_contact",
        "tb_health_checkup_record", "tb_legal_law",
        "tb_od_aftercare", "tb_od_exposure", "tb_od_org",
        "tb_od_plan", "tb_od_worker", "tb_permit_to_work",
    };

    // created_by + modified_by 8컬럼 모두 필요한 테이블
    private static final String[] BOTH = {
        "tb_audit", "tb_audit_plan",
        "tb_contractor_plan", "tb_contractor_registration",
        "tb_ehs_annual_plan", "tb_emergency_plan",
        "tb_health_checkup_plan",
        "tb_legal_compliance_exec", "tb_legal_compliance_plan",
        "tb_process_activity_form",
        "tb_psm_data", "tb_psm_hazop", "tb_psm_incident",
        "tb_psm_moc", "tb_psm_ptw", "tb_psm_wo",
        "tb_safety_accident_form", "tb_safety_hazard_form",
        "tb_site_safety_plan",
        "tb_wem_factor", "tb_wem_improvement",
        "tb_wem_plan", "tb_wem_result",
    };

    @Override
    public void run(String... args) {
        for (String table : CREATED_ONLY) {
            addCreatedBy(table);
        }
        for (String table : BOTH) {
            addCreatedBy(table);
            addModifiedBy(table);
        }
    }

    private void addCreatedBy(String table) {
        ensureColumn(table, "created_by_user_id",  "BIGINT NULL");
        ensureColumn(table, "created_by_name",     "NVARCHAR(100) NULL");
        ensureColumn(table, "created_by_team",     "NVARCHAR(100) NULL");
        ensureColumn(table, "created_by_position", "NVARCHAR(50) NULL");
    }

    private void addModifiedBy(String table) {
        ensureColumn(table, "modified_by_user_id",  "BIGINT NULL");
        ensureColumn(table, "modified_by_name",     "NVARCHAR(100) NULL");
        ensureColumn(table, "modified_by_team",     "NVARCHAR(100) NULL");
        ensureColumn(table, "modified_by_position", "NVARCHAR(50) NULL");
    }

    private void ensureColumn(String table, String column, String definition) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (tableExists == null || tableExists == 0) return;

            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
                Integer.class, table, column);
            if (colExists != null && colExists > 0) return;

            jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " " + definition);
            log.info("{}.{} 컬럼 추가", table, column);
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 추가 실패: {}", table, column, e.getMessage());
        }
    }
}

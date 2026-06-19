package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 매퍼 INSERT 가 참조하지만 DB 에 없는 도메인/레거시 flat 컬럼을 보장한다.
 *
 * 배경: Flyway 비활성 상태라 V120/V215 등 일부 마이그레이션이 적용되지 않아,
 *  - tb_risk_assessment.author_* (V215, 작성자 도메인 컬럼 — PersonRef JSON 아님)
 *  - tb_health_checkup_plan.created_by_dept/team/position (V120/V215, 작성자 레거시 flat)
 * 가 누락 → 해당 화면 등록(INSERT) 이 "열 이름 'xxx' 이(가) 유효하지 않습니다" 500 으로 전부 실패.
 *
 * 이 초기화기는 sys.columns 로 존재 확인 후 없을 때만 ALTER ADD (멱등 — 재기동 안전).
 * PersonRef JSON 컬럼은 PersonRefColumnsInitializer 가 담당하며 여기서 다루지 않는다.
 */
@Slf4j
@Order(55)
@Component
@RequiredArgsConstructor
public class MissingMapperColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        int added = 0;

        // ── tb_risk_assessment : 작성자(author) 도메인 flat 컬럼 (RiskAssessmentMapper INSERT 참조) ──
        added += ensure("tb_risk_assessment", "author_user_id",  "BIGINT NULL");
        added += ensure("tb_risk_assessment", "author_name",     "NVARCHAR(100) NULL");
        added += ensure("tb_risk_assessment", "author_team",     "NVARCHAR(100) NULL");
        added += ensure("tb_risk_assessment", "author_position", "NVARCHAR(50) NULL");
        added += ensure("tb_risk_assessment", "author_dept",     "NVARCHAR(100) NULL");
        added += ensure("tb_risk_assessment", "author_mail",     "NVARCHAR(200) NULL");

        // ── tb_health_checkup_plan : 작성자 레거시 flat + 승인 컬럼 (V120/V180/V215 미적용분) ──
        //    승인자 자체는 JSON(plan_approver/completion_approver, PersonRefColumnsInitializer) 사용 →
        //    여기선 INSERT(작성자 flat·writer) + transition(승인 타임스탬프·사유) 가 참조하는 컬럼만 보장.
        added += ensure("tb_health_checkup_plan", "created_by_dept",        "NVARCHAR(100) NULL");
        added += ensure("tb_health_checkup_plan", "created_by_team",        "NVARCHAR(100) NULL");
        added += ensure("tb_health_checkup_plan", "created_by_position",    "NVARCHAR(50) NULL");
        added += ensure("tb_health_checkup_plan", "writer",                 "NVARCHAR(100) NULL");
        added += ensure("tb_health_checkup_plan", "plan_approved_at",       "DATETIME2 NULL");
        added += ensure("tb_health_checkup_plan", "plan_approved_by",       "NVARCHAR(50) NULL");
        added += ensure("tb_health_checkup_plan", "completion_approved_at", "DATETIME2 NULL");
        added += ensure("tb_health_checkup_plan", "completion_approved_by", "NVARCHAR(50) NULL");
        added += ensure("tb_health_checkup_plan", "reject_reason",          "NVARCHAR(500) NULL");

        log.info("MissingMapperColumnsInitializer: 누락 컬럼 {}개 추가", added);
    }

    private int ensure(String table, String column, String definition) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (tableExists == null || tableExists == 0) return 0;

            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
                Integer.class, table, column);
            if (colExists != null && colExists > 0) return 0;

            jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " " + definition);
            log.info("{}.{} 컬럼 추가", table, column);
            return 1;
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 추가 실패: {}", table, column, e.getMessage());
            return 0;
        }
    }
}

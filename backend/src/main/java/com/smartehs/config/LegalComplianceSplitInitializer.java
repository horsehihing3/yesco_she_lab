package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * V192: 법규 대응 전용 테이블 6종 생성 — tb_audit_* 에서 LEGAL_COMPLIANCE 데이터 이관
 */
@Slf4j
@Order(100)
@Component
@RequiredArgsConstructor
public class LegalComplianceSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            createPlan();
            createExec();
            createFinding();
            createCorrective();
            createLog();
            createLogItem();
            log.info("LegalComplianceSplitInitializer 완료");
        } catch (Exception e) {
            log.warn("LegalComplianceSplitInitializer 실패 — 서버는 계속 기동", e);
        }
    }

    private void createPlan() {
        if (tableExists("tb_legal_compliance_plan")) return;
        jdbcTemplate.execute(
            "SELECT * INTO tb_legal_compliance_plan FROM tb_audit_plan WHERE audit_type = 'LEGAL_COMPLIANCE'");
        jdbcTemplate.execute(
            "ALTER TABLE tb_legal_compliance_plan ADD CONSTRAINT PK_lc_plan PRIMARY KEY (id)");
        log.info("tb_legal_compliance_plan 생성 완료");
    }

    private void createExec() {
        if (tableExists("tb_legal_compliance_exec")) return;
        jdbcTemplate.execute(
            "SELECT * INTO tb_legal_compliance_exec FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE'");
        jdbcTemplate.execute(
            "ALTER TABLE tb_legal_compliance_exec ADD CONSTRAINT PK_lc_exec PRIMARY KEY (id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_lc_exec_plan_id ON tb_legal_compliance_exec(plan_id)");
        log.info("tb_legal_compliance_exec 생성 완료");
    }

    private void createFinding() {
        if (tableExists("tb_legal_compliance_finding")) return;
        jdbcTemplate.execute(
            "SELECT f.* INTO tb_legal_compliance_finding FROM tb_audit_finding f " +
            "WHERE f.audit_id IN (SELECT id FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE')");
        jdbcTemplate.execute(
            "ALTER TABLE tb_legal_compliance_finding ADD CONSTRAINT PK_lc_finding PRIMARY KEY (id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_lc_finding_exec_id ON tb_legal_compliance_finding(audit_id)");
        log.info("tb_legal_compliance_finding 생성 완료");
    }

    private void createCorrective() {
        if (tableExists("tb_legal_compliance_corrective")) return;
        jdbcTemplate.execute(
            "SELECT c.* INTO tb_legal_compliance_corrective FROM tb_audit_corrective c " +
            "WHERE c.audit_id IN (SELECT id FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE')");
        jdbcTemplate.execute(
            "ALTER TABLE tb_legal_compliance_corrective ADD CONSTRAINT PK_lc_corrective PRIMARY KEY (id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_lc_corrective_finding_id ON tb_legal_compliance_corrective(finding_id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_lc_corrective_exec_id ON tb_legal_compliance_corrective(audit_id)");
        log.info("tb_legal_compliance_corrective 생성 완료");
    }

    private void createLog() {
        if (tableExists("tb_legal_compliance_log")) return;
        jdbcTemplate.execute(
            "SELECT l.* INTO tb_legal_compliance_log FROM tb_audit_log l " +
            "WHERE l.audit_id IN (SELECT id FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE')");
        jdbcTemplate.execute(
            "ALTER TABLE tb_legal_compliance_log ADD CONSTRAINT PK_lc_log PRIMARY KEY (id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_lc_log_exec_id ON tb_legal_compliance_log(audit_id)");
        log.info("tb_legal_compliance_log 생성 완료");
    }

    private void createLogItem() {
        if (tableExists("tb_legal_compliance_log_item")) return;
        jdbcTemplate.execute(
            "SELECT li.* INTO tb_legal_compliance_log_item FROM tb_audit_log_item li " +
            "WHERE li.log_id IN (SELECT id FROM tb_legal_compliance_log)");
        jdbcTemplate.execute(
            "ALTER TABLE tb_legal_compliance_log_item ADD CONSTRAINT PK_lc_log_item PRIMARY KEY (id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_lc_log_item_log_id ON tb_legal_compliance_log_item(log_id)");
        log.info("tb_legal_compliance_log_item 생성 완료");
    }

    private boolean tableExists(String tableName) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, tableName);
        return n != null && n > 0;
    }
}

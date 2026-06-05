package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 법규 대응 6개 테이블 자동 생성 (Flyway 비활성 환경 대응 — V192 역할).
 * tb_legal_compliance_plan / exec / finding / corrective / log / log_item
 */
@Slf4j
@Order(50)
@Component
@RequiredArgsConstructor
public class LegalComplianceSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        createPlanTable();
        createExecTable();
        createFindingTable();
        createCorrectiveTable();
        createLogTable();
        createLogItemTable();
    }

    // ── 1) tb_legal_compliance_plan ──────────────────────────────────────────
    private void createPlanTable() {
        if (tableExists("tb_legal_compliance_plan")) return;
        try {
            jdbc.execute(
                "CREATE TABLE tb_legal_compliance_plan (" +
                "  id                           BIGINT IDENTITY(1,1) PRIMARY KEY," +
                "  plan_id                      NVARCHAR(50)   NULL," +
                "  audit_name                   NVARCHAR(200)  NULL," +
                "  audit_type                   NVARCHAR(50)   NULL," +
                "  target_dept                  NVARCHAR(100)  NULL," +
                "  target_site                  NVARCHAR(100)  NULL," +
                "  auditor_name                 NVARCHAR(200)  NULL," +
                "  auditor_dept                 NVARCHAR(100)  NULL," +
                "  person_in_charge             NVARCHAR(100)  NULL," +
                "  plan_start_date              DATE           NULL," +
                "  plan_end_date                DATE           NULL," +
                "  purpose                      NVARCHAR(1000) NULL," +
                "  status                       NVARCHAR(50)   NULL," +
                "  notes                        NVARCHAR(MAX)  NULL," +
                "  checklist_template_id        BIGINT         NULL," +
                "  approved                     BIT            NULL DEFAULT 0," +
                "  approved_by                  NVARCHAR(100)  NULL," +
                "  approved_at                  DATETIME2      NULL," +
                "  plan_approver_user_id        BIGINT         NULL," +
                "  plan_approver_team           NVARCHAR(100)  NULL," +
                "  plan_approver_position       NVARCHAR(100)  NULL," +
                "  plan_approver_name           NVARCHAR(100)  NULL," +
                "  plan_approved_at             DATETIME2      NULL," +
                "  plan_approved_by             NVARCHAR(100)  NULL," +
                "  completion_approver_user_id  BIGINT         NULL," +
                "  completion_approver_team     NVARCHAR(100)  NULL," +
                "  completion_approver_position NVARCHAR(100)  NULL," +
                "  completion_approver_name     NVARCHAR(100)  NULL," +
                "  completion_approved_at       DATETIME2      NULL," +
                "  completion_approved_by       NVARCHAR(100)  NULL," +
                "  created_by_user_id           BIGINT         NULL," +
                "  created_by_name              NVARCHAR(100)  NULL," +
                "  reject_reason                NVARCHAR(500)  NULL," +
                "  deleted                      BIT            NOT NULL DEFAULT 0," +
                "  created_at                   DATETIME2      NOT NULL DEFAULT GETDATE()," +
                "  modified_at                  DATETIME2      NOT NULL DEFAULT GETDATE()" +
                ")"
            );
            log.info("tb_legal_compliance_plan 테이블 생성 완료");
        } catch (Exception e) {
            log.error("tb_legal_compliance_plan 생성 실패", e);
        }
    }

    // ── 2) tb_legal_compliance_exec ──────────────────────────────────────────
    private void createExecTable() {
        if (tableExists("tb_legal_compliance_exec")) return;
        try {
            jdbc.execute(
                "CREATE TABLE tb_legal_compliance_exec (" +
                "  id                           BIGINT IDENTITY(1,1) PRIMARY KEY," +
                "  audit_id                     NVARCHAR(50)   NULL," +
                "  plan_id                      BIGINT         NULL," +
                "  audit_name                   NVARCHAR(200)  NULL," +
                "  audit_type                   NVARCHAR(50)   NULL," +
                "  target_dept                  NVARCHAR(100)  NULL," +
                "  target_site                  NVARCHAR(100)  NULL," +
                "  auditor_name                 NVARCHAR(200)  NULL," +
                "  auditor_dept                 NVARCHAR(100)  NULL," +
                "  audit_start_date             DATE           NULL," +
                "  audit_end_date               DATE           NULL," +
                "  grade                        NVARCHAR(20)   NULL," +
                "  total_checklist              INT            NULL DEFAULT 0," +
                "  completed_checklist          INT            NULL DEFAULT 0," +
                "  finding_count                INT            NULL DEFAULT 0," +
                "  status                       NVARCHAR(50)   NULL," +
                "  summary                      NVARCHAR(MAX)  NULL," +
                "  notes                        NVARCHAR(MAX)  NULL," +
                "  modified_by                  NVARCHAR(100)  NULL," +
                "  plan_approver_user_id        BIGINT         NULL," +
                "  plan_approver_team           NVARCHAR(100)  NULL," +
                "  plan_approver_position       NVARCHAR(100)  NULL," +
                "  plan_approver_name           NVARCHAR(100)  NULL," +
                "  plan_approved_at             DATETIME2      NULL," +
                "  plan_approved_by             NVARCHAR(100)  NULL," +
                "  completion_approver_user_id  BIGINT         NULL," +
                "  completion_approver_team     NVARCHAR(100)  NULL," +
                "  completion_approver_position NVARCHAR(100)  NULL," +
                "  completion_approver_name     NVARCHAR(100)  NULL," +
                "  completion_approved_at       DATETIME2      NULL," +
                "  completion_approved_by       NVARCHAR(100)  NULL," +
                "  created_by_user_id           BIGINT         NULL," +
                "  created_by_name              NVARCHAR(100)  NULL," +
                "  reject_reason                NVARCHAR(500)  NULL," +
                "  deleted                      BIT            NOT NULL DEFAULT 0," +
                "  created_at                   DATETIME2      NOT NULL DEFAULT GETDATE()," +
                "  modified_at                  DATETIME2      NOT NULL DEFAULT GETDATE()" +
                ")"
            );
            jdbc.execute("CREATE INDEX IX_lc_exec_plan_id ON tb_legal_compliance_exec(plan_id)");
            log.info("tb_legal_compliance_exec 테이블 생성 완료");
        } catch (Exception e) {
            log.error("tb_legal_compliance_exec 생성 실패", e);
        }
    }

    // ── 3) tb_legal_compliance_finding ──────────────────────────────────────
    private void createFindingTable() {
        if (tableExists("tb_legal_compliance_finding")) return;
        try {
            jdbc.execute(
                "CREATE TABLE tb_legal_compliance_finding (" +
                "  id               BIGINT IDENTITY(1,1) PRIMARY KEY," +
                "  finding_id       NVARCHAR(50)   NULL," +
                "  audit_id         BIGINT         NULL," +
                "  severity         NVARCHAR(50)   NULL," +
                "  description      NVARCHAR(MAX)  NULL," +
                "  legal_ref        NVARCHAR(500)  NULL," +
                "  responsible_name NVARCHAR(100)  NULL," +
                "  responsible_dept NVARCHAR(100)  NULL," +
                "  due_date         DATE           NULL," +
                "  status           NVARCHAR(50)   NULL," +
                "  notes            NVARCHAR(MAX)  NULL," +
                "  deleted          BIT            NOT NULL DEFAULT 0," +
                "  created_at       DATETIME2      NOT NULL DEFAULT GETDATE()," +
                "  modified_at      DATETIME2      NOT NULL DEFAULT GETDATE()" +
                ")"
            );
            jdbc.execute("CREATE INDEX IX_lc_finding_exec_id ON tb_legal_compliance_finding(audit_id)");
            log.info("tb_legal_compliance_finding 테이블 생성 완료");
        } catch (Exception e) {
            log.error("tb_legal_compliance_finding 생성 실패", e);
        }
    }

    // ── 4) tb_legal_compliance_corrective ───────────────────────────────────
    private void createCorrectiveTable() {
        if (tableExists("tb_legal_compliance_corrective")) return;
        try {
            jdbc.execute(
                "CREATE TABLE tb_legal_compliance_corrective (" +
                "  id                   BIGINT IDENTITY(1,1) PRIMARY KEY," +
                "  corrective_id        NVARCHAR(50)   NULL," +
                "  finding_id           BIGINT         NULL," +
                "  audit_id             BIGINT         NULL," +
                "  finding_description  NVARCHAR(MAX)  NULL," +
                "  severity             NVARCHAR(50)   NULL," +
                "  action_description   NVARCHAR(MAX)  NULL," +
                "  responsible_name     NVARCHAR(100)  NULL," +
                "  responsible_dept     NVARCHAR(100)  NULL," +
                "  due_date             DATE           NULL," +
                "  status               NVARCHAR(50)   NULL," +
                "  notes                NVARCHAR(MAX)  NULL," +
                "  deleted              BIT            NOT NULL DEFAULT 0," +
                "  created_at           DATETIME2      NOT NULL DEFAULT GETDATE()," +
                "  modified_at          DATETIME2      NOT NULL DEFAULT GETDATE()" +
                ")"
            );
            jdbc.execute("CREATE INDEX IX_lc_corrective_finding_id ON tb_legal_compliance_corrective(finding_id)");
            jdbc.execute("CREATE INDEX IX_lc_corrective_exec_id   ON tb_legal_compliance_corrective(audit_id)");
            log.info("tb_legal_compliance_corrective 테이블 생성 완료");
        } catch (Exception e) {
            log.error("tb_legal_compliance_corrective 생성 실패", e);
        }
    }

    // ── 5) tb_legal_compliance_log ───────────────────────────────────────────
    private void createLogTable() {
        if (tableExists("tb_legal_compliance_log")) return;
        try {
            jdbc.execute(
                "CREATE TABLE tb_legal_compliance_log (" +
                "  id            BIGINT IDENTITY(1,1) PRIMARY KEY," +
                "  audit_id      BIGINT         NULL," +
                "  action        NVARCHAR(100)  NULL," +
                "  changed_by    NVARCHAR(100)  NULL," +
                "  detail        NVARCHAR(MAX)  NULL," +
                "  total_count   INT            NULL," +
                "  pass_count    INT            NULL," +
                "  fail_count    INT            NULL," +
                "  na_count      INT            NULL," +
                "  field_changes NVARCHAR(MAX)  NULL," +
                "  approval_id   BIGINT         NULL," +
                "  reject_reason NVARCHAR(500)  NULL," +
                "  actor_role    NVARCHAR(50)   NULL," +
                "  created_at    DATETIME2      NOT NULL DEFAULT GETDATE()" +
                ")"
            );
            jdbc.execute("CREATE INDEX IX_lc_log_exec_id ON tb_legal_compliance_log(audit_id)");
            log.info("tb_legal_compliance_log 테이블 생성 완료");
        } catch (Exception e) {
            log.error("tb_legal_compliance_log 생성 실패", e);
        }
    }

    // ── 6) tb_legal_compliance_log_item ─────────────────────────────────────
    private void createLogItemTable() {
        if (tableExists("tb_legal_compliance_log_item")) return;
        try {
            jdbc.execute(
                "CREATE TABLE tb_legal_compliance_log_item (" +
                "  id              BIGINT IDENTITY(1,1) PRIMARY KEY," +
                "  log_id          BIGINT         NULL," +
                "  category_name   NVARCHAR(200)  NULL," +
                "  item_no         INT            NULL," +
                "  classification  NVARCHAR(100)  NULL," +
                "  check_item      NVARCHAR(MAX)  NULL," +
                "  legal_basis     NVARCHAR(500)  NULL," +
                "  check_result    NVARCHAR(50)   NULL," +
                "  finding         NVARCHAR(MAX)  NULL," +
                "  action_deadline DATE           NULL," +
                "  action_complete BIT            NULL DEFAULT 0" +
                ")"
            );
            jdbc.execute("CREATE INDEX IX_lc_log_item_log_id ON tb_legal_compliance_log_item(log_id)");
            log.info("tb_legal_compliance_log_item 테이블 생성 완료");
        } catch (Exception e) {
            log.error("tb_legal_compliance_log_item 생성 실패", e);
        }
    }

    // ── 유틸 ─────────────────────────────────────────────────────────────────
    private boolean tableExists(String tableName) {
        Integer cnt = jdbc.queryForObject(
            "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, tableName);
        return cnt != null && cnt > 0;
    }
}

package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 사무업무 탭 Step 2/3/4 체크리스트 연결을 위한 컬럼 보강만 담당.
 * (템플릿은 사용자가 체크리스트 관리 화면 3개 신규 탭에서 직접 만들어 관리하므로 자동 시드 없음)
 * Flyway 비활성 환경에서도 V135 와 동일 동작.
 */
@Slf4j
@Order(40)
@Component
@RequiredArgsConstructor
public class OfficeWorkChecklistLinkInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureColumn("tb_risk_assessment", "office_checklist_id");
        ensureColumn("tb_risk_assessment", "sanup_checklist_id");
        ensureColumn("tb_risk_assessment", "jungdae_checklist_id");
    }

    private void ensureColumn(String table, String column) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (tableExists == null || tableExists == 0) return;
            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
                Integer.class, table, column);
            if (colExists != null && colExists > 0) return;
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " BIGINT NULL");
            log.info("스키마 보강: ALTER TABLE {} ADD {} BIGINT NULL", table, column);
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 추가 실패", table, column, e);
        }
    }
}

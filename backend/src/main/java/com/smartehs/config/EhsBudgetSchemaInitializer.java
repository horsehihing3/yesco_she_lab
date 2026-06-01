package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_ehs_budget_plan 의 스키마 변경(분기 컬럼 폐기 + plan_amount 도입)을
 * Flyway 비활성 환경에서도 자동 적용하기 위한 startup runner.
 */
@Slf4j
@Order(20)
@Component
@RequiredArgsConstructor
public class EhsBudgetSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // tb_ehs_budget_plan : 분기 컬럼 → plan_amount 단일 컬럼
        adjustBudgetPlanSchema();
        // tb_ehs_budget_expense : vendor / plan_id 컬럼 제거 (입력폼에서 빠짐)
        dropColumns("tb_ehs_budget_expense", new String[]{"vendor", "plan_id"});
    }

    private void adjustBudgetPlanSchema() {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_ehs_budget_plan'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            // 1) plan_amount 컬럼 추가
            Integer planAmountExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_budget_plan') AND name = 'plan_amount'",
                Integer.class);
            if (planAmountExists == null || planAmountExists == 0) {
                log.info("스키마 보강: ALTER TABLE tb_ehs_budget_plan ADD plan_amount BIGINT NOT NULL DEFAULT 0");
                jdbcTemplate.execute(
                    "ALTER TABLE tb_ehs_budget_plan ADD plan_amount BIGINT NOT NULL CONSTRAINT DF_tb_ehs_budget_plan_plan_amount DEFAULT 0");
            }

            // 2) q1~q4 가 아직 있으면 그 합계로 plan_amount 백필 (한 번만)
            Integer hasQ1 = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_budget_plan') AND name = 'q1_amount'",
                Integer.class);
            if (hasQ1 != null && hasQ1 > 0) {
                int updated = jdbcTemplate.update(
                    "UPDATE tb_ehs_budget_plan SET plan_amount = COALESCE(q1_amount,0)+COALESCE(q2_amount,0)+COALESCE(q3_amount,0)+COALESCE(q4_amount,0), modified_at = GETDATE() WHERE plan_amount = 0");
                if (updated > 0) log.info("plan_amount 백필 완료: {}건", updated);
                dropColumns("tb_ehs_budget_plan",
                    new String[]{"q1_amount", "q2_amount", "q3_amount", "q4_amount"});
            }
        } catch (Exception e) {
            log.error("tb_ehs_budget_plan 스키마 보강 실패", e);
        }
    }

    /**
     * 지정한 테이블의 컬럼들을 default constraint 와 함께 제거. 컬럼이 이미 없으면 무시.
     */
    private void dropColumns(String table, String[] columns) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (tableExists == null || tableExists == 0) return;
            for (String col : columns) {
                Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
                    Integer.class, table, col);
                if (exists == null || exists == 0) continue;
                dropDefaultThenColumn(table, col);
            }
        } catch (Exception e) {
            log.error("{} 컬럼 정리 실패", table, e);
        }
    }

    private void dropDefaultThenColumn(String table, String column) {
        try {
            String dfName = jdbcTemplate.queryForObject(
                "SELECT dc.name FROM sys.default_constraints dc " +
                "  INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id " +
                "  WHERE dc.parent_object_id = OBJECT_ID(?) AND c.name = ?",
                String.class, table, column);
            if (dfName != null && !dfName.isEmpty()) {
                jdbcTemplate.execute("ALTER TABLE " + table + " DROP CONSTRAINT [" + dfName + "]");
            }
        } catch (Exception ignored) { /* default constraint 없을 수 있음 */ }
        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " DROP COLUMN " + column);
            log.info("스키마 보강: ALTER TABLE {} DROP COLUMN {}", table, column);
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 삭제 실패", table, column, e);
        }
    }
}

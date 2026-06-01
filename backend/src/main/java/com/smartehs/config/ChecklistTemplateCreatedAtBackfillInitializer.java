package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 체크리스트 템플릿 더미데이터의 created_at 을 다양한 날짜로 분산 (V144 와 동일 동작).
 * Flyway 비활성 환경에서도 부팅 시 자동 백필.
 *
 * 정책: 카테고리별 + id 내림차순으로 1주일씩 과거로 슬라이딩 + 0~4 일 랜덤 jitter.
 *       (이미 어제 이전인 created_at 은 그대로 두어 사용자가 손으로 만든 데이터에는 영향 없음)
 */
@Slf4j
@Order(85)
@Component
@RequiredArgsConstructor
public class ChecklistTemplateCreatedAtBackfillInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_checklist_template'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            int n = jdbcTemplate.update(
                "WITH ranked AS (" +
                "  SELECT id, ROW_NUMBER() OVER (PARTITION BY ISNULL(category_type, N'') ORDER BY id DESC) AS rn" +
                "    FROM tb_checklist_template" +
                ")" +
                "UPDATE t " +
                "   SET created_at  = DATEADD(DAY, -((r.rn - 1) * 7) - (ABS(CHECKSUM(NEWID())) % 5), GETDATE()), " +
                "       modified_at = DATEADD(DAY, -((r.rn - 1) * 7) - (ABS(CHECKSUM(NEWID())) % 5), GETDATE()) " +
                "  FROM tb_checklist_template t " +
                "  JOIN ranked r ON r.id = t.id " +
                " WHERE t.created_at IS NULL " +
                "    OR CAST(t.created_at AS DATE) >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE))");
            if (n > 0) log.info("체크리스트 템플릿 더미 created_at 분산 백필: {}건", n);

            // tb_eval_sheet_meta 도 처리
            Integer metaTableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_eval_sheet_meta'", Integer.class);
            if (metaTableExists != null && metaTableExists > 0) {
                int m = jdbcTemplate.update(
                    "UPDATE tb_eval_sheet_meta " +
                    "   SET created_at  = COALESCE(created_at,  DATEADD(DAY, -30, GETDATE())), " +
                    "       modified_at = COALESCE(modified_at, DATEADD(DAY, -30, GETDATE())) " +
                    " WHERE created_at IS NULL " +
                    "    OR CAST(created_at AS DATE) >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE))");
                if (m > 0) log.info("평가표 meta created_at 백필: {}건", m);
            }
        } catch (Exception e) {
            log.warn("체크리스트 템플릿 created_at 백필 실패", e);
        }
    }
}

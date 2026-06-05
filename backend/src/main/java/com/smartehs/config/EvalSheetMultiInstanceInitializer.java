package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * V193: tb_eval_sheet_item — meta_id 컬럼 추가 + 기존 항목 backfill
 * (Flyway 비활성 환경용)
 */
@Slf4j
@Order(97)
@Component
@RequiredArgsConstructor
public class EvalSheetMultiInstanceInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // 1) meta_id 컬럼 추가
            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_eval_sheet_item') AND name = 'meta_id'",
                Integer.class);
            if (colExists == null || colExists == 0) {
                jdbcTemplate.execute("ALTER TABLE tb_eval_sheet_item ADD meta_id BIGINT NULL");
                log.info("tb_eval_sheet_item.meta_id 컬럼 추가 완료");
            }

            // 2) meta 시드 (없는 경우에만)
            Integer metaCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tb_eval_sheet_meta", Integer.class);
            if (metaCount == null || metaCount == 0) {
                jdbcTemplate.execute(
                    "INSERT INTO tb_eval_sheet_meta (title, description, created_at, modified_at) " +
                    "VALUES (N'수급업체 평가표', N'', GETDATE(), GETDATE())");
                log.info("tb_eval_sheet_meta 기본 행 삽입 완료");
            }

            // 3) 기존 항목 backfill
            jdbcTemplate.execute(
                "UPDATE tb_eval_sheet_item " +
                "SET meta_id = (SELECT TOP 1 id FROM tb_eval_sheet_meta ORDER BY id ASC) " +
                "WHERE meta_id IS NULL");
            log.info("tb_eval_sheet_item.meta_id backfill 완료");

            // 4) 인덱스
            Integer idxExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.indexes WHERE name = 'IX_eval_sheet_item_meta_id'",
                Integer.class);
            if (idxExists == null || idxExists == 0) {
                jdbcTemplate.execute(
                    "CREATE INDEX IX_eval_sheet_item_meta_id ON tb_eval_sheet_item(meta_id)");
                log.info("IX_eval_sheet_item_meta_id 인덱스 생성 완료");
            }
        } catch (Exception e) {
            log.warn("EvalSheetMultiInstanceInitializer 실패 — 서버는 계속 기동", e);
        }
    }
}

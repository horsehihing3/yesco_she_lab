package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_file_metadata 에 display_order 컬럼이 없으면 추가한다.
 * 사용자 지정 이미지 순서(드래그&드롭 재배치) 저장용.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FileMetadataDisplayOrderInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_file_metadata') AND name = 'display_order'",
                Integer.class);
            if (exists == null || exists == 0) {
                log.info("tb_file_metadata.display_order 컬럼 추가");
                jdbcTemplate.execute("ALTER TABLE tb_file_metadata ADD display_order INT NULL");
            }
        } catch (Exception e) {
            log.error("tb_file_metadata.display_order 초기화 실패", e);
        }
    }
}

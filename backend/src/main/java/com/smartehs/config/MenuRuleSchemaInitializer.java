package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MenuRuleSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_menu_rule'",
                Integer.class);

            if (exists == null || exists == 0) {
                log.info("tb_menu_rule 테이블이 존재하지 않아 생성합니다.");
                jdbcTemplate.execute(
                    "CREATE TABLE tb_menu_rule (" +
                    "    id         INT IDENTITY(1,1) PRIMARY KEY," +
                    "    role_key   NVARCHAR(50)  NOT NULL," +
                    "    menu_key   NVARCHAR(100) NOT NULL," +
                    "    created_at DATETIME2 DEFAULT GETDATE()," +
                    "    CONSTRAINT UQ_menu_rule UNIQUE (role_key, menu_key)" +
                    ")");
                log.info("tb_menu_rule 테이블 생성 완료.");
            }
        } catch (Exception e) {
            log.error("tb_menu_rule 테이블 초기화 실패", e);
        }
    }
}

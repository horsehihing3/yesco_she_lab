package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ButtonRuleSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_button_rule'",
                Integer.class);

            if (exists == null || exists == 0) {
                log.info("tb_button_rule 테이블이 존재하지 않아 생성합니다.");
                jdbcTemplate.execute(
                    "CREATE TABLE tb_button_rule (" +
                    "    id           INT IDENTITY(1,1) PRIMARY KEY," +
                    "    menu_path    NVARCHAR(200) NOT NULL," +
                    "    status_code  NVARCHAR(100) NOT NULL," +
                    "    button_name  NVARCHAR(100) NOT NULL," +
                    "    role_key     NVARCHAR(50)  NOT NULL," +
                    "    visible      BIT           NOT NULL," +
                    "    created_at   DATETIME2     DEFAULT GETDATE()," +
                    "    modified_at  DATETIME2     DEFAULT GETDATE()," +
                    "    CONSTRAINT UQ_button_rule UNIQUE (menu_path, status_code, button_name, role_key)" +
                    ")");
                log.info("tb_button_rule 테이블 생성 완료.");
            }
        } catch (Exception e) {
            log.error("tb_button_rule 테이블 초기화 실패", e);
        }
    }
}

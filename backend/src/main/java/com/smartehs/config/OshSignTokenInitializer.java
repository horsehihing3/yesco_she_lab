package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_osh_sign_token 테이블 생성 (이메일 서명 링크용 토큰)
 */
@Slf4j
@Order(98)
@Component
@RequiredArgsConstructor
public class OshSignTokenInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_osh_sign_token'", Integer.class);
            if (tableExists != null && tableExists > 0) return;

            jdbcTemplate.execute(
                "CREATE TABLE tb_osh_sign_token (" +
                "  id            BIGINT IDENTITY(1,1) PRIMARY KEY," +
                "  token         NVARCHAR(100) NOT NULL UNIQUE," +
                "  committee_id  BIGINT NOT NULL," +
                "  attendee_id   BIGINT NOT NULL," +
                "  attendee_name NVARCHAR(100)," +
                "  attendee_mail NVARCHAR(200)," +
                "  used          BIT NOT NULL DEFAULT 0," +
                "  expires_at    DATETIME2," +
                "  created_at    DATETIME2 DEFAULT GETDATE()" +
                ")"
            );
            log.info("tb_osh_sign_token 테이블 생성 완료");
        } catch (Exception e) {
            log.warn("OshSignTokenInitializer 실행 실패", e);
        }
    }
}

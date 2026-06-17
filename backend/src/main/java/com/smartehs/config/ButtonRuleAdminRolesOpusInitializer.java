package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Opus 담당 도메인(교육/비상/작업허가/내부감사/KPI목표)의 "일반관리자 grant" 기본값.
 * 서버 시작 시 MERGE(upsert visible=1)로 멱등 실행. @Order(103) — Sonnet 초기화기(102) 이후.
 *
 * 추상역할(guest/writer/planApprover 등)은 tb_button_rule 시더가 없어 fresh DB 에서
 * DEFAULT_MENU_DATA(프론트 코드) 폴백으로 처리되므로, 여기서는 코드화 안 되는
 * "일반관리자(구체 역할) grant" 만 시드한다. (계정 없으면 EHS_ADMIN — 정책)
 */
@Slf4j
@Order(103)
@Component
@RequiredArgsConstructor
public class ButtonRuleAdminRolesOpusInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    private static final String MERGE_SQL =
        "MERGE tb_button_rule AS t " +
        "USING (VALUES (?,?,?,?)) AS s(m,st,bn,rk) " +
        "  ON t.menu_path=s.m AND t.status_code=s.st AND t.button_name=s.bn AND t.role_key=s.rk " +
        "WHEN MATCHED THEN UPDATE SET visible=1, modified_at=GETDATE() " +
        "WHEN NOT MATCHED THEN INSERT (menu_path,status_code,button_name,role_key,visible) " +
        "  VALUES (s.m,s.st,s.bn,s.rk,1);";

    @Override
    public void run(String... args) {
        try {
            List<Object[]> rows = new ArrayList<>();

            // 교육현황(관리자) — 일반관리자 = TRAINING_ADMIN(계정 있으면) / 없으면 EHS_ADMIN
            String edu = resolveRole("TRAINING_ADMIN");
            String EDU = "SHE 경영 › 교육·훈련 › 교육현황 (관리자)";
            u(rows, EDU, "PENDING",  "반려", edu);
            u(rows, EDU, "PENDING",  "승인", edu);
            u(rows, EDU, "APPROVED", "수료", edu);

            // New = 일반관리자(EHS_ADMIN) — 도메인 전용 관리자 계정 부재로 회사 EHS 담당자
            u(rows, "SHE 경영 › 비상 훈련 › 비상 계획", "LIST", "신규 등록", "EHS_ADMIN");
            u(rows, "안전 관리 › 작업 허가 › 허가 신청", "LIST", "신규 등록", "EHS_ADMIN");
            u(rows, "SHE 경영 › 내부 감사 › 감사 계획", "LIST", "신규 등록", "EHS_ADMIN");
            u(rows, "SHE 경영 › KPI목표 › 연간계획",    "LIST", "신규 등록", "EHS_ADMIN");

            int n = flush(rows);
            log.info("ButtonRuleAdminRolesOpusInitializer: {}건 upsert 완료", n);
        } catch (Exception e) {
            log.warn("ButtonRuleAdminRolesOpusInitializer 실패: {}", e.getMessage());
        }
    }

    /** 해당 역할에 활성 계정이 존재하면 그 역할, 없으면 EHS_ADMIN */
    private String resolveRole(String specificRole) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM T_IDM_USER WHERE UserRole = ? AND UserStatus = '10'",
                Integer.class, specificRole);
            return (count != null && count > 0) ? specificRole : "EHS_ADMIN";
        } catch (Exception e) {
            return "EHS_ADMIN";
        }
    }

    private void u(List<Object[]> rows, String menuPath, String statusCode, String buttonName, String roleKey) {
        rows.add(new Object[]{menuPath, statusCode, buttonName, roleKey});
    }

    private int flush(List<Object[]> rows) {
        int n = 0;
        for (Object[] r : rows) {
            jdbcTemplate.update(MERGE_SQL, r[0], r[1], r[2], r[3]);
            n++;
        }
        return n;
    }
}

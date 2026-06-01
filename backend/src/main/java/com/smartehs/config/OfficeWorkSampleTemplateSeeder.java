package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

/**
 * 체크리스트 관리 - "위험성 평가2" 탭(OFFICE_WORK)
 * 시작 시점에 비어 있으면 샘플 템플릿을 자동 시드 (idempotent: 동일 template_name 있으면 skip).
 * V162 이후 산안법/중대재해법 예방 사무업무 탭이 OFFICE_WORK 로 통합됨.
 */
@Slf4j
@Order(50)
@Component
@RequiredArgsConstructor
public class OfficeWorkSampleTemplateSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    private record TemplateSeed(String name, String desc, String categoryType, int sortOrder,
                                List<CategorySeed> categories) {}
    private record CategorySeed(String name, int sortOrder, List<ItemSeed> items) {}
    private record ItemSeed(String checkItem, String legalBasis) {}

    private static final List<TemplateSeed> SEEDS = List.of(
        new TemplateSeed("사무실 일반 안전 점검표",
            "사무업무 환경 일반 안전 점검 (전기·소방·인간공학·정리정돈)", "OFFICE_WORK", 1,
            List.of(
                new CategorySeed("전기·소방", 1, List.of(
                    new ItemSeed("멀티탭/콘센트 과부하 여부 (문어발 배선)", "전기설비기술기준"),
                    new ItemSeed("노후 전선·접속부 점검 상태", "전기안전관리법"),
                    new ItemSeed("소화기 비치 위치·압력 게이지 정상", "화재예방법"),
                    new ItemSeed("비상구·대피로 적재물 차단 여부", "소방시설법 제10조")
                )),
                new CategorySeed("일반 환경", 2, List.of(
                    new ItemSeed("실내 공기질·환기 상태 (이산화탄소·미세먼지)", "실내공기질법"),
                    new ItemSeed("조도 적정성 (사무 500 lux 이상)", "산업안전보건기준규칙"),
                    new ItemSeed("정수기·탕비 가전 위생/누전 점검", "식품위생법·전기안전법")
                )),
                new CategorySeed("인간공학·정리정돈", 3, List.of(
                    new ItemSeed("모니터·키보드·의자 인체공학 적합성", "산안법 제39조"),
                    new ItemSeed("복도·통로 적재·돌출물 제거 상태", "산안법 제38조"),
                    new ItemSeed("문서·서류 정리정돈 (낙하·미끄럼 위험)", "산안법 제38조")
                ))
            )),
        new TemplateSeed("PC·VDT 작업 환경 점검표",
            "장시간 PC 사용 사무직 근골격계·시각 관련 점검", "OFFICE_WORK", 2,
            List.of(
                new CategorySeed("근골격계 부담", 1, List.of(
                    new ItemSeed("의자 높이·등받이 조절 적정성", "산업안전보건기준규칙 제657조"),
                    new ItemSeed("책상·키보드 높이 인체공학 적합성", "산업안전보건기준규칙 제657조"),
                    new ItemSeed("마우스·키보드 손목 받침대 사용", "근골격계부담작업 기준")
                )),
                new CategorySeed("시각·조명", 2, List.of(
                    new ItemSeed("모니터 거리·시선 각도 (50~70cm, 약간 아래)", "VDT 작업 가이드"),
                    new ItemSeed("모니터 밝기·반사광 차단 상태", "VDT 작업 가이드")
                )),
                new CategorySeed("휴식·교육", 3, List.of(
                    new ItemSeed("1시간 작업 후 10분 휴식 권장 안내", "산업안전보건법 제5조"),
                    new ItemSeed("VDT 증후군 예방 교육 실시 여부", "산안법 제29조")
                ))
            )),
        new TemplateSeed("산업안전보건법 사무직 예방 점검표",
            "산업안전보건법상 사무직 사업장에 적용되는 의무 사항 점검", "OFFICE_WORK", 3,
            List.of(
                new CategorySeed("안전보건교육", 1, List.of(
                    new ItemSeed("정기 안전보건교육 (분기 3시간) 실시", "산안법 제29조"),
                    new ItemSeed("신규 채용 시 안전보건교육 실시", "산안법 제29조")
                )),
                new CategorySeed("위험성평가", 2, List.of(
                    new ItemSeed("사무업무 위험성평가 정기 실시·기록", "산안법 제36조"),
                    new ItemSeed("위험성평가 결과 게시·전파", "산안법 제36조")
                )),
                new CategorySeed("작업환경·건강", 3, List.of(
                    new ItemSeed("사무실 작업환경측정 (필요 시)", "산안법 제125조"),
                    new ItemSeed("근로자 일반건강진단 실시 여부", "산안법 제129조"),
                    new ItemSeed("특수건강진단 대상자 식별 및 실시", "산안법 제130조")
                )),
                new CategorySeed("안전보건체계", 4, List.of(
                    new ItemSeed("안전보건관리책임자 선임 여부", "산안법 제15조"),
                    new ItemSeed("산업안전보건위원회 구성·운영", "산안법 제24조"),
                    new ItemSeed("안전보건관리규정 작성·게시", "산안법 제25조")
                ))
            )),
        new TemplateSeed("중대재해처벌법 사무직 예방 점검표",
            "중대시민재해 등 사무직 사업장에 적용되는 안전보건확보의무 점검", "OFFICE_WORK", 4,
            List.of(
                new CategorySeed("안전보건 경영방침", 1, List.of(
                    new ItemSeed("안전보건 경영방침 수립·서명·공표", "중대재해법 제4조제1항제1호"),
                    new ItemSeed("안전보건 목표·추진계획 매년 수립", "중대재해법 제4조제1항제1호")
                )),
                new CategorySeed("전담조직·예산", 2, List.of(
                    new ItemSeed("안전보건 전담 조직 설치 여부", "중대재해법 제4조제1항제2호"),
                    new ItemSeed("안전보건 예산 편성·집행 점검", "중대재해법 제4조제1항제3호")
                )),
                new CategorySeed("유해위험요인 점검", 3, List.of(
                    new ItemSeed("사무실 유해·위험요인 반기 1회 점검", "중대재해법 제4조제1항제3호"),
                    new ItemSeed("개선 조치 이행 여부 확인", "중대재해법 제4조제1항제3호")
                )),
                new CategorySeed("비상대응·교육", 4, List.of(
                    new ItemSeed("비상대응 매뉴얼 (화재·정전) 비치·교육", "중대재해법 제4조제1항제8호"),
                    new ItemSeed("경영책임자 안전보건 교육 이수", "중대재해법 제4조제1항제4호"),
                    new ItemSeed("중대재해 발생 시 보고체계 수립", "중대재해법 제4조제1항제5호")
                ))
            ))
    );

    @Override
    public void run(String... args) {
        try {
            Integer tplTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_checklist_template'", Integer.class);
            Integer catTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_checklist_category'", Integer.class);
            Integer itemTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_checklist_item'", Integer.class);
            if (tplTable == null || tplTable == 0 || catTable == null || catTable == 0
                || itemTable == null || itemTable == 0) return;

            int globalItemNo = 1;
            for (TemplateSeed seed : SEEDS) {
                Integer existing = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tb_checklist_template WHERE template_name = ?",
                    Integer.class, seed.name);
                if (existing != null && existing > 0) continue;

                jdbcTemplate.update(
                    "INSERT INTO tb_checklist_template (template_name, description, is_active, category_type, " +
                    "  result_options, sort_order, created_at, modified_at) " +
                    "VALUES (?,?,1,?,?,?,GETDATE(),GETDATE())",
                    seed.name, seed.desc, seed.categoryType, "적합,부적합", seed.sortOrder);

                Long tplId = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = ? ORDER BY id DESC",
                    Long.class, seed.name);
                if (tplId == null) continue;

                for (CategorySeed cat : seed.categories) {
                    jdbcTemplate.update(
                        "INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES (?,?,?)",
                        tplId, cat.name, cat.sortOrder);
                    Long catId = jdbcTemplate.queryForObject(
                        "SELECT TOP 1 id FROM tb_checklist_category WHERE template_id = ? AND category_name = ? ORDER BY id DESC",
                        Long.class, tplId, cat.name);
                    if (catId == null) continue;

                    int itemSort = 1;
                    for (ItemSeed item : cat.items) {
                        jdbcTemplate.update(
                            "INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) " +
                            "VALUES (?,?,?,?,?)",
                            catId, globalItemNo++, item.checkItem, item.legalBasis, itemSort++);
                    }
                }
                log.info("사무업무용 샘플 체크리스트 시드: {} ({}건 카테고리)", seed.name,
                    Objects.requireNonNull(seed.categories).size());
            }
        } catch (Exception e) {
            log.warn("사무업무 샘플 체크리스트 시드 실패", e);
        }
    }
}

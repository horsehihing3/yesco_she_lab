package com.smartehs.service;

import com.smartehs.dto.response.LegalSearchResult;
import com.smartehs.mapper.LegalResponseMapper;
import com.smartehs.model.LegalFilter;
import com.smartehs.model.LegalRegistry;
import com.smartehs.model.LegalRevisionLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LegalResponseService {

    private final LegalResponseMapper mapper;
    private final LawApiClient lawApi;

    // ===== 필터 (법령 화이트리스트) =====
    public LegalFilter getFilter() {
        LegalFilter f = mapper.findFilter();
        if (f == null) return LegalFilter.builder().allowedLaws("").build();
        return f;
    }

    @Transactional
    public LegalFilter updateFilter(String allowedLaws) {
        LegalFilter cur = mapper.findFilter();
        if (cur == null) {
            // 데이터 없을 시 안전 처리 — 신규 row 생성 mapper 없으니 일단 빈 반환
            return LegalFilter.builder().allowedLaws(allowedLaws).build();
        }
        cur.setAllowedLaws(allowedLaws == null ? "" : allowedLaws);
        mapper.updateFilter(cur);
        return mapper.findFilter();
    }

    /** 필터 키워드 리스트 — 빈 줄/공백 제거 */
    private List<String> filterKeywords() {
        LegalFilter f = mapper.findFilter();
        if (f == null || f.getAllowedLaws() == null) return java.util.Collections.emptyList();
        return Arrays.stream(f.getAllowedLaws().split("\\r?\\n"))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** law_name 이 키워드 중 하나라도 포함하면 매칭 */
    private boolean isLawAllowed(String lawName, List<String> keywords) {
        if (lawName == null || keywords.isEmpty()) return false;
        for (String k : keywords) if (lawName.contains(k)) return true;
        return false;
    }

    // ===== 외부 API (검색) =====
    public LegalSearchResult searchExternal(String query, int page, int display) {
        return lawApi.searchLaws(query, page, display);
    }

    /** 최근 개정 가져와 DB 캐시 — page=1 한 페이지만 */
    public Map<String, Object> syncRecentRevisions(int display) {
        return syncRecentRevisionsMulti(display, 1);
    }

    /**
     * 최근 개정 N 페이지 순회 + DB 저장
     * @param display 페이지당 항목 수 (최대 100)
     * @param pages   순회할 페이지 수 (1~10 권장)
     */
    @Transactional
    public Map<String, Object> syncRecentRevisionsMulti(int display, int pages) {
        List<String> keywords = filterKeywords();
        int fetched = 0, inserted = 0, skipped = 0, totalAvailable = 0;
        int p = Math.max(1, pages);
        for (int page = 1; page <= p; page++) {
            LegalSearchResult r = lawApi.fetchRecentRevisions(display, page);
            if (page == 1) totalAvailable = r.getTotalCount();
            if (r.getItems().isEmpty()) break;
            fetched += r.getItems().size();
            for (LegalSearchResult.Item it : r.getItems()) {
                if (it.getLawId() == null || it.getLawId().isEmpty()) continue;
                // 필터에 해당하지 않으면 skip
                if (!isLawAllowed(it.getLawName(), keywords)) { skipped++; continue; }
                String revDt = (it.getPromulgationDt() != null) ? it.getPromulgationDt() : it.getEnforceDt();
                Integer exists = mapper.findRevisionByLawIdAndDate(it.getLawId(), revDt);
                if (exists != null) continue;

                LegalRevisionLog rev = LegalRevisionLog.builder()
                        .lawId(it.getLawId())
                        .lawName(it.getLawName())
                        .revisionType(it.getRevisionType())
                        .revisionDt(revDt)
                        .enforceDt(it.getEnforceDt())
                        .detailLink(it.getDetailLink())
                        .reviewStatus("PENDING")
                        .impactLevel("MID")
                        .build();
                mapper.insertRevisionLog(rev);
                inserted++;
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("fetched", fetched);
        result.put("inserted", inserted);
        result.put("filtered", skipped);
        result.put("totalAvailable", totalAvailable);
        result.put("pages", p);
        return result;
    }

    // ===== Registry CRUD =====
    public List<LegalRegistry> listRegistry(String category, String keyword) {
        return mapper.findAllRegistry(category, keyword);
    }

    public LegalRegistry getRegistry(Long id) { return mapper.findRegistryById(id); }

    @Transactional
    public LegalRegistry createRegistry(LegalRegistry r) {
        // 동일 법령일련번호(law_id) 중복 등록 방지
        if (r.getLawId() != null && !r.getLawId().isEmpty()) {
            LegalRegistry existing = mapper.findRegistryByLawId(r.getLawId());
            if (existing != null) {
                throw new com.smartehs.exception.BadRequestException(
                        "이미 등록된 법령입니다: " + existing.getLawName());
            }
        }
        if (r.getStatus() == null) r.setStatus("ACTIVE");
        mapper.insertRegistry(r);
        return mapper.findRegistryById(r.getId());
    }

    @Transactional
    public LegalRegistry updateRegistry(Long id, LegalRegistry r) {
        r.setId(id);
        mapper.updateRegistry(r);
        return mapper.findRegistryById(id);
    }

    @Transactional
    public void deleteRegistry(Long id) {
        mapper.deleteRegistry(id);
    }

    // ===== Revision Log =====
    public List<LegalRevisionLog> listRevisions(String status, String keyword, String lawId) {
        List<LegalRevisionLog> all = mapper.findRevisionLogs(status, keyword, lawId);
        // lawId 명시적 지정 시 화이트리스트 우회 (사용자 직접 조회)
        if (lawId != null && !lawId.isEmpty()) return all;
        List<String> keywords = filterKeywords();
        if (keywords.isEmpty()) return all;
        return all.stream()
                .filter(r -> isLawAllowed(r.getLawName(), keywords))
                .collect(Collectors.toList());
    }

    public LegalRevisionLog getRevision(Long id) { return mapper.findRevisionLogById(id); }

    @Transactional
    public LegalRevisionLog updateRevision(Long id, LegalRevisionLog r) {
        r.setId(id);
        mapper.updateRevisionLog(r);
        return mapper.findRevisionLogById(id);
    }

    @Transactional
    public void deleteRevision(Long id) { mapper.deleteRevisionLog(id); }

    // ===== 등록 법령 별 미완료 개정 카운트 =====
    public Map<String, Long> getRegistryRevisionCounts() {
        List<LegalRegistry> all = mapper.findAllRegistry(null, null);
        List<String> lawIds = all.stream()
                .map(LegalRegistry::getLawId)
                .filter(id -> id != null && !id.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        Map<String, Long> result = new HashMap<>();
        if (lawIds.isEmpty()) return result;
        List<Map<String, Object>> rows = mapper.countOpenRevisionsByLawIds(lawIds);
        for (Map<String, Object> row : rows) {
            Object id = row.get("lawId");
            Object cnt = row.get("cnt");
            if (id != null && cnt != null) {
                result.put(id.toString(), ((Number) cnt).longValue());
            }
        }
        return result;
    }

    // ===== 등록 법령 일괄 개정 확인 (법제처 API) =====
    @Transactional
    public Map<String, Object> checkRegistryRevisions() {
        List<LegalRegistry> registry = mapper.findAllRegistry(null, null);
        int checked = 0, inserted = 0;
        List<Map<String, Object>> changes = new ArrayList<>();

        for (LegalRegistry r : registry) {
            if (r.getLawName() == null || r.getLawName().isEmpty()) continue;
            checked++;
            try {
                LegalSearchResult result = lawApi.searchLaws(r.getLawName(), 1, 20);
                for (LegalSearchResult.Item it : result.getItems()) {
                    boolean match =
                            (it.getLawId() != null && it.getLawId().equals(r.getLawId()))
                                    || (it.getLawName() != null && it.getLawName().equals(r.getLawName()));
                    if (!match) continue;

                    String newDate = it.getPromulgationDt();
                    String oldDate = r.getPromulgationDt();
                    boolean isNewer = newDate != null
                            && (oldDate == null || newDate.compareTo(oldDate) > 0);
                    if (!isNewer) break; // 동일 법령 매칭 후 더 신규 아니면 종료

                    // 이미 revision_log 에 동일 일자 기록이 있으면 skip
                    Integer exists = mapper.findRevisionByLawIdAndDate(it.getLawId(), newDate);
                    if (exists != null) break;

                    LegalRevisionLog rev = LegalRevisionLog.builder()
                            .lawId(it.getLawId())
                            .lawName(it.getLawName())
                            .revisionType(it.getRevisionType())
                            .revisionDt(newDate)
                            .enforceDt(it.getEnforceDt())
                            .detailLink(it.getDetailLink())
                            .reviewStatus("PENDING")
                            .impactLevel("MID")
                            .build();
                    mapper.insertRevisionLog(rev);
                    inserted++;
                    Map<String, Object> ch = new HashMap<>();
                    ch.put("lawName", r.getLawName());
                    ch.put("oldDate", oldDate);
                    ch.put("newDate", newDate);
                    changes.add(ch);
                    break;
                }
            } catch (Exception e) {
                log.warn("개정 확인 실패 lawName={} : {}", r.getLawName(), e.getMessage());
            }
        }

        Map<String, Object> ret = new HashMap<>();
        ret.put("checked", checked);
        ret.put("inserted", inserted);
        ret.put("changes", changes);
        return ret;
    }

    // ===== KPI =====
    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalLaws", mapper.countRegistry());

        // 개정 모니터링 카운트는 필터 적용 후 산정
        List<String> keywords = filterKeywords();
        if (keywords.isEmpty()) {
            kpi.put("pending", mapper.countRevisionByStatus("PENDING"));
            kpi.put("inReview", mapper.countRevisionByStatus("IN_REVIEW"));
            kpi.put("done", mapper.countRevisionByStatus("DONE"));
            kpi.put("needAction", mapper.countRevisionByStatus("NEED_ACTION"));
        } else {
            List<LegalRevisionLog> all = mapper.findRevisionLogs(null, null, null).stream()
                    .filter(r -> isLawAllowed(r.getLawName(), keywords))
                    .collect(Collectors.toList());
            kpi.put("pending",    all.stream().filter(r -> "PENDING".equals(r.getReviewStatus())).count());
            kpi.put("inReview",   all.stream().filter(r -> "IN_REVIEW".equals(r.getReviewStatus())).count());
            kpi.put("done",       all.stream().filter(r -> "DONE".equals(r.getReviewStatus())).count());
            kpi.put("needAction", all.stream().filter(r -> "NEED_ACTION".equals(r.getReviewStatus())).count());
        }
        return kpi;
    }
}

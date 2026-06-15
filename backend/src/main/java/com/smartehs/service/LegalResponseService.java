package com.smartehs.service;

import com.smartehs.dto.response.LegalSearchResult;
import com.smartehs.mapper.LegalResponseMapper;
import com.smartehs.model.LegalRegistry;
import com.smartehs.model.LegalRevisionLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LegalResponseService {

    private final LegalResponseMapper mapper;
    private final LawApiClient lawApi;

    // ===== 외부 API (검색) =====
    public LegalSearchResult searchExternal(String query, int page, int display) {
        return lawApi.searchLaws(query, page, display);
    }

    /** 최근 개정 가져와 DB 캐시 — 중복(law_id+revision_dt) 회피, 신규만 insert */
    @Transactional
    public Map<String, Object> syncRecentRevisions(int display) {
        LegalSearchResult r = lawApi.fetchRecentRevisions(display);
        int inserted = 0;
        for (LegalSearchResult.Item it : r.getItems()) {
            if (it.getLawId() == null || it.getLawId().isEmpty()) continue;
            String revDt = (it.getPromulgationDt() != null) ? it.getPromulgationDt() : it.getEnforceDt();
            Integer exists = mapper.findRevisionByLawIdAndDate(it.getLawId(), revDt);
            if (exists != null) continue;

            LegalRevisionLog log = LegalRevisionLog.builder()
                    .lawId(it.getLawId())
                    .lawName(it.getLawName())
                    .revisionType(it.getRevisionType())
                    .revisionDt(revDt)
                    .enforceDt(it.getEnforceDt())
                    .detailLink(it.getDetailLink())
                    .reviewStatus("PENDING")
                    .impactLevel("MID")
                    .build();
            mapper.insertRevisionLog(log);
            inserted++;
        }
        Map<String, Object> result = new HashMap<>();
        result.put("fetched", r.getItems().size());
        result.put("inserted", inserted);
        result.put("totalAvailable", r.getTotalCount());
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
    public List<LegalRevisionLog> listRevisions(String status, String keyword) {
        return mapper.findRevisionLogs(status, keyword);
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

    // ===== KPI =====
    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalLaws", mapper.countRegistry());
        kpi.put("pending", mapper.countRevisionByStatus("PENDING"));
        kpi.put("inReview", mapper.countRevisionByStatus("IN_REVIEW"));
        kpi.put("done", mapper.countRevisionByStatus("DONE"));
        kpi.put("needAction", mapper.countRevisionByStatus("NEED_ACTION"));
        return kpi;
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.LegalLawRequest;
import com.smartehs.dto.response.LegalLawResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.LegalLawMapper;
import com.smartehs.model.LegalLaw;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LegalLawService {

    private final LegalLawMapper mapper;

    @Transactional(readOnly = true)
    public List<LegalLawResponse> findAll() {
        return mapper.findAll().stream().map(LegalLawResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LegalLawResponse findById(Long id) {
        LegalLaw e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalLaw", "id", id);
        return LegalLawResponse.from(e);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int total = mapper.countAll();
        int pending = mapper.countByReviewStatus("검토대기");
        int reviewing = mapper.countByReviewStatus("검토중");
        int doneApply = mapper.countByReviewStatus("완료-적용");
        int doneNa = mapper.countByReviewStatus("완료-불해당");
        s.put("totalCount", total);
        s.put("pendingCount", pending + reviewing);
        s.put("doneCount", doneApply + doneNa);
        s.put("doneApplyCount", doneApply);
        s.put("doneNotApplicableCount", doneNa);
        s.put("urgentCount", mapper.countUrgent());
        return s;
    }

    @Transactional
    public LegalLawResponse create(LegalLawRequest req) {
        LegalLaw e = LegalLaw.builder()
                .category(req.getCategory())
                .lawName(req.getLawName())
                .clause(req.getClause())
                .amendType(req.getAmendType())
                .promulgateDate(req.getPromulgateDate())
                .enforceDate(req.getEnforceDate())
                .reviewer(req.getReviewer())
                .reviewDueDate(req.getReviewDueDate())
                .reviewStatus(req.getReviewStatus() != null ? req.getReviewStatus() : "검토대기")
                .applyYn(req.getApplyYn())
                .followUpAction(req.getFollowUpAction())
                .amendSummary(req.getAmendSummary())
                .urgent(req.getUrgent() != null ? req.getUrgent() : false)
                .build();
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public LegalLawResponse update(Long id, LegalLawRequest req) {
        LegalLaw e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalLaw", "id", id);
        e.setCategory(req.getCategory());
        e.setLawName(req.getLawName());
        e.setClause(req.getClause());
        e.setAmendType(req.getAmendType());
        e.setPromulgateDate(req.getPromulgateDate());
        e.setEnforceDate(req.getEnforceDate());
        e.setReviewer(req.getReviewer());
        e.setReviewDueDate(req.getReviewDueDate());
        e.setReviewStatus(req.getReviewStatus());
        e.setApplyYn(req.getApplyYn());
        e.setFollowUpAction(req.getFollowUpAction());
        e.setAmendSummary(req.getAmendSummary());
        e.setUrgent(req.getUrgent());
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("LegalLaw", "id", id);
        mapper.softDelete(id);
    }
}

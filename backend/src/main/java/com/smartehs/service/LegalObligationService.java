package com.smartehs.service;

import com.smartehs.dto.request.LegalObligationRequest;
import com.smartehs.dto.response.LegalObligationResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.LegalObligationMapper;
import com.smartehs.model.LegalObligation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LegalObligationService {

    private final LegalObligationMapper mapper;

    @Transactional(readOnly = true)
    public List<LegalObligationResponse> findAll() {
        return mapper.findAll().stream().map(LegalObligationResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LegalObligationResponse findById(Long id) {
        LegalObligation e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalObligation", "id", id);
        return LegalObligationResponse.from(e);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int total = mapper.countAll();
        int done = mapper.countByStatus("done");
        int doing = mapper.countByStatus("doing");
        int delay = mapper.countByStatus("delay");
        int fail = mapper.countByStatus("fail");
        int progressSum = mapper.sumProgress();
        int avgProgress = total > 0 ? Math.round((float) progressSum / total) : 0;
        s.put("totalCount", total);
        s.put("doneCount", done);
        s.put("doingCount", doing);
        s.put("delayCount", delay);
        s.put("failCount", fail);
        s.put("averageProgress", avgProgress);
        return s;
    }

    @Transactional
    public LegalObligationResponse create(LegalObligationRequest req) {
        LegalObligation e = LegalObligation.builder()
                .obligationType(req.getObligationType())
                .category(req.getCategory())
                .obligationName(req.getObligationName())
                .baseLaw(req.getBaseLaw())
                .cycle(req.getCycle())
                .dept(req.getDept())
                .ownerName(req.getOwnerName())
                .dueDate(req.getDueDate())
                .nextDueDate(req.getNextDueDate())
                .status(req.getStatus() != null ? req.getStatus() : "doing")
                .progress(req.getProgress() != null ? req.getProgress() : 0)
                .evidence(req.getEvidence())
                .penalty(req.getPenalty())
                .icon(req.getIcon())
                .build();
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public LegalObligationResponse update(Long id, LegalObligationRequest req) {
        LegalObligation e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalObligation", "id", id);
        e.setObligationType(req.getObligationType());
        e.setCategory(req.getCategory());
        e.setObligationName(req.getObligationName());
        e.setBaseLaw(req.getBaseLaw());
        e.setCycle(req.getCycle());
        e.setDept(req.getDept());
        e.setOwnerName(req.getOwnerName());
        e.setDueDate(req.getDueDate());
        e.setNextDueDate(req.getNextDueDate());
        e.setStatus(req.getStatus());
        e.setProgress(req.getProgress());
        e.setEvidence(req.getEvidence());
        e.setPenalty(req.getPenalty());
        e.setIcon(req.getIcon());
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("LegalObligation", "id", id);
        mapper.softDelete(id);
    }
}

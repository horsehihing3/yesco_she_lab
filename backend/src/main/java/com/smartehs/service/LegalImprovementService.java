package com.smartehs.service;

import com.smartehs.dto.request.LegalImprovementRequest;
import com.smartehs.dto.response.LegalImprovementResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.LegalImprovementMapper;
import com.smartehs.model.LegalImprovement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LegalImprovementService {

    private final LegalImprovementMapper mapper;

    @Transactional(readOnly = true)
    public List<LegalImprovementResponse> findAll() {
        return mapper.findAll().stream().map(LegalImprovementResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LegalImprovementResponse findById(Long id) {
        LegalImprovement e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalImprovement", "id", id);
        return LegalImprovementResponse.from(e);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int total = mapper.countAll();
        int registerCount = mapper.countByColStatus("register");
        int progressCount = mapper.countByColStatus("progress");
        int reviewCount = mapper.countByColStatus("review");
        int doneCount = mapper.countByColStatus("done");
        s.put("totalCount", total);
        s.put("registerCount", registerCount);
        s.put("progressCount", progressCount);
        s.put("reviewCount", reviewCount);
        s.put("doneCount", doneCount);
        s.put("closeRate", total > 0 ? Math.round((float) doneCount / total * 1000f) / 10f : 0);
        return s;
    }

    @Transactional
    public LegalImprovementResponse create(LegalImprovementRequest req) {
        LegalImprovement e = LegalImprovement.builder()
                .improvementType(req.getImprovementType())
                .priority(req.getPriority())
                .title(req.getTitle())
                .baseLaw(req.getBaseLaw())
                .description(req.getDescription())
                .dept(req.getDept())
                .ownerName(req.getOwnerName())
                .targetDate(req.getTargetDate())
                .source(req.getSource())
                .colStatus(req.getColStatus() != null ? req.getColStatus() : "register")
                .registeredDate(req.getRegisteredDate() != null ? req.getRegisteredDate() : LocalDate.now())
                .build();
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public LegalImprovementResponse update(Long id, LegalImprovementRequest req) {
        LegalImprovement e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("LegalImprovement", "id", id);
        e.setImprovementType(req.getImprovementType());
        e.setPriority(req.getPriority());
        e.setTitle(req.getTitle());
        e.setBaseLaw(req.getBaseLaw());
        e.setDescription(req.getDescription());
        e.setDept(req.getDept());
        e.setOwnerName(req.getOwnerName());
        e.setTargetDate(req.getTargetDate());
        e.setSource(req.getSource());
        e.setColStatus(req.getColStatus());
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("LegalImprovement", "id", id);
        mapper.softDelete(id);
    }
}

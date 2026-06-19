package com.smartehs.service;

import com.smartehs.dto.request.PpePerformanceRequest;
import com.smartehs.dto.response.PpePerformanceResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpePerformanceMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpePerformance;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PpePerformanceService {

    private final PpePerformanceMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        return paged(mapper.findAll(page * size, size), mapper.countAll(), page, size);
    }

    public Map<String, Object> findByResult(String result, int page, int size) {
        return paged(mapper.findByResult(result, page * size, size),
                mapper.countByResult(result), page, size);
    }

    public Map<String, Object> search(String keyword, int page, int size) {
        return paged(mapper.search(keyword, page * size, size),
                mapper.countBySearch(keyword), page, size);
    }

    public PpePerformanceResponse findById(Long id) {
        PpePerformance e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpePerformance", "id", id);
        return PpePerformanceResponse.from(e);
    }

    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalCount", mapper.countAll());
        kpi.put("okCount", mapper.countOk());
        kpi.put("failCount", mapper.countFail());
        kpi.put("pendingCount", mapper.countPending());
        return kpi;
    }

    @Transactional
    public PpePerformanceResponse create(PpePerformanceRequest req) {
        PpePerformance e = toModel(req, new PpePerformance());
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        e.setCreatedBy(who);
        e.setModifiedBy(who);
        mapper.insert(e);
        log.info("PpePerformance created: id={}, item={}, result={}",
                e.getId(), e.getItemName(), e.getResult());
        return PpePerformanceResponse.from(mapper.findById(e.getId()));
    }

    @Transactional
    public PpePerformanceResponse update(Long id, PpePerformanceRequest req) {
        PpePerformance e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpePerformance", "id", id);
        toModel(req, e);
        e.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(e);
        return PpePerformanceResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpePerformance", "id", id);
        mapper.softDelete(id);
    }

    private PpePerformance toModel(PpePerformanceRequest r, PpePerformance m) {
        m.setEvaluationDate(r.getEvaluationDate());
        m.setItemId(r.getItemId());
        m.setItemName(r.getItemName());
        m.setPerformanceStandard(r.getPerformanceStandard());
        m.setStandardValue(r.getStandardValue());
        m.setMeasuredValue(r.getMeasuredValue());
        m.setResult(r.getResult());
        m.setEvaluator(r.getEvaluator());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }

    private Map<String, Object> paged(List<PpePerformance> items, int total, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpePerformanceResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.PpeWearRequest;
import com.smartehs.dto.response.PpeWearResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeWearMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeWear;
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
public class PpeWearService {

    private final PpeWearMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        return paged(mapper.findAll(page * size, size), mapper.countAll(), page, size);
    }

    public Map<String, Object> findByDepartment(String dept, int page, int size) {
        return paged(mapper.findByDepartment(dept, page * size, size),
                mapper.countByDepartment(dept), page, size);
    }

    public Map<String, Object> findByStatus(String status, int page, int size) {
        return paged(mapper.findByStatus(status, page * size, size),
                mapper.countByStatus(status), page, size);
    }

    public Map<String, Object> search(String keyword, int page, int size) {
        return paged(mapper.search(keyword, page * size, size),
                mapper.countBySearch(keyword), page, size);
    }

    public PpeWearResponse findById(Long id) {
        PpeWear e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeWear", "id", id);
        return PpeWearResponse.from(e);
    }

    public Map<String, Object> getKpi() {
        int total = mapper.countAll();
        int ok = mapper.countOk();
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalCheck", total);
        kpi.put("okCount", ok);
        kpi.put("violationCount", mapper.countViolation());
        kpi.put("educationNeededCount", mapper.countNonCompliant());
        kpi.put("complianceRate", total == 0 ? 0 : (int) Math.round((double) ok / total * 100));
        return kpi;
    }

    public List<Map<String, Object>> rateByDepartment() {
        return mapper.rateByDepartment();
    }

    @Transactional
    public PpeWearResponse create(PpeWearRequest req) {
        PpeWear e = toModel(req, new PpeWear());
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        e.setCreatedBy(who);
        e.setModifiedBy(who);
        mapper.insert(e);
        log.info("PpeWear created: id={}, worker={}, status={}",
                e.getId(), e.getWorkerName(), e.getWearStatus());
        return PpeWearResponse.from(mapper.findById(e.getId()));
    }

    @Transactional
    public PpeWearResponse update(Long id, PpeWearRequest req) {
        PpeWear e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeWear", "id", id);
        toModel(req, e);
        e.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(e);
        return PpeWearResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpeWear", "id", id);
        mapper.softDelete(id);
    }

    private PpeWear toModel(PpeWearRequest r, PpeWear m) {
        m.setCheckDatetime(r.getCheckDatetime());
        m.setWorkerName(r.getWorkerName());
        m.setDepartment(r.getDepartment());
        m.setWorkZone(r.getWorkZone());
        m.setRequiredPpe(r.getRequiredPpe());
        m.setWearStatus(r.getWearStatus());
        m.setChecker(r.getChecker());
        m.setActionTaken(r.getActionTaken());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }

    private Map<String, Object> paged(List<PpeWear> items, int total, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpeWearResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }
}

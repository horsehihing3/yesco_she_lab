package com.smartehs.service;

import com.smartehs.dto.request.PpeInspectionRequest;
import com.smartehs.dto.response.PpeInspectionResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeInspectionMapper;
import com.smartehs.model.PersonRef;
import com.smartehs.model.PpeInspection;
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
public class PpeInspectionService {

    private final PpeInspectionMapper mapper;

    public Map<String, Object> findAll(int page, int size) {
        return paged(mapper.findAll(page * size, size), mapper.countAll(), page, size);
    }

    public Map<String, Object> findByType(String type, int page, int size) {
        return paged(mapper.findByType(type, page * size, size), mapper.countByType(type), page, size);
    }

    public Map<String, Object> findByResult(String result, int page, int size) {
        return paged(mapper.findByResult(result, page * size, size), mapper.countByResult(result), page, size);
    }

    public Map<String, Object> search(String keyword, int page, int size) {
        return paged(mapper.search(keyword, page * size, size),
                mapper.countBySearch(keyword), page, size);
    }

    public PpeInspectionResponse findById(Long id) {
        PpeInspection e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeInspection", "id", id);
        return PpeInspectionResponse.from(e);
    }

    public List<PpeInspectionResponse> findUpcoming(int days) {
        return mapper.findUpcoming(days).stream().map(PpeInspectionResponse::from).collect(Collectors.toList());
    }

    public List<PpeInspectionResponse> findFails() {
        return mapper.findFails().stream().map(PpeInspectionResponse::from).collect(Collectors.toList());
    }

    public Map<String, Object> getKpi() {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("totalCount", mapper.countAll());
        kpi.put("passCount", mapper.countPass());
        kpi.put("failOrDisposeCount", mapper.countFailOrDispose());
        kpi.put("upcomingCount", mapper.countUpcoming(30));
        return kpi;
    }

    @Transactional
    public PpeInspectionResponse create(PpeInspectionRequest req) {
        PpeInspection e = toModel(req, new PpeInspection());
        PersonRef who = personRefOf(req.getCreatedByUserId(), req.getCreatedByName(),
                req.getCreatedByTeam(), req.getCreatedByPosition());
        e.setCreatedBy(who);
        e.setModifiedBy(who);
        mapper.insert(e);
        log.info("PpeInspection created: id={}, item={}, result={}",
                e.getId(), e.getItemName(), e.getResult());
        return PpeInspectionResponse.from(mapper.findById(e.getId()));
    }

    @Transactional
    public PpeInspectionResponse update(Long id, PpeInspectionRequest req) {
        PpeInspection e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("PpeInspection", "id", id);
        toModel(req, e);
        e.setModifiedBy(personRefOf(req.getModifiedByUserId(), req.getModifiedByName(),
                req.getModifiedByTeam(), req.getModifiedByPosition()));
        mapper.update(e);
        return PpeInspectionResponse.from(mapper.findById(id));
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("PpeInspection", "id", id);
        mapper.softDelete(id);
    }

    private PpeInspection toModel(PpeInspectionRequest r, PpeInspection m) {
        m.setInspectionDate(r.getInspectionDate());
        m.setItemId(r.getItemId());
        m.setItemName(r.getItemName());
        m.setItemCode(r.getItemCode());
        m.setInspectionType(r.getInspectionType());
        m.setInspector(r.getInspector());
        m.setResult(r.getResult());
        m.setNextDate(r.getNextDate());
        m.setNote(r.getNote());
        return m;
    }

    private PersonRef personRefOf(Long userId, String name, String team, String position) {
        PersonRef p = new PersonRef();
        p.setUserId(userId); p.setName(name); p.setTeam(team); p.setPosition(position);
        return p;
    }

    private Map<String, Object> paged(List<PpeInspection> items, int total, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        result.put("content", items.stream().map(PpeInspectionResponse::from).collect(Collectors.toList()));
        result.put("totalElements", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", size == 0 ? 0 : (int) Math.ceil((double) total / size));
        return result;
    }
}

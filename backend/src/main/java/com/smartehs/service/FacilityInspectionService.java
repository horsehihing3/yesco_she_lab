package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.FacilityInspectionMapper;
import com.smartehs.model.FacilityInspection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FacilityInspectionService {
    private final FacilityInspectionMapper mapper;

    @Transactional(readOnly = true)
    public List<FacilityInspection> findAll() { return mapper.findAll(); }

    @Transactional(readOnly = true)
    public FacilityInspection findById(Long id) {
        FacilityInspection e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("FacilityInspection", "id", id);
        return e;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int total = mapper.countAll();
        int pass = mapper.countByResult("합격");
        int cond = mapper.countByResult("조건부합격");
        int fail = mapper.countByResult("불합격");
        s.put("totalCount", total);
        s.put("passCount", pass);
        s.put("conditionalCount", cond);
        s.put("failCount", fail);
        s.put("passRate", total > 0 ? Math.round((float) (pass + cond) / total * 1000f) / 10f : 0);
        return s;
    }

    @Transactional
    public FacilityInspection create(FacilityInspection e) {
        e.setDeleted(false);
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public FacilityInspection update(Long id, FacilityInspection e) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityInspection", "id", id);
        e.setId(id);
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityInspection", "id", id);
        mapper.softDelete(id);
    }
}

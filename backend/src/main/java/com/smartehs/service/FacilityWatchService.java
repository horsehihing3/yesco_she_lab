package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.FacilityWatchMapper;
import com.smartehs.model.FacilityWatch;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FacilityWatchService {
    private final FacilityWatchMapper mapper;

    @Transactional(readOnly = true)
    public List<FacilityWatch> findAll() { return mapper.findAll(); }

    @Transactional(readOnly = true)
    public FacilityWatch findById(Long id) {
        FacilityWatch e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("FacilityWatch", "id", id);
        return e;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int total = mapper.countAll();
        int a = mapper.countByRiskGrade("A");
        int b = mapper.countByRiskGrade("B");
        int c = mapper.countByRiskGrade("C");
        s.put("totalCount", total);
        s.put("riskACount", a);
        s.put("riskBCount", b);
        s.put("riskCCount", c);
        return s;
    }

    @Transactional
    public FacilityWatch create(FacilityWatch e) {
        e.setDeleted(false);
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public FacilityWatch update(Long id, FacilityWatch e) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityWatch", "id", id);
        e.setId(id);
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityWatch", "id", id);
        mapper.softDelete(id);
    }
}

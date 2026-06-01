package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.FacilityEquipmentMapper;
import com.smartehs.model.FacilityEquipment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FacilityEquipmentService {
    private final FacilityEquipmentMapper mapper;

    @Transactional(readOnly = true)
    public List<FacilityEquipment> findAll() { return mapper.findAll(); }

    @Transactional(readOnly = true)
    public FacilityEquipment findById(Long id) {
        FacilityEquipment e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("FacilityEquipment", "id", id);
        return e;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();
        int total = mapper.countAll();
        int expired = mapper.countByStatus("만료");
        int near = mapper.countByExpireWithinDays(30);
        int ok = mapper.countByStatus("정상");
        int suspended = mapper.countByStatus("휴지") + mapper.countByStatus("폐기");
        s.put("totalCount", total);
        s.put("okCount", ok);
        s.put("expiredCount", expired);
        s.put("nearCount", near);
        s.put("suspendedCount", suspended);
        s.put("complianceRate", total > 0 ? Math.round((float) ok / total * 1000f) / 10f : 0);
        return s;
    }

    @Transactional
    public FacilityEquipment create(FacilityEquipment e) {
        e.setDeleted(false);
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public FacilityEquipment update(Long id, FacilityEquipment e) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityEquipment", "id", id);
        e.setId(id);
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityEquipment", "id", id);
        mapper.softDelete(id);
    }
}

package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.KpiRecordMapper;
import com.smartehs.model.KpiRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @RequiredArgsConstructor
public class KpiRecordService {
    private final KpiRecordMapper mapper;

    @Transactional(readOnly = true)
    public List<KpiRecord> findByYear(int year) { return mapper.findByYearAndDeletedFalse(year); }

    @Transactional(readOnly = true)
    public List<KpiRecord> findByTypeAndYear(String kpiType, int year) { return mapper.findByTypeAndYearAndDeletedFalse(kpiType, year); }

    @Transactional
    public KpiRecord create(KpiRecord record) { record.setDeleted(false); mapper.insert(record); return mapper.findByIdAndDeletedFalse(record.getId()); }

    @Transactional
    public KpiRecord update(Long id, KpiRecord req) {
        KpiRecord r = mapper.findByIdAndDeletedFalse(id);
        if (r == null) throw new ResourceNotFoundException("KpiRecord", "id", id);
        r.setTargetValue(req.getTargetValue()); r.setActualValue(req.getActualValue());
        r.setUnit(req.getUnit()); r.setDepartment(req.getDepartment()); r.setNotes(req.getNotes());
        mapper.update(r); return mapper.findByIdAndDeletedFalse(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findByIdAndDeletedFalse(id) == null) throw new ResourceNotFoundException("KpiRecord", "id", id);
        mapper.softDelete(id);
    }
}

package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.FacilityWatchCheckMapper;
import com.smartehs.model.FacilityWatchCheck;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityWatchCheckService {
    private final FacilityWatchCheckMapper mapper;

    @Transactional(readOnly = true)
    public List<FacilityWatchCheck> findAll() { return mapper.findAll(); }

    @Transactional(readOnly = true)
    public FacilityWatchCheck findById(Long id) {
        FacilityWatchCheck e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("FacilityWatchCheck", "id", id);
        return e;
    }

    @Transactional
    public FacilityWatchCheck create(FacilityWatchCheck e) {
        e.setDeleted(false);
        mapper.insert(e);
        return findById(e.getId());
    }

    @Transactional
    public FacilityWatchCheck update(Long id, FacilityWatchCheck e) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityWatchCheck", "id", id);
        e.setId(id);
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findById(id) == null) throw new ResourceNotFoundException("FacilityWatchCheck", "id", id);
        mapper.softDelete(id);
    }
}

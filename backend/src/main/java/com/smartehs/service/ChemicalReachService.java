package com.smartehs.service;

import com.smartehs.dto.request.ChemicalReachRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalReachMapper;
import com.smartehs.model.ChemicalReach;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChemicalReachService {

    private final ChemicalReachMapper chemicalReachMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalReach> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalReach> content = chemicalReachMapper.findAll(offset, limit);
        int total = chemicalReachMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalReach> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalReach> content = chemicalReachMapper.search(keyword, offset, limit);
        int total = chemicalReachMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalReach findById(Long id) {
        ChemicalReach chemicalReach = chemicalReachMapper.findById(id);
        if (chemicalReach == null) {
            throw new ResourceNotFoundException("ChemicalReach", "id", id);
        }
        return chemicalReach;
    }

    @Transactional
    public ChemicalReach create(ChemicalReachRequest request) {
        ChemicalReach chemicalReach = ChemicalReach.builder()
                .chemicalName(request.getChemicalName())
                .casNumber(request.getCasNumber())
                .registrationNo(request.getRegistrationNo())
                .svhc(request.getSvhc())
                .authorizationRequired(request.getAuthorizationRequired())
                .restrictionNote(request.getRestrictionNote())
                .registrationDate(request.getRegistrationDate())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        chemicalReachMapper.insert(chemicalReach);
        log.info("Created chemical REACH: {}", chemicalReach.getChemicalName());

        return findById(chemicalReach.getId());
    }

    @Transactional
    public ChemicalReach update(Long id, ChemicalReachRequest request) {
        ChemicalReach chemicalReach = chemicalReachMapper.findById(id);
        if (chemicalReach == null) {
            throw new ResourceNotFoundException("ChemicalReach", "id", id);
        }

        chemicalReach.setChemicalName(request.getChemicalName());
        chemicalReach.setCasNumber(request.getCasNumber());
        chemicalReach.setRegistrationNo(request.getRegistrationNo());
        chemicalReach.setSvhc(request.getSvhc());
        chemicalReach.setAuthorizationRequired(request.getAuthorizationRequired());
        chemicalReach.setRestrictionNote(request.getRestrictionNote());
        chemicalReach.setRegistrationDate(request.getRegistrationDate());
        chemicalReach.setStatus(request.getStatus());

        chemicalReachMapper.update(chemicalReach);
        log.info("Updated chemical REACH: {}", chemicalReach.getChemicalName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalReach chemicalReach = chemicalReachMapper.findById(id);
        if (chemicalReach == null) {
            throw new ResourceNotFoundException("ChemicalReach", "id", id);
        }
        chemicalReachMapper.softDelete(id);
        log.info("Soft deleted chemical REACH with id: {}", id);
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.ChemicalGhsRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalGhsMapper;
import com.smartehs.model.ChemicalGhs;
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
public class ChemicalGhsService {

    private final ChemicalGhsMapper chemicalGhsMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalGhs> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalGhs> content = chemicalGhsMapper.findAll(offset, limit);
        int total = chemicalGhsMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalGhs> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalGhs> content = chemicalGhsMapper.search(keyword, offset, limit);
        int total = chemicalGhsMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalGhs findById(Long id) {
        ChemicalGhs chemicalGhs = chemicalGhsMapper.findById(id);
        if (chemicalGhs == null) {
            throw new ResourceNotFoundException("ChemicalGhs", "id", id);
        }
        return chemicalGhs;
    }

    @Transactional
    public ChemicalGhs create(ChemicalGhsRequest request) {
        ChemicalGhs chemicalGhs = ChemicalGhs.builder()
                .chemicalName(request.getChemicalName())
                .casNumber(request.getCasNumber())
                .physicalHazard(request.getPhysicalHazard())
                .healthHazard(request.getHealthHazard())
                .environmentalHazard(request.getEnvironmentalHazard())
                .signalWord(request.getSignalWord())
                .ghsVersion(request.getGhsVersion())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        chemicalGhsMapper.insert(chemicalGhs);
        log.info("Created chemical GHS: {}", chemicalGhs.getChemicalName());

        return findById(chemicalGhs.getId());
    }

    @Transactional
    public ChemicalGhs update(Long id, ChemicalGhsRequest request) {
        ChemicalGhs chemicalGhs = chemicalGhsMapper.findById(id);
        if (chemicalGhs == null) {
            throw new ResourceNotFoundException("ChemicalGhs", "id", id);
        }

        chemicalGhs.setChemicalName(request.getChemicalName());
        chemicalGhs.setCasNumber(request.getCasNumber());
        chemicalGhs.setPhysicalHazard(request.getPhysicalHazard());
        chemicalGhs.setHealthHazard(request.getHealthHazard());
        chemicalGhs.setEnvironmentalHazard(request.getEnvironmentalHazard());
        chemicalGhs.setSignalWord(request.getSignalWord());
        chemicalGhs.setGhsVersion(request.getGhsVersion());
        chemicalGhs.setStatus(request.getStatus());

        chemicalGhsMapper.update(chemicalGhs);
        log.info("Updated chemical GHS: {}", chemicalGhs.getChemicalName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalGhs chemicalGhs = chemicalGhsMapper.findById(id);
        if (chemicalGhs == null) {
            throw new ResourceNotFoundException("ChemicalGhs", "id", id);
        }
        chemicalGhsMapper.softDelete(id);
        log.info("Soft deleted chemical GHS with id: {}", id);
    }
}

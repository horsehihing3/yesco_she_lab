package com.smartehs.service;

import com.smartehs.dto.request.ChemicalUsageRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalUsageMapper;
import com.smartehs.model.ChemicalUsage;
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
public class ChemicalUsageService {

    private final ChemicalUsageMapper chemicalUsageMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalUsage> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalUsage> content = chemicalUsageMapper.findAll(offset, limit);
        int total = chemicalUsageMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalUsage> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalUsage> content = chemicalUsageMapper.search(keyword, offset, limit);
        int total = chemicalUsageMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalUsage findById(Long id) {
        ChemicalUsage chemicalUsage = chemicalUsageMapper.findById(id);
        if (chemicalUsage == null) {
            throw new ResourceNotFoundException("ChemicalUsage", "id", id);
        }
        return chemicalUsage;
    }

    @Transactional
    public ChemicalUsage create(ChemicalUsageRequest request) {
        ChemicalUsage chemicalUsage = ChemicalUsage.builder()
                .usageDate(request.getUsageDate())
                .chemicalName(request.getChemicalName())
                .department(request.getDepartment())
                .purpose(request.getPurpose())
                .usageQuantity(request.getUsageQuantity())
                .unit(request.getUnit())
                .handler(request.getHandler())
                .remainingStock(request.getRemainingStock())
                .deleted(false)
                .build();

        chemicalUsageMapper.insert(chemicalUsage);
        log.info("Created chemical usage: {}", chemicalUsage.getChemicalName());

        return findById(chemicalUsage.getId());
    }

    @Transactional
    public ChemicalUsage update(Long id, ChemicalUsageRequest request) {
        ChemicalUsage chemicalUsage = chemicalUsageMapper.findById(id);
        if (chemicalUsage == null) {
            throw new ResourceNotFoundException("ChemicalUsage", "id", id);
        }

        chemicalUsage.setUsageDate(request.getUsageDate());
        chemicalUsage.setChemicalName(request.getChemicalName());
        chemicalUsage.setDepartment(request.getDepartment());
        chemicalUsage.setPurpose(request.getPurpose());
        chemicalUsage.setUsageQuantity(request.getUsageQuantity());
        chemicalUsage.setUnit(request.getUnit());
        chemicalUsage.setHandler(request.getHandler());
        chemicalUsage.setRemainingStock(request.getRemainingStock());

        chemicalUsageMapper.update(chemicalUsage);
        log.info("Updated chemical usage: {}", chemicalUsage.getChemicalName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalUsage chemicalUsage = chemicalUsageMapper.findById(id);
        if (chemicalUsage == null) {
            throw new ResourceNotFoundException("ChemicalUsage", "id", id);
        }
        chemicalUsageMapper.softDelete(id);
        log.info("Soft deleted chemical usage with id: {}", id);
    }
}

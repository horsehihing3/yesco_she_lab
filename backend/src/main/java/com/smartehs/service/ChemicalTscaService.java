package com.smartehs.service;

import com.smartehs.dto.request.ChemicalTscaRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalTscaMapper;
import com.smartehs.model.ChemicalTsca;
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
public class ChemicalTscaService {

    private final ChemicalTscaMapper chemicalTscaMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalTsca> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalTsca> content = chemicalTscaMapper.findAll(offset, limit);
        int total = chemicalTscaMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalTsca> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalTsca> content = chemicalTscaMapper.search(keyword, offset, limit);
        int total = chemicalTscaMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalTsca findById(Long id) {
        ChemicalTsca chemicalTsca = chemicalTscaMapper.findById(id);
        if (chemicalTsca == null) {
            throw new ResourceNotFoundException("ChemicalTsca", "id", id);
        }
        return chemicalTsca;
    }

    @Transactional
    public ChemicalTsca create(ChemicalTscaRequest request) {
        ChemicalTsca chemicalTsca = ChemicalTsca.builder()
                .chemicalName(request.getChemicalName())
                .casNumber(request.getCasNumber())
                .inventoryStatus(request.getInventoryStatus())
                .regulationSection(request.getRegulationSection())
                .reportingDuty(request.getReportingDuty())
                .exportToUs(request.getExportToUs())
                .pmnRequired(request.getPmnRequired())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        chemicalTscaMapper.insert(chemicalTsca);
        log.info("Created chemical TSCA: {}", chemicalTsca.getChemicalName());

        return findById(chemicalTsca.getId());
    }

    @Transactional
    public ChemicalTsca update(Long id, ChemicalTscaRequest request) {
        ChemicalTsca chemicalTsca = chemicalTscaMapper.findById(id);
        if (chemicalTsca == null) {
            throw new ResourceNotFoundException("ChemicalTsca", "id", id);
        }

        chemicalTsca.setChemicalName(request.getChemicalName());
        chemicalTsca.setCasNumber(request.getCasNumber());
        chemicalTsca.setInventoryStatus(request.getInventoryStatus());
        chemicalTsca.setRegulationSection(request.getRegulationSection());
        chemicalTsca.setReportingDuty(request.getReportingDuty());
        chemicalTsca.setExportToUs(request.getExportToUs());
        chemicalTsca.setPmnRequired(request.getPmnRequired());
        chemicalTsca.setStatus(request.getStatus());

        chemicalTscaMapper.update(chemicalTsca);
        log.info("Updated chemical TSCA: {}", chemicalTsca.getChemicalName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalTsca chemicalTsca = chemicalTscaMapper.findById(id);
        if (chemicalTsca == null) {
            throw new ResourceNotFoundException("ChemicalTsca", "id", id);
        }
        chemicalTscaMapper.softDelete(id);
        log.info("Soft deleted chemical TSCA with id: {}", id);
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.ChemicalHazardReportRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalHazardReportMapper;
import com.smartehs.model.ChemicalHazardReport;
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
public class ChemicalHazardReportService {

    private final ChemicalHazardReportMapper chemicalHazardReportMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalHazardReport> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalHazardReport> content = chemicalHazardReportMapper.findAll(offset, limit);
        int total = chemicalHazardReportMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalHazardReport> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalHazardReport> content = chemicalHazardReportMapper.search(keyword, offset, limit);
        int total = chemicalHazardReportMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalHazardReport findById(Long id) {
        ChemicalHazardReport chemicalHazardReport = chemicalHazardReportMapper.findById(id);
        if (chemicalHazardReport == null) {
            throw new ResourceNotFoundException("ChemicalHazardReport", "id", id);
        }
        return chemicalHazardReport;
    }

    @Transactional
    public ChemicalHazardReport create(ChemicalHazardReportRequest request) {
        ChemicalHazardReport chemicalHazardReport = ChemicalHazardReport.builder()
                .reportYear(request.getReportYear())
                .chemicalName(request.getChemicalName())
                .casNumber(request.getCasNumber())
                .hazardClass(request.getHazardClass())
                .annualHandling(request.getAnnualHandling())
                .handlingFacility(request.getHandlingFacility())
                .reportDeadline(request.getReportDeadline())
                .submitDate(request.getSubmitDate())
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .deleted(false)
                .build();

        chemicalHazardReportMapper.insert(chemicalHazardReport);
        log.info("Created chemical hazard report: {} - {}", chemicalHazardReport.getReportYear(), chemicalHazardReport.getChemicalName());

        return findById(chemicalHazardReport.getId());
    }

    @Transactional
    public ChemicalHazardReport update(Long id, ChemicalHazardReportRequest request) {
        ChemicalHazardReport chemicalHazardReport = chemicalHazardReportMapper.findById(id);
        if (chemicalHazardReport == null) {
            throw new ResourceNotFoundException("ChemicalHazardReport", "id", id);
        }

        chemicalHazardReport.setReportYear(request.getReportYear());
        chemicalHazardReport.setChemicalName(request.getChemicalName());
        chemicalHazardReport.setCasNumber(request.getCasNumber());
        chemicalHazardReport.setHazardClass(request.getHazardClass());
        chemicalHazardReport.setAnnualHandling(request.getAnnualHandling());
        chemicalHazardReport.setHandlingFacility(request.getHandlingFacility());
        chemicalHazardReport.setReportDeadline(request.getReportDeadline());
        chemicalHazardReport.setSubmitDate(request.getSubmitDate());
        chemicalHazardReport.setStatus(request.getStatus());

        chemicalHazardReportMapper.update(chemicalHazardReport);
        log.info("Updated chemical hazard report: {} - {}", chemicalHazardReport.getReportYear(), chemicalHazardReport.getChemicalName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalHazardReport chemicalHazardReport = chemicalHazardReportMapper.findById(id);
        if (chemicalHazardReport == null) {
            throw new ResourceNotFoundException("ChemicalHazardReport", "id", id);
        }
        chemicalHazardReportMapper.softDelete(id);
        log.info("Soft deleted chemical hazard report with id: {}", id);
    }
}

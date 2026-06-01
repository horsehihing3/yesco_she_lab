package com.smartehs.service;

import com.smartehs.dto.request.ChemicalUsageReportRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalUsageReportMapper;
import com.smartehs.model.ChemicalUsageReport;
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
public class ChemicalUsageReportService {

    private final ChemicalUsageReportMapper chemicalUsageReportMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalUsageReport> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalUsageReport> content = chemicalUsageReportMapper.findAll(offset, limit);
        int total = chemicalUsageReportMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalUsageReport> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalUsageReport> content = chemicalUsageReportMapper.search(keyword, offset, limit);
        int total = chemicalUsageReportMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalUsageReport findById(Long id) {
        ChemicalUsageReport chemicalUsageReport = chemicalUsageReportMapper.findById(id);
        if (chemicalUsageReport == null) {
            throw new ResourceNotFoundException("ChemicalUsageReport", "id", id);
        }
        return chemicalUsageReport;
    }

    @Transactional
    public ChemicalUsageReport create(ChemicalUsageReportRequest request) {
        ChemicalUsageReport chemicalUsageReport = ChemicalUsageReport.builder()
                .reportYear(request.getReportYear())
                .chemicalName(request.getChemicalName())
                .casNumber(request.getCasNumber())
                .annualUsage(request.getAnnualUsage())
                .unit(request.getUnit())
                .usagePurpose(request.getUsagePurpose())
                .reportDeadline(request.getReportDeadline())
                .submitDate(request.getSubmitDate())
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .deleted(false)
                .build();

        chemicalUsageReportMapper.insert(chemicalUsageReport);
        log.info("Created chemical usage report: {} - {}", chemicalUsageReport.getReportYear(), chemicalUsageReport.getChemicalName());

        return findById(chemicalUsageReport.getId());
    }

    @Transactional
    public ChemicalUsageReport update(Long id, ChemicalUsageReportRequest request) {
        ChemicalUsageReport chemicalUsageReport = chemicalUsageReportMapper.findById(id);
        if (chemicalUsageReport == null) {
            throw new ResourceNotFoundException("ChemicalUsageReport", "id", id);
        }

        chemicalUsageReport.setReportYear(request.getReportYear());
        chemicalUsageReport.setChemicalName(request.getChemicalName());
        chemicalUsageReport.setCasNumber(request.getCasNumber());
        chemicalUsageReport.setAnnualUsage(request.getAnnualUsage());
        chemicalUsageReport.setUnit(request.getUnit());
        chemicalUsageReport.setUsagePurpose(request.getUsagePurpose());
        chemicalUsageReport.setReportDeadline(request.getReportDeadline());
        chemicalUsageReport.setSubmitDate(request.getSubmitDate());
        chemicalUsageReport.setStatus(request.getStatus());

        chemicalUsageReportMapper.update(chemicalUsageReport);
        log.info("Updated chemical usage report: {} - {}", chemicalUsageReport.getReportYear(), chemicalUsageReport.getChemicalName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalUsageReport chemicalUsageReport = chemicalUsageReportMapper.findById(id);
        if (chemicalUsageReport == null) {
            throw new ResourceNotFoundException("ChemicalUsageReport", "id", id);
        }
        chemicalUsageReportMapper.softDelete(id);
        log.info("Soft deleted chemical usage report with id: {}", id);
    }
}

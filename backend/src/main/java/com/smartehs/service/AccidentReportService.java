package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AccidentReportMapper;
import com.smartehs.model.AccidentReport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccidentReportService {

    private final AccidentReportMapper mapper;

    public List<AccidentReport> findAll() {
        return mapper.findAll();
    }

    public AccidentReport findById(Long id) {
        AccidentReport r = mapper.findById(id);
        if (r == null) throw new ResourceNotFoundException("Accident report not found: " + id);
        return r;
    }

    @Transactional
    public AccidentReport create(AccidentReport report) {
        if (report.getIsNearMiss() == null) report.setIsNearMiss(false);
        if (report.getIsFatal() == null) report.setIsFatal(false);
        if (report.getLeaveOverMonth() == null) report.setLeaveOverMonth(false);
        if (report.getLeaveUnderMonth() == null) report.setLeaveUnderMonth(false);
        if (report.getFreqNone() == null) report.setFreqNone(false);
        if (report.getSortOrder() == null) report.setSortOrder(0);
        mapper.insert(report);
        return report;
    }

    @Transactional
    public AccidentReport update(Long id, AccidentReport report) {
        AccidentReport existing = mapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("Accident report not found: " + id);
        report.setId(id);
        if (report.getIsNearMiss() == null) report.setIsNearMiss(false);
        if (report.getIsFatal() == null) report.setIsFatal(false);
        if (report.getLeaveOverMonth() == null) report.setLeaveOverMonth(false);
        if (report.getLeaveUnderMonth() == null) report.setLeaveUnderMonth(false);
        if (report.getFreqNone() == null) report.setFreqNone(false);
        if (report.getSortOrder() == null) report.setSortOrder(existing.getSortOrder());
        mapper.update(report);
        return report;
    }

    @Transactional
    public void delete(Long id) {
        mapper.delete(id);
    }
}

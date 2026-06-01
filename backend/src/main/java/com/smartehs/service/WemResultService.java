package com.smartehs.service;

import com.smartehs.dto.request.WemResultRequest;
import com.smartehs.dto.response.WemResultResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WemResultMapper;
import com.smartehs.model.WemResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WemResultService {

    private final WemResultMapper wemResultMapper;

    @Transactional(readOnly = true)
    public Page<WemResultResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemResultResponse> content = wemResultMapper.findAllWithPaging(offset, limit).stream()
                .map(WemResultResponse::from)
                .collect(Collectors.toList());
        int total = wemResultMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WemResultResponse> findByJudgment(String judgment, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemResultResponse> content = wemResultMapper.findByJudgment(judgment, offset, limit).stream()
                .map(WemResultResponse::from)
                .collect(Collectors.toList());
        int total = wemResultMapper.countByJudgment(judgment);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WemResultResponse findById(Long id) {
        WemResult result = wemResultMapper.findById(id);
        if (result == null) {
            throw new ResourceNotFoundException("WemResult", "id", id);
        }
        return WemResultResponse.from(result);
    }

    @Transactional
    public WemResultResponse create(WemResultRequest request) {
        WemResult result = WemResult.builder()
                .processName(request.getProcessName())
                .factorName(request.getFactorName())
                .sampleType(request.getSampleType())
                .measuredValue(request.getMeasuredValue())
                .twaValue(request.getTwaValue())
                .stelValue(request.getStelValue())
                .exposureStandard(request.getExposureStandard())
                .exceedRate(request.getExceedRate())
                .judgment(request.getJudgment())
                .hasReport(request.getHasReport() != null ? request.getHasReport() : false)
                .measurementDate(request.getMeasurementDate())
                .measurementAgency(request.getMeasurementAgency())
                .remarks(request.getRemarks())
                .build();

        wemResultMapper.insert(result);
        log.info("Created WEM result: {}", result.getId());
        return WemResultResponse.from(result);
    }

    @Transactional
    public WemResultResponse update(Long id, WemResultRequest request) {
        WemResult result = wemResultMapper.findById(id);
        if (result == null) {
            throw new ResourceNotFoundException("WemResult", "id", id);
        }

        result.setProcessName(request.getProcessName());
        result.setFactorName(request.getFactorName());
        result.setSampleType(request.getSampleType());
        result.setMeasuredValue(request.getMeasuredValue());
        result.setTwaValue(request.getTwaValue());
        result.setStelValue(request.getStelValue());
        result.setExposureStandard(request.getExposureStandard());
        result.setExceedRate(request.getExceedRate());
        result.setJudgment(request.getJudgment());
        result.setHasReport(request.getHasReport());
        result.setMeasurementDate(request.getMeasurementDate());
        result.setMeasurementAgency(request.getMeasurementAgency());
        result.setRemarks(request.getRemarks());

        wemResultMapper.update(result);
        log.info("Updated WEM result: {}", id);
        return WemResultResponse.from(result);
    }

    @Transactional
    public void delete(Long id) {
        WemResult result = wemResultMapper.findById(id);
        if (result == null) {
            throw new ResourceNotFoundException("WemResult", "id", id);
        }
        wemResultMapper.delete(id);
        log.info("Deleted WEM result with id: {}", id);
    }
}

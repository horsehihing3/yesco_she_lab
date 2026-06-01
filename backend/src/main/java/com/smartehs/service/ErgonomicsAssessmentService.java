package com.smartehs.service;

import com.smartehs.dto.request.ErgonomicsAssessmentRequest;
import com.smartehs.dto.response.ErgonomicsAssessmentResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ErgonomicsAssessmentMapper;
import com.smartehs.model.ErgonomicsAssessment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ErgonomicsAssessmentService {

    private final ErgonomicsAssessmentMapper mapper;

    @Transactional(readOnly = true)
    public Page<ErgonomicsAssessmentResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset(); int limit = pageable.getPageSize();
        List<ErgonomicsAssessmentResponse> content = mapper.findByDeletedFalse(offset, limit).stream()
                .map(ErgonomicsAssessmentResponse::from).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countByDeletedFalse());
    }

    @Transactional(readOnly = true)
    public ErgonomicsAssessmentResponse findById(Long id) {
        ErgonomicsAssessment e = mapper.findByIdAndDeletedFalse(id);
        if (e == null) throw new ResourceNotFoundException("ErgonomicsAssessment", "id", id);
        return ErgonomicsAssessmentResponse.from(e);
    }

    @Transactional(readOnly = true)
    public Page<ErgonomicsAssessmentResponse> findByRiskLevel(String riskLevel, Pageable pageable) {
        int offset = (int) pageable.getOffset(); int limit = pageable.getPageSize();
        List<ErgonomicsAssessmentResponse> content = mapper.findByRiskLevelAndDeletedFalse(riskLevel, offset, limit).stream()
                .map(ErgonomicsAssessmentResponse::from).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countByRiskLevelAndDeletedFalse(riskLevel));
    }

    @Transactional(readOnly = true)
    public Page<ErgonomicsAssessmentResponse> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset(); int limit = pageable.getPageSize();
        List<ErgonomicsAssessmentResponse> content = mapper.searchAndDeletedFalse(keyword, offset, limit).stream()
                .map(ErgonomicsAssessmentResponse::from).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countBySearchAndDeletedFalse(keyword));
    }

    @Transactional
    public ErgonomicsAssessmentResponse create(ErgonomicsAssessmentRequest req) {
        String newId = "ERGO-" + LocalDate.now().getYear() + "-" + String.format("%03d", mapper.countByAssessmentIdStartingWith("ERGO-" + LocalDate.now().getYear() + "-") + 1);
        ErgonomicsAssessment e = ErgonomicsAssessment.builder()
                .assessmentId(newId).assessType(req.getAssessType()).department(req.getDepartment())
                .workProcess(req.getWorkProcess()).workDescription(req.getWorkDescription())
                .workerName(req.getWorkerName()).workerId(req.getWorkerId()).assessDate(req.getAssessDate())
                .assessorName(req.getAssessorName()).score(req.getScore()).riskLevel(req.getRiskLevel())
                .affectedBodyParts(req.getAffectedBodyParts()).symptoms(req.getSymptoms())
                .improvementAction(req.getImprovementAction()).improvementDeadline(req.getImprovementDeadline())
                .improvementStatus(req.getImprovementStatus() != null ? req.getImprovementStatus() : "PENDING")
                .photoFileId(req.getPhotoFileId()).notes(req.getNotes()).deleted(false).build();
        mapper.insert(e);
        log.info("Created ergonomics assessment: {}", newId);
        return findById(e.getId());
    }

    @Transactional
    public ErgonomicsAssessmentResponse update(Long id, ErgonomicsAssessmentRequest req) {
        ErgonomicsAssessment e = mapper.findByIdAndDeletedFalse(id);
        if (e == null) throw new ResourceNotFoundException("ErgonomicsAssessment", "id", id);
        e.setAssessType(req.getAssessType()); e.setDepartment(req.getDepartment());
        e.setWorkProcess(req.getWorkProcess()); e.setWorkDescription(req.getWorkDescription());
        e.setWorkerName(req.getWorkerName()); e.setWorkerId(req.getWorkerId());
        e.setAssessDate(req.getAssessDate()); e.setAssessorName(req.getAssessorName());
        e.setScore(req.getScore()); e.setRiskLevel(req.getRiskLevel());
        e.setAffectedBodyParts(req.getAffectedBodyParts()); e.setSymptoms(req.getSymptoms());
        e.setImprovementAction(req.getImprovementAction()); e.setImprovementDeadline(req.getImprovementDeadline());
        e.setImprovementStatus(req.getImprovementStatus()); e.setPhotoFileId(req.getPhotoFileId());
        e.setNotes(req.getNotes());
        mapper.update(e);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findByIdAndDeletedFalse(id) == null) throw new ResourceNotFoundException("ErgonomicsAssessment", "id", id);
        mapper.softDelete(id);
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.PrePlacementExamRequest;
import com.smartehs.dto.response.PrePlacementExamResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PrePlacementExamMapper;
import com.smartehs.model.PrePlacementExam;
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
public class PrePlacementExamService {

    private final PrePlacementExamMapper examMapper;

    @Transactional(readOnly = true)
    public Page<PrePlacementExamResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PrePlacementExamResponse> content = examMapper.findByDeletedFalse(offset, limit).stream()
                .map(PrePlacementExamResponse::from)
                .collect(Collectors.toList());
        int total = examMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PrePlacementExamResponse> findByEmployee(String employeeId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PrePlacementExamResponse> content = examMapper.findByEmployeeIdAndDeletedFalse(employeeId, offset, limit).stream()
                .map(PrePlacementExamResponse::from)
                .collect(Collectors.toList());
        int total = examMapper.countByEmployeeIdAndDeletedFalse(employeeId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PrePlacementExamResponse> findByYear(int year, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PrePlacementExamResponse> content = examMapper.findByYearAndDeletedFalse(year, offset, limit).stream()
                .map(PrePlacementExamResponse::from)
                .collect(Collectors.toList());
        int total = examMapper.countByYearAndDeletedFalse(year);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PrePlacementExamResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PrePlacementExamResponse> content = examMapper.findByStatusAndDeletedFalse(status, offset, limit).stream()
                .map(PrePlacementExamResponse::from)
                .collect(Collectors.toList());
        int total = examMapper.countByStatusAndDeletedFalse(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PrePlacementExamResponse> searchByName(String name, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PrePlacementExamResponse> content = examMapper.searchByEmployeeNameAndDeletedFalse(name, offset, limit).stream()
                .map(PrePlacementExamResponse::from)
                .collect(Collectors.toList());
        int total = examMapper.countByEmployeeNameAndDeletedFalse(name);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PrePlacementExamResponse findById(Long id) {
        PrePlacementExam exam = examMapper.findByIdAndDeletedFalse(id);
        if (exam == null) {
            throw new ResourceNotFoundException("PrePlacementExam", "id", id);
        }
        return PrePlacementExamResponse.from(exam);
    }

    @Transactional
    public PrePlacementExamResponse create(PrePlacementExamRequest request) {
        String newId = generateExamId();

        PrePlacementExam exam = PrePlacementExam.builder()
                .examId(newId)
                .employeeId(request.getEmployeeId())
                .employeeName(request.getEmployeeName())
                .employeeDept(request.getEmployeeDept())
                .employeeEmail(request.getEmployeeEmail())
                .workPlaceId(request.getWorkPlaceId())
                .examDate(request.getExamDate())
                .examYear(request.getExamYear())
                .targetJob(request.getTargetJob())
                .hazardousFactors(request.getHazardousFactors())
                .hospital(request.getHospital())
                .examResult(request.getExamResult() != null ? request.getExamResult() : "PENDING")
                .resultDetail(request.getResultDetail())
                .restrictionDetail(request.getRestrictionDetail())
                .followUpRequired(request.getFollowUpRequired() != null ? request.getFollowUpRequired() : false)
                .followUpDate(request.getFollowUpDate())
                .status(request.getStatus() != null ? request.getStatus() : "PENDING")
                .notes(request.getNotes())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .authorDept(request.getAuthorDept())
                .deleted(false)
                .build();

        examMapper.insert(exam);
        log.info("Created pre-placement exam: {}", newId);

        return findById(exam.getId());
    }

    @Transactional
    public PrePlacementExamResponse update(Long id, PrePlacementExamRequest request) {
        PrePlacementExam exam = examMapper.findByIdAndDeletedFalse(id);
        if (exam == null) {
            throw new ResourceNotFoundException("PrePlacementExam", "id", id);
        }

        exam.setEmployeeId(request.getEmployeeId());
        exam.setEmployeeName(request.getEmployeeName());
        exam.setEmployeeDept(request.getEmployeeDept());
        exam.setEmployeeEmail(request.getEmployeeEmail());
        exam.setWorkPlaceId(request.getWorkPlaceId());
        exam.setExamDate(request.getExamDate());
        exam.setExamYear(request.getExamYear());
        exam.setTargetJob(request.getTargetJob());
        exam.setHazardousFactors(request.getHazardousFactors());
        exam.setHospital(request.getHospital());
        exam.setExamResult(request.getExamResult());
        exam.setResultDetail(request.getResultDetail());
        exam.setRestrictionDetail(request.getRestrictionDetail());
        exam.setFollowUpRequired(request.getFollowUpRequired());
        exam.setFollowUpDate(request.getFollowUpDate());
        exam.setStatus(request.getStatus());
        exam.setNotes(request.getNotes());
        exam.setAuthorName(request.getAuthorName());
        exam.setAuthorEmail(request.getAuthorEmail());
        exam.setAuthorDept(request.getAuthorDept());

        examMapper.update(exam);
        log.info("Updated pre-placement exam: {}", exam.getExamId());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        PrePlacementExam exam = examMapper.findByIdAndDeletedFalse(id);
        if (exam == null) {
            throw new ResourceNotFoundException("PrePlacementExam", "id", id);
        }
        examMapper.softDelete(id);
        log.info("Soft deleted pre-placement exam with id: {}", id);
    }

    private String generateExamId() {
        String prefix = "PE-" + LocalDate.now().getYear() + "-";
        int count = examMapper.countByExamIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}

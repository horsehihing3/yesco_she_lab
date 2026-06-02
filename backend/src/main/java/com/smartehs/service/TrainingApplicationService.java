package com.smartehs.service;

import com.smartehs.dto.request.TrainingApplicationRequest;
import com.smartehs.dto.response.TrainingApplicationResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.TrainingApplicationMapper;
import com.smartehs.mapper.TrainingCourseMapper;
import com.smartehs.model.TrainingApplication;
import com.smartehs.model.TrainingCourse;
import com.smartehs.model.IdmUser;
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
public class TrainingApplicationService {

    private final TrainingApplicationMapper mapper;
    private final TrainingCourseMapper courseMapper;

    @Transactional(readOnly = true)
    public Page<TrainingApplicationResponse> findAll(String status, String dept, Long courseId, String username, String keyword, String name, String courseName, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<TrainingApplicationResponse> content = mapper.findAllWithPaging(status, dept, courseId, username, keyword, name, courseName, offset, limit).stream()
                .map(TrainingApplicationResponse::from)
                .collect(Collectors.toList());
        int total = mapper.countAll(status, dept, courseId, username, keyword, name, courseName);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public TrainingApplicationResponse findById(Long id) {
        TrainingApplication a = mapper.findById(id);
        if (a == null) throw new ResourceNotFoundException("TrainingApplication", "id", id);
        return TrainingApplicationResponse.from(a);
    }

    @Transactional
    public TrainingApplicationResponse create(TrainingApplicationRequest req, IdmUser currentUser) {
        TrainingCourse course = courseMapper.findById(req.getCourseId());
        if (course == null) throw new ResourceNotFoundException("TrainingCourse", "id", req.getCourseId());

        // 정원 체크
        int total = course.getTotalSeats() != null ? course.getTotalSeats() : 0;
        int curr  = course.getCurrentSeats() != null ? course.getCurrentSeats() : 0;
        if (total > 0 && curr >= total) {
            throw new IllegalStateException("Course is full");
        }

        TrainingApplication a = TrainingApplication.builder()
                .applicationNo(generateApplicationNo())
                .courseId(course.getId())
                .courseName(course.getCourseName())
                .courseDate(course.getDateStart() != null ? course.getDateStart().toString() : null)
                .applicantName(currentUser != null && req.getApplicantName() == null ? currentUser.getUserName() : req.getApplicantName())
                .applicantDept(currentUser != null && req.getApplicantDept() == null ? (currentUser.getGroupName() != null ? currentUser.getGroupName() : currentUser.getDeptCode()) : req.getApplicantDept())
                .applicantEmpNo(req.getApplicantEmpNo())
                .applicantPhone(req.getApplicantPhone())
                .applicantUsername(currentUser != null ? currentUser.getUid() : null)
                .applyDate(LocalDate.now())
                .status("PENDING")
                .reason(req.getReason())
                .mealOption(req.getMealOption())
                .transportOption(req.getTransportOption())
                .deleted(false)
                .build();

        mapper.insert(a);
        // 정원 1 증가
        courseMapper.incrementCurrentSeats(course.getId(), 1);
        log.info("Created TrainingApplication id={} course={}", a.getId(), course.getCourseCode());
        return TrainingApplicationResponse.from(a);
    }

    @Transactional
    public TrainingApplicationResponse update(Long id, TrainingApplicationRequest req) {
        TrainingApplication a = mapper.findById(id);
        if (a == null) throw new ResourceNotFoundException("TrainingApplication", "id", id);

        a.setApplicantName(req.getApplicantName());
        a.setApplicantDept(req.getApplicantDept());
        a.setApplicantPhone(req.getApplicantPhone());
        a.setReason(req.getReason());
        a.setMealOption(req.getMealOption());
        a.setTransportOption(req.getTransportOption());
        mapper.update(a);
        return TrainingApplicationResponse.from(a);
    }

    @Transactional
    public TrainingApplicationResponse changeStatus(Long id, String status, String approvedBy, String rejectReason, LocalDate completionDate) {
        TrainingApplication a = mapper.findById(id);
        if (a == null) throw new ResourceNotFoundException("TrainingApplication", "id", id);

        // 취소/반려 시 정원 1 감소
        if (("CANCELLED".equals(status) || "REJECTED".equals(status))
                && !"CANCELLED".equals(a.getStatus()) && !"REJECTED".equals(a.getStatus())) {
            courseMapper.incrementCurrentSeats(a.getCourseId(), -1);
        }
        // 수료의 경우 completion_date 가 안 들어왔으면 오늘 날짜로
        LocalDate cd = "COMPLETED".equals(status) && completionDate == null ? LocalDate.now() : completionDate;

        mapper.updateStatus(id, status, approvedBy, rejectReason, cd);
        log.info("TrainingApplication {} status -> {}", id, status);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        TrainingApplication a = mapper.findById(id);
        if (a == null) throw new ResourceNotFoundException("TrainingApplication", "id", id);
        // 정원 감소
        if (!"CANCELLED".equals(a.getStatus()) && !"REJECTED".equals(a.getStatus())) {
            courseMapper.incrementCurrentSeats(a.getCourseId(), -1);
        }
        mapper.delete(id);
    }

    private String generateApplicationNo() {
        String prefix = "TA-" + LocalDate.now().getYear() + "-";
        int count = mapper.countByApplicationNoStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}

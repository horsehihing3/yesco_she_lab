package com.smartehs.service;

import com.smartehs.dto.request.TrainingCourseRequest;
import com.smartehs.dto.response.TrainingCourseResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.TrainingCourseMapper;
import com.smartehs.model.TrainingCourse;
import com.smartehs.model.User;
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
public class TrainingCourseService {

    private final TrainingCourseMapper mapper;

    @Transactional(readOnly = true)
    public Page<TrainingCourseResponse> findAll(String category, Boolean isActive, String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<TrainingCourseResponse> content = mapper.findAllWithPaging(category, isActive, keyword, offset, limit).stream()
                .map(TrainingCourseResponse::from)
                .collect(Collectors.toList());
        int total = mapper.countAll(category, isActive, keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public TrainingCourseResponse findById(Long id) {
        TrainingCourse c = mapper.findById(id);
        if (c == null) throw new ResourceNotFoundException("TrainingCourse", "id", id);
        return TrainingCourseResponse.from(c);
    }

    @Transactional
    public TrainingCourseResponse create(TrainingCourseRequest req, User currentUser) {
        if (mapper.findByCourseCode(req.getCourseCode()) != null) {
            throw new IllegalArgumentException("Course code already exists: " + req.getCourseCode());
        }
        TrainingCourse c = TrainingCourse.builder()
                .courseCode(req.getCourseCode())
                .courseName(req.getCourseName())
                .category(req.getCategory())
                .catType(req.getCatType() != null ? req.getCatType() : "safety")
                .targetAudience(req.getTargetAudience())
                .durationHours(req.getDurationHours())
                .cycle(req.getCycle())
                .legalRequired(req.getLegalRequired() != null ? req.getLegalRequired() : false)
                .instructor(req.getInstructor())
                .description(req.getDescription())
                .dateStart(req.getDateStart())
                .dateEnd(req.getDateEnd())
                .location(req.getLocation())
                .mode(req.getMode() != null ? req.getMode() : "CLASSROOM")
                .status(req.getStatus() != null ? req.getStatus() : "OPEN")
                .totalSeats(req.getTotalSeats() != null ? req.getTotalSeats() : 30)
                .currentSeats(req.getCurrentSeats() != null ? req.getCurrentSeats() : 0)
                .lawBasis(req.getLawBasis())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .createdBy(currentUser != null ? currentUser.getUsername() : null)
                .build();
        mapper.insert(c);
        log.info("Created TrainingCourse id={} code={}", c.getId(), c.getCourseCode());
        return TrainingCourseResponse.from(c);
    }

    @Transactional
    public TrainingCourseResponse update(Long id, TrainingCourseRequest req) {
        TrainingCourse c = mapper.findById(id);
        if (c == null) throw new ResourceNotFoundException("TrainingCourse", "id", id);

        // course code 변경 시 중복 체크
        if (!c.getCourseCode().equals(req.getCourseCode())) {
            TrainingCourse existing = mapper.findByCourseCode(req.getCourseCode());
            if (existing != null) {
                throw new IllegalArgumentException("Course code already exists: " + req.getCourseCode());
            }
        }

        c.setCourseCode(req.getCourseCode());
        c.setCourseName(req.getCourseName());
        c.setCategory(req.getCategory());
        c.setCatType(req.getCatType() != null ? req.getCatType() : "safety");
        c.setTargetAudience(req.getTargetAudience());
        c.setDurationHours(req.getDurationHours());
        c.setCycle(req.getCycle());
        c.setLegalRequired(req.getLegalRequired() != null ? req.getLegalRequired() : false);
        c.setInstructor(req.getInstructor());
        c.setDescription(req.getDescription());
        c.setDateStart(req.getDateStart());
        c.setDateEnd(req.getDateEnd());
        c.setLocation(req.getLocation());
        c.setMode(req.getMode() != null ? req.getMode() : "CLASSROOM");
        c.setStatus(req.getStatus() != null ? req.getStatus() : "OPEN");
        c.setTotalSeats(req.getTotalSeats() != null ? req.getTotalSeats() : 30);
        c.setCurrentSeats(req.getCurrentSeats() != null ? req.getCurrentSeats() : 0);
        c.setLawBasis(req.getLawBasis());
        c.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);

        mapper.update(c);
        log.info("Updated TrainingCourse id={}", id);
        return TrainingCourseResponse.from(c);
    }

    @Transactional
    public void delete(Long id) {
        TrainingCourse c = mapper.findById(id);
        if (c == null) throw new ResourceNotFoundException("TrainingCourse", "id", id);
        mapper.delete(id);
        log.info("Deleted TrainingCourse id={}", id);
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.SafetyEducationAttendeeRequest;
import com.smartehs.dto.request.SafetyEducationRequest;
import com.smartehs.dto.response.SafetyEducationAttendeeResponse;
import com.smartehs.dto.response.SafetyEducationResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.SafetyEducationAttendeeMapper;
import com.smartehs.mapper.SafetyEducationMapper;
import com.smartehs.model.SafetyEducation;
import com.smartehs.model.SafetyEducationAttendee;
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
public class SafetyEducationService {

    private final SafetyEducationMapper educationMapper;
    private final SafetyEducationAttendeeMapper attendeeMapper;

    @Transactional(readOnly = true)
    public Page<SafetyEducationResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyEducationResponse> content = educationMapper.findByDeletedFalse(offset, limit).stream()
                .map(SafetyEducationResponse::from)
                .collect(Collectors.toList());
        int total = educationMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<SafetyEducationResponse> findByYear(int year, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyEducationResponse> content = educationMapper.findByYearAndDeletedFalse(year, offset, limit).stream()
                .map(SafetyEducationResponse::from)
                .collect(Collectors.toList());
        int total = educationMapper.countByYearAndDeletedFalse(year);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<SafetyEducationResponse> findByType(String type, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyEducationResponse> content = educationMapper.findByTypeAndDeletedFalse(type, offset, limit).stream()
                .map(SafetyEducationResponse::from)
                .collect(Collectors.toList());
        int total = educationMapper.countByTypeAndDeletedFalse(type);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<SafetyEducationResponse> searchByTitle(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SafetyEducationResponse> content = educationMapper.searchByTitleAndDeletedFalse(title, offset, limit).stream()
                .map(SafetyEducationResponse::from)
                .collect(Collectors.toList());
        int total = educationMapper.countByTitleAndDeletedFalse(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public SafetyEducationResponse findById(Long id) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(id);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", id);
        }
        SafetyEducationResponse response = SafetyEducationResponse.from(education);
        List<SafetyEducationAttendeeResponse> attendees = attendeeMapper.findByEducationId(education.getEducationId()).stream()
                .map(SafetyEducationAttendeeResponse::from)
                .collect(Collectors.toList());
        response.setAttendees(attendees);
        return response;
    }

    @Transactional
    public SafetyEducationResponse create(SafetyEducationRequest request) {
        String newId = generateEducationId();

        SafetyEducation education = SafetyEducation.builder()
                .educationId(newId)
                .workPlaceId(request.getWorkPlaceId())
                .title(request.getTitle())
                .titleEn(request.getTitleEn())
                .titleZh(request.getTitleZh())
                .educationType(request.getEducationType())
                .educationCategory(request.getEducationCategory())
                .educationDate(request.getEducationDate())
                .educationHours(request.getEducationHours())
                .location(request.getLocation())
                .instructorName(request.getInstructorName())
                .instructorOrg(request.getInstructorOrg())
                .hazardousFactors(request.getHazardousFactors())
                .educationContent(request.getEducationContent())
                .attendeeCount(0)
                .status(request.getStatus() != null ? request.getStatus() : "PLANNED")
                .notes(request.getNotes())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .authorDept(request.getAuthorDept())
                .deleted(false)
                .build();

        educationMapper.insert(education);
        log.info("Created safety education: {}", newId);

        if (request.getAttendees() != null && !request.getAttendees().isEmpty()) {
            for (SafetyEducationAttendeeRequest attendeeReq : request.getAttendees()) {
                SafetyEducationAttendee attendee = SafetyEducationAttendee.builder()
                        .educationId(newId)
                        .attendeeName(attendeeReq.getAttendeeName())
                        .attendeeEmail(attendeeReq.getAttendeeEmail())
                        .attendeeDept(attendeeReq.getAttendeeDept())
                        .attendeeCompany(attendeeReq.getAttendeeCompany())
                        .employeeId(attendeeReq.getEmployeeId())
                        .isSigned(false)
                        .build();
                attendeeMapper.insert(attendee);
            }
            syncAttendeeCount(newId);
            log.info("Inserted {} attendees for education: {}", request.getAttendees().size(), newId);
        }

        return findById(education.getId());
    }

    @Transactional
    public SafetyEducationResponse update(Long id, SafetyEducationRequest request) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(id);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", id);
        }

        education.setWorkPlaceId(request.getWorkPlaceId());
        education.setTitle(request.getTitle());
        education.setTitleEn(request.getTitleEn());
        education.setTitleZh(request.getTitleZh());
        education.setEducationType(request.getEducationType());
        education.setEducationCategory(request.getEducationCategory());
        education.setEducationDate(request.getEducationDate());
        education.setEducationHours(request.getEducationHours());
        education.setLocation(request.getLocation());
        education.setInstructorName(request.getInstructorName());
        education.setInstructorOrg(request.getInstructorOrg());
        education.setHazardousFactors(request.getHazardousFactors());
        education.setEducationContent(request.getEducationContent());
        education.setStatus(request.getStatus());
        education.setNotes(request.getNotes());
        education.setAuthorName(request.getAuthorName());
        education.setAuthorEmail(request.getAuthorEmail());
        education.setAuthorDept(request.getAuthorDept());

        educationMapper.update(education);
        log.info("Updated safety education: {}", education.getEducationId());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(id);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", id);
        }
        attendeeMapper.deleteByEducationId(education.getEducationId());
        educationMapper.softDelete(id);
        log.info("Soft deleted safety education with id: {}", id);
    }

    // ----- Attendee Management -----

    @Transactional(readOnly = true)
    public List<SafetyEducationAttendeeResponse> findAttendees(Long educationId) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(educationId);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", educationId);
        }
        return attendeeMapper.findByEducationId(education.getEducationId()).stream()
                .map(SafetyEducationAttendeeResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public SafetyEducationAttendeeResponse addAttendee(Long educationId, SafetyEducationAttendeeRequest request) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(educationId);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", educationId);
        }

        SafetyEducationAttendee attendee = SafetyEducationAttendee.builder()
                .educationId(education.getEducationId())
                .attendeeName(request.getAttendeeName())
                .attendeeEmail(request.getAttendeeEmail())
                .attendeeDept(request.getAttendeeDept())
                .attendeeCompany(request.getAttendeeCompany())
                .employeeId(request.getEmployeeId())
                .isSigned(false)
                .build();

        attendeeMapper.insert(attendee);
        syncAttendeeCount(education.getEducationId());
        log.info("Added attendee to education {}: {}", education.getEducationId(), request.getAttendeeName());

        return SafetyEducationAttendeeResponse.from(attendeeMapper.findById(attendee.getId()));
    }

    @Transactional
    public List<SafetyEducationAttendeeResponse> addAttendeesBulk(Long educationId, List<SafetyEducationAttendeeRequest> requests) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(educationId);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", educationId);
        }

        for (SafetyEducationAttendeeRequest request : requests) {
            SafetyEducationAttendee attendee = SafetyEducationAttendee.builder()
                    .educationId(education.getEducationId())
                    .attendeeName(request.getAttendeeName())
                    .attendeeEmail(request.getAttendeeEmail())
                    .attendeeDept(request.getAttendeeDept())
                    .attendeeCompany(request.getAttendeeCompany())
                    .employeeId(request.getEmployeeId())
                    .isSigned(false)
                    .build();
            attendeeMapper.insert(attendee);
        }

        syncAttendeeCount(education.getEducationId());
        log.info("Added {} attendees to education {}", requests.size(), education.getEducationId());

        return attendeeMapper.findByEducationId(education.getEducationId()).stream()
                .map(SafetyEducationAttendeeResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeAttendee(Long educationId, Long attendeeId) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(educationId);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", educationId);
        }
        attendeeMapper.delete(attendeeId);
        syncAttendeeCount(education.getEducationId());
        log.info("Removed attendee {} from education {}", attendeeId, education.getEducationId());
    }

    @Transactional
    public SafetyEducationAttendeeResponse signAttendee(Long educationId, Long attendeeId) {
        SafetyEducation education = educationMapper.findByIdAndDeletedFalse(educationId);
        if (education == null) {
            throw new ResourceNotFoundException("SafetyEducation", "id", educationId);
        }
        attendeeMapper.updateSignature(attendeeId);
        log.info("Signed attendee {} for education {}", attendeeId, education.getEducationId());
        return SafetyEducationAttendeeResponse.from(attendeeMapper.findById(attendeeId));
    }

    private void syncAttendeeCount(String educationId) {
        int count = attendeeMapper.countByEducationId(educationId);
        educationMapper.updateAttendeeCount(educationId, count);
    }

    private String generateEducationId() {
        String prefix = "SE-" + LocalDate.now().getYear() + "-";
        int count = educationMapper.countByEducationIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.OSHCommitteeRequest;
import com.smartehs.dto.response.OSHCommitteeAttendeeResponse;
import com.smartehs.dto.response.OSHCommitteeResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.model.OSHCommittee;
import com.smartehs.model.OSHCommitteeAttendee;
import com.smartehs.mapper.OSHCommitteeMapper;
import com.smartehs.mapper.OSHCommitteeAttendeeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OSHCommitteeService {

    private final OSHCommitteeMapper oshCommitteeMapper;
    private final OSHCommitteeAttendeeMapper attendeeMapper;

    public Page<OSHCommitteeResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OSHCommitteeResponse> content = oshCommitteeMapper.findAllWithPaging(offset, limit).stream()
                .map(OSHCommitteeResponse::from)
                .collect(Collectors.toList());
        int total = oshCommitteeMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    public Page<OSHCommitteeResponse> findByYear(Integer year, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OSHCommitteeResponse> content = oshCommitteeMapper.findByOshYear(year, offset, limit).stream()
                .map(OSHCommitteeResponse::from)
                .collect(Collectors.toList());
        int total = oshCommitteeMapper.countByOshYear(year);
        return new PageImpl<>(content, pageable, total);
    }

    public Page<OSHCommitteeResponse> findByYearAndQuarter(Integer year, Integer quarter, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OSHCommitteeResponse> content = oshCommitteeMapper.findByOshYearAndOshQuarter(year, quarter, offset, limit).stream()
                .map(OSHCommitteeResponse::from)
                .collect(Collectors.toList());
        int total = oshCommitteeMapper.countByOshYearAndOshQuarter(year, quarter);
        return new PageImpl<>(content, pageable, total);
    }

    public OSHCommitteeResponse findById(Long id) {
        OSHCommittee committee = oshCommitteeMapper.findById(id);
        if (committee == null) {
            throw new ResourceNotFoundException("OSH Committee not found with id: " + id);
        }
        List<OSHCommitteeAttendeeResponse> attendees = attendeeMapper.findByOshId(committee.getOshId()).stream()
                .map(OSHCommitteeAttendeeResponse::from)
                .collect(Collectors.toList());
        return OSHCommitteeResponse.fromWithAttendees(committee, attendees);
    }

    public OSHCommitteeResponse findByOshId(String oshId) {
        OSHCommittee committee = oshCommitteeMapper.findByOshId(oshId);
        if (committee == null) {
            throw new ResourceNotFoundException("OSH Committee not found with oshId: " + oshId);
        }
        return OSHCommitteeResponse.from(committee);
    }

    @Transactional
    public OSHCommitteeResponse create(OSHCommitteeRequest request) {
        OSHCommittee committee = OSHCommittee.builder()
                .oshId(UUID.randomUUID().toString())
                .oshDate(request.getOshDate() != null ? request.getOshDate().atStartOfDay() : null)
                .oshYear(request.getOshYear())
                .oshQuarter(request.getOshQuarter())
                .oshLocation(request.getOshLocation())
                .oshLocationDetail(request.getOshLocationDetail())
                .mainAgenda(request.getMainAgenda())
                .comment(request.getComment())
                .authorName(request.getAuthorName())
                .authorMail(request.getAuthorMail())
                .authorDept(request.getAuthorDept())
                .authorCompany(request.getAuthorCompany())
                .attendeeCount(0)
                .isFileCreated(false)
                .build();

        oshCommitteeMapper.insert(committee);
        return OSHCommitteeResponse.from(committee);
    }

    @Transactional
    public OSHCommitteeResponse update(Long id, OSHCommitteeRequest request) {
        OSHCommittee committee = oshCommitteeMapper.findById(id);
        if (committee == null) {
            throw new ResourceNotFoundException("OSH Committee not found with id: " + id);
        }

        committee.setOshDate(request.getOshDate() != null ? request.getOshDate().atStartOfDay() : null);
        committee.setOshYear(request.getOshYear());
        committee.setOshQuarter(request.getOshQuarter());
        committee.setOshLocation(request.getOshLocation());
        committee.setOshLocationDetail(request.getOshLocationDetail());
        committee.setMainAgenda(request.getMainAgenda());
        committee.setComment(request.getComment());
        committee.setAuthorName(request.getAuthorName());
        committee.setAuthorMail(request.getAuthorMail());
        committee.setAuthorDept(request.getAuthorDept());
        committee.setAuthorCompany(request.getAuthorCompany());

        oshCommitteeMapper.update(committee);
        return OSHCommitteeResponse.from(committee);
    }

    @Transactional
    public void delete(Long id) {
        OSHCommittee committee = oshCommitteeMapper.findById(id);
        if (committee == null) {
            throw new ResourceNotFoundException("OSH Committee not found with id: " + id);
        }
        oshCommitteeMapper.delete(id);
    }
}

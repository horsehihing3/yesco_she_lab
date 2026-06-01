package com.smartehs.controller;

import com.smartehs.dto.request.OSHCommitteeRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.OSHCommitteeAttendeeResponse;
import com.smartehs.dto.response.OSHCommitteeResponse;
import com.smartehs.model.OSHCommittee;
import com.smartehs.model.OSHCommitteeAttendee;
import com.smartehs.mapper.OSHCommitteeAttendeeMapper;
import com.smartehs.mapper.OSHCommitteeMapper;
import com.smartehs.service.OSHCommitteeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/osh-committees")
@RequiredArgsConstructor
@Tag(name = "OSH Committee", description = "OSH Committee (산업안전보건위원회) API")
public class OSHCommitteeController {

    private final OSHCommitteeService oshCommitteeService;
    private final OSHCommitteeMapper oshCommitteeMapper;
    private final OSHCommitteeAttendeeMapper attendeeMapper;

    @GetMapping
    @Operation(summary = "List OSH committees", description = "Get all OSH committees with pagination")
    public ResponseEntity<ApiResponse<Page<OSHCommitteeResponse>>> findAll(
            @PageableDefault(size = 20, sort = "oshDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OSHCommitteeResponse> committees = oshCommitteeService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(committees));
    }

    @GetMapping("/year/{year}")
    @Operation(summary = "Find by year", description = "Get OSH committees by year")
    public ResponseEntity<ApiResponse<Page<OSHCommitteeResponse>>> findByYear(
            @PathVariable Integer year,
            @PageableDefault(size = 20, sort = "oshDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OSHCommitteeResponse> committees = oshCommitteeService.findByYear(year, pageable);
        return ResponseEntity.ok(ApiResponse.success(committees));
    }

    @GetMapping("/year/{year}/quarter/{quarter}")
    @Operation(summary = "Find by year and quarter", description = "Get OSH committees by year and quarter")
    public ResponseEntity<ApiResponse<Page<OSHCommitteeResponse>>> findByYearAndQuarter(
            @PathVariable Integer year,
            @PathVariable Integer quarter,
            @PageableDefault(size = 20, sort = "oshDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OSHCommitteeResponse> committees = oshCommitteeService.findByYearAndQuarter(year, quarter, pageable);
        return ResponseEntity.ok(ApiResponse.success(committees));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get OSH committee by ID", description = "Get a specific OSH committee by ID")
    public ResponseEntity<ApiResponse<OSHCommitteeResponse>> findById(@PathVariable Long id) {
        OSHCommitteeResponse committee = oshCommitteeService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(committee));
    }

    @GetMapping("/osh-id/{oshId}")
    @Operation(summary = "Get OSH committee by oshId", description = "Get a specific OSH committee by oshId (UUID)")
    public ResponseEntity<ApiResponse<OSHCommitteeResponse>> findByOshId(@PathVariable String oshId) {
        OSHCommitteeResponse committee = oshCommitteeService.findByOshId(oshId);
        return ResponseEntity.ok(ApiResponse.success(committee));
    }

    @PostMapping
    @Operation(summary = "Create OSH committee", description = "Create a new OSH committee")
    public ResponseEntity<ApiResponse<OSHCommitteeResponse>> create(
            @Valid @RequestBody OSHCommitteeRequest request) {
        OSHCommitteeResponse committee = oshCommitteeService.create(request);
        return ResponseEntity.ok(ApiResponse.success("OSH committee created successfully", committee));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update OSH committee", description = "Update an existing OSH committee")
    public ResponseEntity<ApiResponse<OSHCommitteeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody OSHCommitteeRequest request) {
        OSHCommitteeResponse committee = oshCommitteeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("OSH committee updated successfully", committee));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete OSH committee", description = "Delete an OSH committee")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        oshCommitteeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("OSH committee deleted successfully", null));
    }

    // ===== Attendee Management Endpoints =====

    @GetMapping("/{id}/attendees")
    @Operation(summary = "Get attendees", description = "Get all attendees for a specific OSH committee")
    public ResponseEntity<ApiResponse<List<OSHCommitteeAttendeeResponse>>> getAttendees(@PathVariable Long id) {
        OSHCommittee committee = oshCommitteeMapper.findById(id);
        if (committee == null) {
            throw new RuntimeException("OSH Committee not found with id: " + id);
        }
        List<OSHCommitteeAttendeeResponse> attendees = attendeeMapper.findByOshId(committee.getOshId())
                .stream()
                .map(OSHCommitteeAttendeeResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(attendees));
    }

    @PostMapping("/{id}/attendees")
    @Transactional
    @Operation(summary = "Add attendee", description = "Add a single attendee to an OSH committee")
    public ResponseEntity<ApiResponse<OSHCommitteeAttendeeResponse>> addAttendee(
            @PathVariable Long id,
            @RequestBody Map<String, Object> attendeeData) {
        OSHCommittee committee = oshCommitteeMapper.findById(id);
        if (committee == null) {
            throw new RuntimeException("OSH Committee not found with id: " + id);
        }

        String userName = (String) attendeeData.get("userName");
        String userEmail = (String) attendeeData.get("userEmail");

        // Check if already exists
        OSHCommitteeAttendee existing = attendeeMapper.findByOshIdAndAttendeeMail(committee.getOshId(), userEmail);
        if (existing != null) {
            throw new RuntimeException("이미 등록된 참석자입니다.");
        }

        OSHCommitteeAttendee attendee = OSHCommitteeAttendee.builder()
                .oshId(committee.getOshId())
                .attendeeName(userName)
                .attendeeMail(userEmail)
                .isSigned(false)
                .build();
        attendeeMapper.insert(attendee);

        // Update attendee count
        committee.setAttendeeCount(attendeeMapper.countByOshId(committee.getOshId()));
        oshCommitteeMapper.update(committee);

        return ResponseEntity.ok(ApiResponse.success(OSHCommitteeAttendeeResponse.from(attendee)));
    }

    @PostMapping("/{id}/attendees/bulk")
    @Transactional
    @Operation(summary = "Add attendees in bulk", description = "Add multiple attendees to an OSH committee")
    public ResponseEntity<ApiResponse<List<OSHCommitteeAttendeeResponse>>> addAttendeesBulk(
            @PathVariable Long id,
            @RequestBody List<Map<String, Object>> attendeesData) {
        OSHCommittee committee = oshCommitteeMapper.findById(id);
        if (committee == null) {
            throw new RuntimeException("OSH Committee not found with id: " + id);
        }

        for (Map<String, Object> data : attendeesData) {
            String userName = (String) data.get("userName");
            String userEmail = (String) data.get("userEmail");
            String phone = (String) data.get("phone");
            String company = (String) data.get("company");
            String dept = (String) data.get("dept");
            Boolean isExternal = (Boolean) data.get("isExternal");

            OSHCommitteeAttendee existing = attendeeMapper.findByOshIdAndAttendeeMail(committee.getOshId(), userEmail);
            if (existing == null) {
                OSHCommitteeAttendee attendee = OSHCommitteeAttendee.builder()
                        .oshId(committee.getOshId())
                        .attendeeName(userName)
                        .attendeeMail(userEmail)
                        .attendeeDept(dept)
                        .attendeePhone(phone)
                        .attendeeCompany(company)
                        .isExternal(Boolean.TRUE.equals(isExternal))
                        .isSigned(false)
                        .build();
                attendeeMapper.insert(attendee);
            }
        }

        // Update attendee count
        committee.setAttendeeCount(attendeeMapper.countByOshId(committee.getOshId()));
        oshCommitteeMapper.update(committee);

        List<OSHCommitteeAttendeeResponse> attendees = attendeeMapper.findByOshId(committee.getOshId())
                .stream()
                .map(OSHCommitteeAttendeeResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(attendees));
    }

    @DeleteMapping("/{id}/attendees/{attendeeId}")
    @Transactional
    @Operation(summary = "Remove attendee", description = "Remove an attendee from an OSH committee")
    public ResponseEntity<ApiResponse<Void>> removeAttendee(
            @PathVariable Long id,
            @PathVariable Long attendeeId) {
        OSHCommittee committee = oshCommitteeMapper.findById(id);
        if (committee == null) {
            throw new RuntimeException("OSH Committee not found with id: " + id);
        }

        attendeeMapper.delete(attendeeId);

        // Update attendee count
        committee.setAttendeeCount(attendeeMapper.countByOshId(committee.getOshId()));
        oshCommitteeMapper.update(committee);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/attendees/{attendeeId}/sign")
    @Transactional
    @Operation(summary = "Sign attendee", description = "Mark an attendee as signed")
    public ResponseEntity<ApiResponse<OSHCommitteeAttendeeResponse>> signAttendee(
            @PathVariable Long id,
            @PathVariable Long attendeeId) {
        OSHCommitteeAttendee attendee = attendeeMapper.findById(attendeeId);
        if (attendee == null) {
            throw new RuntimeException("Attendee not found with id: " + attendeeId);
        }

        attendee.setIsSigned(true);
        attendee.setSignatureDate(LocalDateTime.now());

        attendeeMapper.update(attendee);
        return ResponseEntity.ok(ApiResponse.success(OSHCommitteeAttendeeResponse.from(attendee)));
    }
}

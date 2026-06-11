package com.smartehs.service;

import com.smartehs.dto.request.PpeRequestDto;
import com.smartehs.dto.response.PpeRequestResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ApprovalMapper;
import com.smartehs.mapper.PpeEquipmentMapper;
import com.smartehs.mapper.PpeRequestMapper;
import com.smartehs.model.Approval;
import com.smartehs.model.PpeEquipment;
import com.smartehs.model.PpeRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor
public class PpeRequestService {
    private final PpeRequestMapper mapper;
    private final ApprovalMapper approvalMapper;
    private final PpeEquipmentMapper equipmentMapper;

    @Transactional(readOnly = true)
    public Page<PpeRequestResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset(); int limit = pageable.getPageSize();
        List<PpeRequestResponse> content = mapper.findByDeletedFalse(offset, limit).stream().map(PpeRequestResponse::from).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countByDeletedFalse());
    }

    @Transactional(readOnly = true)
    public PpeRequestResponse findById(Long id) {
        PpeRequest r = mapper.findByIdAndDeletedFalse(id);
        if (r == null) throw new ResourceNotFoundException("PpeRequest", "id", id);
        return PpeRequestResponse.from(r);
    }

    @Transactional(readOnly = true)
    public Page<PpeRequestResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset(); int limit = pageable.getPageSize();
        List<PpeRequestResponse> content = mapper.findByStatusAndDeletedFalse(status, offset, limit).stream().map(PpeRequestResponse::from).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countByStatusAndDeletedFalse(status));
    }

    @Transactional(readOnly = true)
    public Page<PpeRequestResponse> findByRequester(String requesterId, Pageable pageable) {
        int offset = (int) pageable.getOffset(); int limit = pageable.getPageSize();
        List<PpeRequestResponse> content = mapper.findByRequesterIdAndDeletedFalse(requesterId, offset, limit).stream().map(PpeRequestResponse::from).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, mapper.countByRequesterIdAndDeletedFalse(requesterId));
    }

    @Transactional
    public PpeRequestResponse create(PpeRequestDto dto) {
        String newId = generateRequestId();
        PpeRequest r = PpeRequest.builder()
                .requestId(newId).status("REQUESTED")
                .equipmentId(dto.getEquipmentId()).itemName(dto.getItemName())
                .itemCategory(dto.getItemCategory()).itemModel(dto.getItemModel())
                .quantity(dto.getQuantity()).reason(dto.getReason())
                .requesterName(dto.getRequesterName()).requesterDept(dto.getRequesterDept())
                .requesterId(dto.getRequesterId()).notes(dto.getNotes()).deleted(false).build();
        mapper.insert(r);
        log.info("Created PPE request: {}", newId);

        // 승인 테이블에 자동 등록
        Approval approval = Approval.builder()
                .approvalId("APR-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy")) + "-" + String.format("%03d", approvalMapper.countAll() + 1))
                .type("PPE_REQUEST")
                .title("[보호구 신청] " + dto.getItemName() + " " + dto.getQuantity() + "개")
                .content(newId + " | " + (dto.getReason() != null ? dto.getReason() : ""))
                .applicantName(dto.getRequesterName() != null ? dto.getRequesterName() : "")
                .applicantDept(dto.getRequesterDept() != null ? dto.getRequesterDept() : "")
                .applicantEmail("")
                .requestDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                .status("PENDING")
                .build();
        approvalMapper.insert(approval);
        log.info("Created approval for PPE request: {} -> {}", newId, approval.getApprovalId());

        return findById(r.getId());
    }

    @Transactional
    public PpeRequestResponse approve(Long id, String approverName, String approverDept) {
        PpeRequest r = mapper.findByIdAndDeletedFalse(id);
        if (r == null) throw new ResourceNotFoundException("PpeRequest", "id", id);
        mapper.updateStatus(id, "APPROVED", approverName, approverDept, null);
        log.info("Approved PPE request: {}", r.getRequestId());
        return findById(id);
    }

    @Transactional
    public PpeRequestResponse reject(Long id, String approverName, String approverDept, String rejectionReason) {
        PpeRequest r = mapper.findByIdAndDeletedFalse(id);
        if (r == null) throw new ResourceNotFoundException("PpeRequest", "id", id);
        mapper.updateStatus(id, "REJECTED", approverName, approverDept, rejectionReason);
        log.info("Rejected PPE request: {}", r.getRequestId());
        return findById(id);
    }

    @Transactional
    public PpeRequestResponse issue(Long id) {
        PpeRequest r = mapper.findByIdAndDeletedFalse(id);
        if (r == null) throw new ResourceNotFoundException("PpeRequest", "id", id);

        if (r.getEquipmentId() != null && r.getQuantity() != null) {
            PpeEquipment eq = equipmentMapper.findByIdAndDeletedFalse(r.getEquipmentId());
            if (eq != null) {
                if (eq.getStockQuantity() < r.getQuantity()) {
                    throw new IllegalStateException(
                        "재고가 부족합니다. 현재 재고: " + eq.getStockQuantity() + ", 신청 수량: " + r.getQuantity());
                }
                equipmentMapper.adjustStock(r.getEquipmentId(), -r.getQuantity());
            }
        }

        mapper.updateIssued(id);
        log.info("Issued PPE request: {}, stock deducted: {}", r.getRequestId(), r.getQuantity());
        return findById(id);
    }

    @Transactional
    public PpeRequestResponse returnItem(Long id) {
        PpeRequest r = mapper.findByIdAndDeletedFalse(id);
        if (r == null) throw new ResourceNotFoundException("PpeRequest", "id", id);
        if (!"ISSUED".equals(r.getStatus())) {
            throw new IllegalStateException("지급 완료된 건만 반납할 수 있습니다.");
        }
        if (Boolean.TRUE.equals(r.getIsConsumable())) {
            throw new IllegalStateException("소모품은 반납 처리할 수 없습니다.");
        }

        if (r.getEquipmentId() != null && r.getQuantity() != null) {
            PpeEquipment eq = equipmentMapper.findByIdAndDeletedFalse(r.getEquipmentId());
            if (eq != null) {
                equipmentMapper.adjustStock(r.getEquipmentId(), r.getQuantity());
            }
        }

        mapper.updateReturned(id);
        log.info("Returned PPE request: {}, stock restored: {}", r.getRequestId(), r.getQuantity());
        return findById(id);
    }

    @Transactional
    public PpeRequestResponse cancel(Long id) {
        PpeRequest r = mapper.findByIdAndDeletedFalse(id);
        if (r == null) throw new ResourceNotFoundException("PpeRequest", "id", id);
        mapper.updateStatus(id, "CANCELLED", null, null, null);
        log.info("Cancelled PPE request: {}", r.getRequestId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (mapper.findByIdAndDeletedFalse(id) == null) throw new ResourceNotFoundException("PpeRequest", "id", id);
        mapper.softDelete(id);
    }

    private String generateRequestId() {
        String prefix = "PPE-REQ-" + LocalDate.now().getYear() + "-";
        int count = mapper.countByRequestIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}

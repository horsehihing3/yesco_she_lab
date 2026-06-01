package com.smartehs.service;

import com.smartehs.dto.request.ApprovalLineRequest;
import com.smartehs.dto.response.ApprovalLineResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ApprovalLineMapper;
import com.smartehs.model.ApprovalLine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalLineService {

    private final ApprovalLineMapper approvalLineMapper;

    @Transactional(readOnly = true)
    public List<ApprovalLineResponse> findByApprovalItemCodeAndDeptCode(String approvalItemCode, String deptCode) {
        return approvalLineMapper.findByApprovalItemCodeAndDeptCode(approvalItemCode, deptCode).stream()
                .map(ApprovalLineResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApprovalLineResponse findById(Long id) {
        ApprovalLine line = approvalLineMapper.findById(id);
        if (line == null) {
            throw new ResourceNotFoundException("ApprovalLine", "id", id);
        }
        return ApprovalLineResponse.from(line);
    }

    @Transactional
    public ApprovalLineResponse create(ApprovalLineRequest request) {
        ApprovalLine line = ApprovalLine.builder()
                .approvalItemCode(request.getApprovalItemCode())
                .deptCode(request.getDeptCode())
                .lineOrder(request.getLineOrder())
                .approverName(request.getApproverName())
                .approverPosition(request.getApproverPosition())
                .approverEmail(request.getApproverEmail())
                .approverPhone(request.getApproverPhone())
                .approverDept(request.getApproverDept())
                .hasFinalAuthority(request.getHasFinalAuthority() != null ? request.getHasFinalAuthority() : false)
                .build();

        approvalLineMapper.insert(line);
        log.info("Created approval line: {} dept {} order {}", request.getApprovalItemCode(), request.getDeptCode(), request.getLineOrder());
        return ApprovalLineResponse.from(line);
    }

    @Transactional
    public ApprovalLineResponse update(Long id, ApprovalLineRequest request) {
        ApprovalLine line = approvalLineMapper.findById(id);
        if (line == null) {
            throw new ResourceNotFoundException("ApprovalLine", "id", id);
        }

        line.setApprovalItemCode(request.getApprovalItemCode());
        line.setDeptCode(request.getDeptCode());
        line.setLineOrder(request.getLineOrder());
        line.setApproverName(request.getApproverName());
        line.setApproverPosition(request.getApproverPosition());
        line.setApproverEmail(request.getApproverEmail());
        line.setApproverPhone(request.getApproverPhone());
        line.setApproverDept(request.getApproverDept());
        if (request.getHasFinalAuthority() != null) {
            line.setHasFinalAuthority(request.getHasFinalAuthority());
        }

        approvalLineMapper.update(line);
        log.info("Updated approval line id: {}", id);
        return ApprovalLineResponse.from(line);
    }

    @Transactional
    public void delete(Long id) {
        ApprovalLine line = approvalLineMapper.findById(id);
        if (line == null) {
            throw new ResourceNotFoundException("ApprovalLine", "id", id);
        }
        approvalLineMapper.delete(id);
        log.info("Deleted approval line id: {}", id);
    }

    @Transactional
    public List<ApprovalLineResponse> saveAll(String approvalItemCode, String deptCode, List<ApprovalLineRequest> requests) {
        // 해당 승인 항목 + 부서의 기존 라인 전체 삭제 후 재저장
        approvalLineMapper.deleteByApprovalItemCodeAndDeptCode(approvalItemCode, deptCode);

        return requests.stream()
                .map(request -> {
                    ApprovalLine line = ApprovalLine.builder()
                            .approvalItemCode(approvalItemCode)
                            .deptCode(deptCode)
                            .lineOrder(request.getLineOrder())
                            .approverName(request.getApproverName())
                            .approverPosition(request.getApproverPosition())
                            .approverEmail(request.getApproverEmail())
                            .approverPhone(request.getApproverPhone())
                            .approverDept(request.getApproverDept())
                            .hasFinalAuthority(request.getHasFinalAuthority() != null ? request.getHasFinalAuthority() : false)
                            .build();
                    approvalLineMapper.insert(line);
                    return ApprovalLineResponse.from(line);
                })
                .collect(Collectors.toList());
    }
}

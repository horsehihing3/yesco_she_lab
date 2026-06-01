package com.smartehs.service;

import com.smartehs.dto.request.PpeHistoryRequest;
import com.smartehs.dto.response.PpeHistoryResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeHistoryMapper;
import com.smartehs.model.PpeHistory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PpeHistoryService {

    private final PpeHistoryMapper historyMapper;

    @Transactional(readOnly = true)
    public Page<PpeHistoryResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeHistoryResponse> content = historyMapper.findByDeletedFalse(offset, limit).stream()
                .map(PpeHistoryResponse::from)
                .collect(Collectors.toList());
        int total = historyMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PpeHistoryResponse findById(Long id) {
        PpeHistory history = historyMapper.findByIdAndDeletedFalse(id);
        if (history == null) {
            throw new ResourceNotFoundException("PpeHistory", "id", id);
        }
        return PpeHistoryResponse.from(history);
    }

    @Transactional
    public PpeHistoryResponse create(PpeHistoryRequest request) {
        String newId = generateHistoryId();
        PpeHistory history = PpeHistory.builder()
                .historyId(newId)
                .actionType(request.getActionType())
                .itemName(request.getItemName())
                .quantity(request.getQuantity())
                .recipientName(request.getRecipientName())
                .recipientDept(request.getRecipientDept())
                .handlerName(request.getHandlerName())
                .actionDate(request.getActionDate() != null ? request.getActionDate() : LocalDateTime.now())
                .notes(request.getNotes())
                .deleted(false)
                .build();
        historyMapper.insert(history);
        log.info("Created PPE history: {}", newId);
        return findById(history.getId());
    }

    @Transactional
    public void delete(Long id) {
        PpeHistory history = historyMapper.findByIdAndDeletedFalse(id);
        if (history == null) {
            throw new ResourceNotFoundException("PpeHistory", "id", id);
        }
        historyMapper.softDelete(id);
        log.info("Soft deleted PPE history with id: {}", id);
    }

    private String generateHistoryId() {
        String prefix = "PPE-H-" + LocalDate.now().getYear() + "-";
        int count = historyMapper.countByHistoryIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}

package com.smartehs.service;

import com.smartehs.dto.request.ChemicalLotTrackingRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalLotTrackingMapper;
import com.smartehs.model.ChemicalLotTracking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChemicalLotTrackingService {

    private final ChemicalLotTrackingMapper chemicalLotTrackingMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalLotTracking> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalLotTracking> content = chemicalLotTrackingMapper.findAll(offset, limit);
        int total = chemicalLotTrackingMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalLotTracking> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalLotTracking> content = chemicalLotTrackingMapper.search(keyword, offset, limit);
        int total = chemicalLotTrackingMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalLotTracking findById(Long id) {
        ChemicalLotTracking chemicalLotTracking = chemicalLotTrackingMapper.findById(id);
        if (chemicalLotTracking == null) {
            throw new ResourceNotFoundException("ChemicalLotTracking", "id", id);
        }
        return chemicalLotTracking;
    }

    @Transactional
    public ChemicalLotTracking create(ChemicalLotTrackingRequest request) {
        String lotNumber = generateLotNumber();

        ChemicalLotTracking chemicalLotTracking = ChemicalLotTracking.builder()
                .lotNumber(lotNumber)
                .chemicalName(request.getChemicalName())
                .incomingDate(request.getIncomingDate())
                .incomingQuantity(request.getIncomingQuantity())
                .currentLocation(request.getCurrentLocation())
                .usedQuantity(request.getUsedQuantity())
                .remainingQuantity(request.getRemainingQuantity())
                .elapsedDays(request.getElapsedDays())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        chemicalLotTrackingMapper.insert(chemicalLotTracking);
        log.info("Created chemical lot tracking: {}", lotNumber);

        return findById(chemicalLotTracking.getId());
    }

    @Transactional
    public ChemicalLotTracking update(Long id, ChemicalLotTrackingRequest request) {
        ChemicalLotTracking chemicalLotTracking = chemicalLotTrackingMapper.findById(id);
        if (chemicalLotTracking == null) {
            throw new ResourceNotFoundException("ChemicalLotTracking", "id", id);
        }

        chemicalLotTracking.setChemicalName(request.getChemicalName());
        chemicalLotTracking.setIncomingDate(request.getIncomingDate());
        chemicalLotTracking.setIncomingQuantity(request.getIncomingQuantity());
        chemicalLotTracking.setCurrentLocation(request.getCurrentLocation());
        chemicalLotTracking.setUsedQuantity(request.getUsedQuantity());
        chemicalLotTracking.setRemainingQuantity(request.getRemainingQuantity());
        chemicalLotTracking.setElapsedDays(request.getElapsedDays());
        chemicalLotTracking.setStatus(request.getStatus());

        chemicalLotTrackingMapper.update(chemicalLotTracking);
        log.info("Updated chemical lot tracking: {}", chemicalLotTracking.getLotNumber());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalLotTracking chemicalLotTracking = chemicalLotTrackingMapper.findById(id);
        if (chemicalLotTracking == null) {
            throw new ResourceNotFoundException("ChemicalLotTracking", "id", id);
        }
        chemicalLotTrackingMapper.softDelete(id);
        log.info("Soft deleted chemical lot tracking with id: {}", id);
    }

    private String generateLotNumber() {
        String prefix = "LOT-" + LocalDate.now().getYear() + "-";
        int count = chemicalLotTrackingMapper.countByLotNumberStartingWith(prefix);
        return String.format("%s%04d", prefix, count + 1);
    }
}

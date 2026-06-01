package com.smartehs.service;

import com.smartehs.dto.request.ChemicalRegulationRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalRegulationMapper;
import com.smartehs.model.ChemicalRegulation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChemicalRegulationService {

    private final ChemicalRegulationMapper chemicalRegulationMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalRegulation> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalRegulation> content = chemicalRegulationMapper.findAll(offset, limit);
        int total = chemicalRegulationMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalRegulation> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalRegulation> content = chemicalRegulationMapper.search(keyword, offset, limit);
        int total = chemicalRegulationMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalRegulation findById(Long id) {
        ChemicalRegulation chemicalRegulation = chemicalRegulationMapper.findById(id);
        if (chemicalRegulation == null) {
            throw new ResourceNotFoundException("ChemicalRegulation", "id", id);
        }
        return chemicalRegulation;
    }

    @Transactional
    public ChemicalRegulation create(ChemicalRegulationRequest request) {
        String regCode = generateRegCode();

        ChemicalRegulation chemicalRegulation = ChemicalRegulation.builder()
                .regCode(regCode)
                .regName(request.getRegName())
                .regType(request.getRegType())
                .authority(request.getAuthority())
                .applicableCount(request.getApplicableCount())
                .lastRevisionDate(request.getLastRevisionDate())
                .nextReviewDate(request.getNextReviewDate())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        chemicalRegulationMapper.insert(chemicalRegulation);
        log.info("Created chemical regulation: {}", regCode);

        return findById(chemicalRegulation.getId());
    }

    @Transactional
    public ChemicalRegulation update(Long id, ChemicalRegulationRequest request) {
        ChemicalRegulation chemicalRegulation = chemicalRegulationMapper.findById(id);
        if (chemicalRegulation == null) {
            throw new ResourceNotFoundException("ChemicalRegulation", "id", id);
        }

        chemicalRegulation.setRegName(request.getRegName());
        chemicalRegulation.setRegType(request.getRegType());
        chemicalRegulation.setAuthority(request.getAuthority());
        chemicalRegulation.setApplicableCount(request.getApplicableCount());
        chemicalRegulation.setLastRevisionDate(request.getLastRevisionDate());
        chemicalRegulation.setNextReviewDate(request.getNextReviewDate());
        chemicalRegulation.setStatus(request.getStatus());

        chemicalRegulationMapper.update(chemicalRegulation);
        log.info("Updated chemical regulation: {}", chemicalRegulation.getRegCode());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalRegulation chemicalRegulation = chemicalRegulationMapper.findById(id);
        if (chemicalRegulation == null) {
            throw new ResourceNotFoundException("ChemicalRegulation", "id", id);
        }
        chemicalRegulationMapper.softDelete(id);
        log.info("Soft deleted chemical regulation with id: {}", id);
    }

    private String generateRegCode() {
        String prefix = "REG-";
        int count = chemicalRegulationMapper.countByRegCodeStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}

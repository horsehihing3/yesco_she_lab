package com.smartehs.service;

import com.smartehs.dto.request.WaterWorkplaceRequest;
import com.smartehs.dto.response.WaterWorkplaceResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WaterWorkplaceMapper;
import com.smartehs.model.WaterWorkplace;
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
public class WaterWorkplaceService {

    private final WaterWorkplaceMapper waterWorkplaceMapper;

    @Transactional(readOnly = true)
    public Page<WaterWorkplaceResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WaterWorkplaceResponse> content = waterWorkplaceMapper.findAllWithPaging(offset, limit).stream()
                .map(WaterWorkplaceResponse::from)
                .collect(Collectors.toList());
        int total = waterWorkplaceMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WaterWorkplaceResponse> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WaterWorkplaceResponse> content = waterWorkplaceMapper.findByNameContaining(keyword, offset, limit).stream()
                .map(WaterWorkplaceResponse::from)
                .collect(Collectors.toList());
        int total = waterWorkplaceMapper.countByNameContaining(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WaterWorkplaceResponse findById(Long id) {
        WaterWorkplace entity = waterWorkplaceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterWorkplace", "id", id);
        }
        return WaterWorkplaceResponse.from(entity);
    }

    @Transactional
    public WaterWorkplaceResponse create(WaterWorkplaceRequest request, String regUser) {
        WaterWorkplace entity = WaterWorkplace.builder()
                .workplaceName(request.getWorkplaceName())
                .region(request.getRegion())
                .manager(request.getManager())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        waterWorkplaceMapper.insert(entity);
        log.info("Created water workplace record: {}", entity.getId());
        return WaterWorkplaceResponse.from(entity);
    }

    @Transactional
    public WaterWorkplaceResponse update(Long id, WaterWorkplaceRequest request) {
        WaterWorkplace entity = waterWorkplaceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterWorkplace", "id", id);
        }
        entity.setWorkplaceName(request.getWorkplaceName());
        entity.setRegion(request.getRegion());
        entity.setManager(request.getManager());
        entity.setRemark(request.getRemark());
        waterWorkplaceMapper.update(entity);
        log.info("Updated water workplace record: {}", id);
        return WaterWorkplaceResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        WaterWorkplace entity = waterWorkplaceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterWorkplace", "id", id);
        }
        waterWorkplaceMapper.delete(id);
        log.info("Deleted water workplace record: {}", id);
    }
}

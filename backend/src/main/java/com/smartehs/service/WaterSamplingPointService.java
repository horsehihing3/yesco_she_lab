package com.smartehs.service;

import com.smartehs.dto.request.WaterSamplingPointRequest;
import com.smartehs.dto.response.WaterSamplingPointResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WaterSamplingPointMapper;
import com.smartehs.mapper.WaterWorkplaceMapper;
import com.smartehs.model.WaterSamplingPoint;
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
public class WaterSamplingPointService {

    private final WaterSamplingPointMapper waterSamplingPointMapper;
    private final WaterWorkplaceMapper waterWorkplaceMapper;

    private String getWorkplaceName(Long workplaceId) {
        if (workplaceId == null) {
            return null;
        }
        WaterWorkplace workplace = waterWorkplaceMapper.findById(workplaceId);
        return workplace != null ? workplace.getWorkplaceName() : null;
    }

    @Transactional(readOnly = true)
    public Page<WaterSamplingPointResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WaterSamplingPointResponse> content = waterSamplingPointMapper.findAllWithPaging(offset, limit).stream()
                .map(entity -> WaterSamplingPointResponse.from(entity, getWorkplaceName(entity.getWorkplaceId())))
                .collect(Collectors.toList());
        int total = waterSamplingPointMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WaterSamplingPointResponse> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WaterSamplingPointResponse> content = waterSamplingPointMapper.findByNameContaining(keyword, offset, limit).stream()
                .map(entity -> WaterSamplingPointResponse.from(entity, getWorkplaceName(entity.getWorkplaceId())))
                .collect(Collectors.toList());
        int total = waterSamplingPointMapper.countByNameContaining(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WaterSamplingPointResponse findById(Long id) {
        WaterSamplingPoint entity = waterSamplingPointMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterSamplingPoint", "id", id);
        }
        return WaterSamplingPointResponse.from(entity, getWorkplaceName(entity.getWorkplaceId()));
    }

    @Transactional(readOnly = true)
    public List<WaterSamplingPointResponse> findByWorkplaceId(Long workplaceId) {
        String workplaceName = getWorkplaceName(workplaceId);
        return waterSamplingPointMapper.findByWorkplaceId(workplaceId).stream()
                .map(entity -> WaterSamplingPointResponse.from(entity, workplaceName))
                .collect(Collectors.toList());
    }

    @Transactional
    public WaterSamplingPointResponse create(WaterSamplingPointRequest request, String regUser) {
        WaterSamplingPoint entity = WaterSamplingPoint.builder()
                .workplaceId(request.getWorkplaceId())
                .pointName(request.getPointName())
                .location(request.getLocation())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        waterSamplingPointMapper.insert(entity);
        log.info("Created water sampling point record: {}", entity.getId());
        return WaterSamplingPointResponse.from(entity, getWorkplaceName(entity.getWorkplaceId()));
    }

    @Transactional
    public WaterSamplingPointResponse update(Long id, WaterSamplingPointRequest request) {
        WaterSamplingPoint entity = waterSamplingPointMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterSamplingPoint", "id", id);
        }
        entity.setWorkplaceId(request.getWorkplaceId());
        entity.setPointName(request.getPointName());
        entity.setLocation(request.getLocation());
        entity.setRemark(request.getRemark());
        waterSamplingPointMapper.update(entity);
        log.info("Updated water sampling point record: {}", id);
        return WaterSamplingPointResponse.from(entity, getWorkplaceName(entity.getWorkplaceId()));
    }

    @Transactional
    public void delete(Long id) {
        WaterSamplingPoint entity = waterSamplingPointMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterSamplingPoint", "id", id);
        }
        waterSamplingPointMapper.delete(id);
        log.info("Deleted water sampling point record: {}", id);
    }
}

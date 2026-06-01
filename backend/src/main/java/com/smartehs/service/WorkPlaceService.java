package com.smartehs.service;

import com.smartehs.dto.request.WorkPlaceRequest;
import com.smartehs.dto.response.WorkPlaceResponse;
import com.smartehs.model.WorkPlace;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WorkPlaceMapper;
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
public class WorkPlaceService {

    private final WorkPlaceMapper workPlaceMapper;

    @Transactional(readOnly = true)
    public Page<WorkPlaceResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<WorkPlaceResponse> content = workPlaceMapper.findByUsedTrueWithPaging(offset, limit).stream()
                .map(WorkPlaceResponse::from)
                .collect(Collectors.toList());
        int total = workPlaceMapper.countByUsedTrue();

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<WorkPlaceResponse> findAllActive() {
        return workPlaceMapper.findByUsedTrue().stream()
                .map(WorkPlaceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<WorkPlaceResponse> search(String place, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<WorkPlaceResponse> content = workPlaceMapper.findByPlaceContainingAndUsedTrue(place, offset, limit).stream()
                .map(WorkPlaceResponse::from)
                .collect(Collectors.toList());
        int total = workPlaceMapper.countByPlaceContainingAndUsedTrue(place);

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WorkPlaceResponse> findByFloor(String floor, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<WorkPlaceResponse> content = workPlaceMapper.findByFloorAndUsedTrue(floor, offset, limit).stream()
                .map(WorkPlaceResponse::from)
                .collect(Collectors.toList());
        int total = workPlaceMapper.countByFloorAndUsedTrue(floor);

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WorkPlaceResponse findById(Long id) {
        WorkPlace workPlace = workPlaceMapper.findById(id);
        if (workPlace == null) {
            throw new ResourceNotFoundException("WorkPlace", "id", id);
        }
        return WorkPlaceResponse.from(workPlace);
    }

    @Transactional
    public WorkPlaceResponse create(WorkPlaceRequest request) {
        WorkPlace workPlace = WorkPlace.builder()
                .title(request.getTitle())
                .place(request.getPlace())
                .floor(request.getFloor())
                .used(request.getUsed() != null ? request.getUsed() : true)
                .company(request.getCompany())
                .coordinate(request.getCoordinate())
                .imagePath(request.getImagePath())
                .build();

        workPlaceMapper.insert(workPlace);
        log.info("Created work place: {}", workPlace.getId());
        return WorkPlaceResponse.from(workPlace);
    }

    @Transactional
    public WorkPlaceResponse update(Long id, WorkPlaceRequest request) {
        WorkPlace workPlace = workPlaceMapper.findById(id);
        if (workPlace == null) {
            throw new ResourceNotFoundException("WorkPlace", "id", id);
        }

        workPlace.setTitle(request.getTitle());
        workPlace.setPlace(request.getPlace());
        workPlace.setFloor(request.getFloor());
        if (request.getUsed() != null) {
            workPlace.setUsed(request.getUsed());
        }
        workPlace.setCompany(request.getCompany());
        workPlace.setCoordinate(request.getCoordinate());
        workPlace.setImagePath(request.getImagePath());

        workPlaceMapper.update(workPlace);
        log.info("Updated work place: {}", workPlace.getId());
        return WorkPlaceResponse.from(workPlace);
    }

    @Transactional
    public void delete(Long id) {
        WorkPlace workPlace = workPlaceMapper.findById(id);
        if (workPlace == null) {
            throw new ResourceNotFoundException("WorkPlace", "id", id);
        }

        // Soft delete by setting used to false
        workPlace.setUsed(false);
        workPlaceMapper.update(workPlace);
        log.info("Soft deleted work place with id: {}", id);
    }
}

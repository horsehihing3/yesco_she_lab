package com.smartehs.service;

import com.smartehs.dto.request.FloorDrawingRequest;
import com.smartehs.dto.request.SafetyDeviceRequest;
import com.smartehs.dto.response.FloorDrawingResponse;
import com.smartehs.dto.response.SafetyDeviceResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.FloorDrawingMapper;
import com.smartehs.mapper.SafetyDeviceMapper;
import com.smartehs.model.FloorDrawing;
import com.smartehs.model.SafetyDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FloorDrawingService {

    private final FloorDrawingMapper floorDrawingMapper;
    private final SafetyDeviceMapper safetyDeviceMapper;

    /**
     * Get all active floor drawings with their devices
     */
    public List<FloorDrawingResponse> getAllFloorDrawings() {
        List<FloorDrawing> drawings = floorDrawingMapper.findAllActive();
        return drawings.stream()
                .map(drawing -> {
                    List<SafetyDevice> devices = safetyDeviceMapper.findByFloorDrawingIdAndActive(drawing.getId());
                    return FloorDrawingResponse.from(drawing, devices);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get floor drawings by site
     */
    public List<FloorDrawingResponse> getFloorDrawingsBySite(String site) {
        List<FloorDrawing> drawings = floorDrawingMapper.findBySite(site);
        return drawings.stream()
                .map(drawing -> {
                    List<SafetyDevice> devices = safetyDeviceMapper.findByFloorDrawingIdAndActive(drawing.getId());
                    return FloorDrawingResponse.from(drawing, devices);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get floor drawing by ID
     */
    public FloorDrawingResponse getFloorDrawingById(Long id) {
        FloorDrawing drawing = floorDrawingMapper.findById(id);
        if (drawing == null) {
            throw new ResourceNotFoundException("FloorDrawing not found with id: " + id);
        }
        List<SafetyDevice> devices = safetyDeviceMapper.findByFloorDrawingIdAndActive(drawing.getId());
        return FloorDrawingResponse.from(drawing, devices);
    }

    /**
     * Create new floor drawing with devices
     */
    @Transactional
    public FloorDrawingResponse createFloorDrawing(FloorDrawingRequest request) {
        FloorDrawing drawing = FloorDrawing.builder()
                .workPlaceId(request.getWorkPlaceId())
                .name(request.getName())
                .site(request.getSite())
                .floor(request.getFloor())
                .imagePath(request.getImagePath())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        floorDrawingMapper.insert(drawing);

        // Insert devices if provided
        if (request.getDevices() != null && !request.getDevices().isEmpty()) {
            for (SafetyDeviceRequest deviceRequest : request.getDevices()) {
                SafetyDevice device = SafetyDevice.builder()
                        .floorDrawingId(drawing.getId())
                        .imageFileId(deviceRequest.getImageFileId())
                        .deviceType(deviceRequest.getDeviceType())
                        .name(deviceRequest.getName())
                        .positionX(deviceRequest.getPositionX())
                        .positionY(deviceRequest.getPositionY())
                        .description(deviceRequest.getDescription())
                        .active(deviceRequest.getActive() != null ? deviceRequest.getActive() : true)
                        .build();
                safetyDeviceMapper.insert(device);
            }
        }

        return getFloorDrawingById(drawing.getId());
    }

    /**
     * Update floor drawing
     */
    @Transactional
    public FloorDrawingResponse updateFloorDrawing(Long id, FloorDrawingRequest request) {
        FloorDrawing existing = floorDrawingMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("FloorDrawing not found with id: " + id);
        }

        existing.setWorkPlaceId(request.getWorkPlaceId());
        existing.setName(request.getName());
        existing.setSite(request.getSite());
        existing.setFloor(request.getFloor());
        existing.setImagePath(request.getImagePath());
        existing.setDescription(request.getDescription());
        if (request.getActive() != null) {
            existing.setActive(request.getActive());
        }

        floorDrawingMapper.update(existing);

        // Update devices if provided
        if (request.getDevices() != null) {
            // Delete existing devices
            safetyDeviceMapper.deleteByFloorDrawingId(id);

            // Insert new devices
            for (SafetyDeviceRequest deviceRequest : request.getDevices()) {
                SafetyDevice device = SafetyDevice.builder()
                        .floorDrawingId(id)
                        .imageFileId(deviceRequest.getImageFileId())
                        .deviceType(deviceRequest.getDeviceType())
                        .name(deviceRequest.getName())
                        .positionX(deviceRequest.getPositionX())
                        .positionY(deviceRequest.getPositionY())
                        .description(deviceRequest.getDescription())
                        .active(deviceRequest.getActive() != null ? deviceRequest.getActive() : true)
                        .build();
                safetyDeviceMapper.insert(device);
            }
        }

        return getFloorDrawingById(id);
    }

    /**
     * Delete floor drawing (soft delete)
     */
    @Transactional
    public void deleteFloorDrawing(Long id) {
        FloorDrawing existing = floorDrawingMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("FloorDrawing not found with id: " + id);
        }
        floorDrawingMapper.softDelete(id);
    }

    /**
     * Add device to floor drawing
     */
    @Transactional
    public SafetyDeviceResponse addDevice(Long floorDrawingId, SafetyDeviceRequest request) {
        FloorDrawing drawing = floorDrawingMapper.findById(floorDrawingId);
        if (drawing == null) {
            throw new ResourceNotFoundException("FloorDrawing not found with id: " + floorDrawingId);
        }

        SafetyDevice device = SafetyDevice.builder()
                .floorDrawingId(floorDrawingId)
                .imageFileId(request.getImageFileId())
                .deviceType(request.getDeviceType())
                .name(request.getName())
                .positionX(request.getPositionX())
                .positionY(request.getPositionY())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        safetyDeviceMapper.insert(device);
        return SafetyDeviceResponse.from(safetyDeviceMapper.findById(device.getId()));
    }

    /**
     * Update device
     */
    @Transactional
    public SafetyDeviceResponse updateDevice(Long deviceId, SafetyDeviceRequest request) {
        SafetyDevice existing = safetyDeviceMapper.findById(deviceId);
        if (existing == null) {
            throw new ResourceNotFoundException("SafetyDevice not found with id: " + deviceId);
        }

        existing.setDeviceType(request.getDeviceType());
        existing.setName(request.getName());
        existing.setPositionX(request.getPositionX());
        existing.setPositionY(request.getPositionY());
        existing.setImageFileId(request.getImageFileId());
        existing.setDescription(request.getDescription());
        if (request.getActive() != null) {
            existing.setActive(request.getActive());
        }

        safetyDeviceMapper.update(existing);
        return SafetyDeviceResponse.from(safetyDeviceMapper.findById(deviceId));
    }

    /**
     * Delete device
     */
    @Transactional
    public void deleteDevice(Long deviceId) {
        SafetyDevice existing = safetyDeviceMapper.findById(deviceId);
        if (existing == null) {
            throw new ResourceNotFoundException("SafetyDevice not found with id: " + deviceId);
        }
        safetyDeviceMapper.delete(deviceId);
    }

    /**
     * Get distinct sites
     */
    public List<String> getDistinctSites() {
        return floorDrawingMapper.findAllActive().stream()
                .map(FloorDrawing::getSite)
                .distinct()
                .collect(Collectors.toList());
    }
}

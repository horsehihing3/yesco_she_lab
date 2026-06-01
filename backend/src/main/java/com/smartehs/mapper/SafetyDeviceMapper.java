package com.smartehs.mapper;

import com.smartehs.model.SafetyDevice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyDeviceMapper {

    List<SafetyDevice> findAll();

    List<SafetyDevice> findByFloorDrawingId(@Param("floorDrawingId") Long floorDrawingId);

    List<SafetyDevice> findByFloorDrawingIdAndActive(@Param("floorDrawingId") Long floorDrawingId);

    SafetyDevice findById(@Param("id") Long id);

    List<SafetyDevice> findByDeviceType(@Param("deviceType") String deviceType);

    void insert(SafetyDevice safetyDevice);

    void insertBatch(@Param("devices") List<SafetyDevice> devices);

    void update(SafetyDevice safetyDevice);

    void delete(@Param("id") Long id);

    void deleteByFloorDrawingId(@Param("floorDrawingId") Long floorDrawingId);

    void softDelete(@Param("id") Long id);
}

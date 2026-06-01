package com.smartehs.mapper;

import com.smartehs.model.EmergencyResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface EmergencyResponseMapper {
    List<EmergencyResponse> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    EmergencyResponse findByIdAndDeletedFalse(@Param("id") Long id);
    List<EmergencyResponse> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatusAndDeletedFalse(@Param("status") String status);
    List<EmergencyResponse> findByEmergencyTypeAndDeletedFalse(@Param("emergencyType") String emergencyType, @Param("offset") int offset, @Param("limit") int limit);
    int countByEmergencyTypeAndDeletedFalse(@Param("emergencyType") String emergencyType);
    List<EmergencyResponse> searchByTitleAndDeletedFalse(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearchTitleAndDeletedFalse(@Param("title") String title);
    int countByResponseIdStartingWith(@Param("prefix") String prefix);
    void insert(EmergencyResponse entity);
    void update(EmergencyResponse entity);
    void updateStatus(@Param("id") Long id, @Param("status") String status);
    void softDelete(@Param("id") Long id);
}

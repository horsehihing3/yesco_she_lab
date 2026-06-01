package com.smartehs.mapper;

import com.smartehs.model.EmergencyDrill;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmergencyDrillMapper {
    List<EmergencyDrill> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    EmergencyDrill findById(@Param("id") Long id);
    List<EmergencyDrill> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("status") String status);
    List<EmergencyDrill> findByDrillType(@Param("drillType") String drillType, @Param("offset") int offset, @Param("limit") int limit);
    int countByDrillType(@Param("drillType") String drillType);
    void insert(EmergencyDrill emergencyDrill);
    void update(EmergencyDrill emergencyDrill);
    void softDelete(@Param("id") Long id);
    int countByDrillIdStartingWith(@Param("prefix") String prefix);

    void updateChecklistCounts(@Param("id") Long id, @Param("totalChecklist") int totalChecklist,
                               @Param("completedChecklist") int completedChecklist, @Param("findingCount") int findingCount);

    List<EmergencyDrill> findByPlanId(@Param("planId") Long planId);
}

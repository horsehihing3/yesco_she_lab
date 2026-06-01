package com.smartehs.mapper;

import com.smartehs.model.EnvMonitoring;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EnvMonitoringMapper {

    List<EnvMonitoring> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();

    EnvMonitoring findByIdAndDeletedFalse(@Param("id") Long id);
    EnvMonitoring findByMonitorIdAndDeletedFalse(@Param("monitorId") String monitorId);

    List<EnvMonitoring> searchByKeyword(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countByKeyword(@Param("keyword") String keyword);

    List<EnvMonitoring> findByMonitorTypeAndDeletedFalse(@Param("monitorType") String monitorType, @Param("offset") int offset, @Param("limit") int limit);
    int countByMonitorTypeAndDeletedFalse(@Param("monitorType") String monitorType);

    List<EnvMonitoring> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatusAndDeletedFalse(@Param("status") String status);

    int countByStatusForKpi(@Param("status") String status);

    int countByMonitorIdStartingWith(@Param("prefix") String prefix);

    void insert(EnvMonitoring envMonitoring);
    void update(EnvMonitoring envMonitoring);
    void softDelete(@Param("id") Long id);
}

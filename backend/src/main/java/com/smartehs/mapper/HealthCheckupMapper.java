package com.smartehs.mapper;

import com.smartehs.model.HealthCheckup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HealthCheckupMapper {

    List<HealthCheckup> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();

    HealthCheckup findByIdAndDeletedFalse(@Param("id") Long id);
    HealthCheckup findByCheckupIdAndDeletedFalse(@Param("checkupId") String checkupId);

    List<HealthCheckup> findByEmployeeIdAndDeletedFalse(@Param("employeeId") String employeeId, @Param("offset") int offset, @Param("limit") int limit);
    int countByEmployeeIdAndDeletedFalse(@Param("employeeId") String employeeId);

    List<HealthCheckup> findAllByEmployeeEmailAndDeletedFalse(@Param("employeeEmail") String employeeEmail);

    List<HealthCheckup> findByCheckupYearAndDeletedFalse(@Param("checkupYear") int checkupYear, @Param("offset") int offset, @Param("limit") int limit);
    int countByCheckupYearAndDeletedFalse(@Param("checkupYear") int checkupYear);

    List<HealthCheckup> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatusAndDeletedFalse(@Param("status") String status);

    List<HealthCheckup> findTargetsByYearAndDeletedFalse(@Param("checkupYear") int checkupYear, @Param("offset") int offset, @Param("limit") int limit);
    int countTargetsByYearAndDeletedFalse(@Param("checkupYear") int checkupYear);

    List<HealthCheckup> searchByEmployeeNameAndDeletedFalse(@Param("name") String name, @Param("offset") int offset, @Param("limit") int limit);
    int countByEmployeeNameAndDeletedFalse(@Param("name") String name);

    int countByCheckupIdStartingWith(@Param("prefix") String prefix);

    void insert(HealthCheckup healthCheckup);
    void update(HealthCheckup healthCheckup);
    void softDelete(@Param("id") Long id);
}

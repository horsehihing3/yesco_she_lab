package com.smartehs.mapper;

import com.smartehs.model.IncidentResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface IncidentResponseMapper {
    List<IncidentResponse> findAll();
    IncidentResponse findById(@Param("id") Long id);
    IncidentResponse findByResponseId(@Param("responseId") String responseId);
    int countAll();
    int countByStatus(@Param("status") String status);
    int countByIsDrill(@Param("isDrill") Boolean isDrill);
    String maxResponseIdByYear(@Param("yearPrefix") String yearPrefix);
    void insert(IncidentResponse e);
    void update(IncidentResponse e);
    void softDelete(@Param("id") Long id);
}

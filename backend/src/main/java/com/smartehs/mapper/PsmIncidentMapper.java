package com.smartehs.mapper;

import com.smartehs.model.PsmIncident;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PsmIncidentMapper {
    List<PsmIncident> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();
    PsmIncident findById(@Param("id") Long id);
    int countByIncidentNoStartingWith(@Param("prefix") String prefix);
    void insert(PsmIncident i);
    void update(PsmIncident i);
    void softDelete(@Param("id") Long id);
}

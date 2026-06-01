package com.smartehs.mapper;

import com.smartehs.model.OdmFollowup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdmFollowupMapper {
    List<OdmFollowup> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<OdmFollowup> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("status") String status);
    OdmFollowup findById(@Param("id") Long id);
    void insert(OdmFollowup followup);
    void update(OdmFollowup followup);
    void delete(@Param("id") Long id);
}

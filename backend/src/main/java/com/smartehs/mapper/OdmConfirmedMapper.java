package com.smartehs.mapper;

import com.smartehs.model.OdmConfirmed;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdmConfirmedMapper {
    List<OdmConfirmed> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<OdmConfirmed> findByApprovalStatus(@Param("approvalStatus") String approvalStatus, @Param("offset") int offset, @Param("limit") int limit);
    int countByApprovalStatus(@Param("approvalStatus") String approvalStatus);
    OdmConfirmed findById(@Param("id") Long id);
    void insert(OdmConfirmed confirmed);
    void update(OdmConfirmed confirmed);
    void delete(@Param("id") Long id);
}

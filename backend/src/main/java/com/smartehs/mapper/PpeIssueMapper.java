package com.smartehs.mapper;

import com.smartehs.model.PpeIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpeIssueMapper {
    List<PpeIssue> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<PpeIssue> findByDepartment(@Param("department") String dept, @Param("offset") int offset, @Param("limit") int limit);
    int countByDepartment(@Param("department") String dept);
    List<PpeIssue> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("status") String status);
    List<PpeIssue> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearch(@Param("keyword") String keyword);
    PpeIssue findById(@Param("id") Long id);
    void insert(PpeIssue issue);
    void update(PpeIssue issue);
    void updateStatus(@Param("id") Long id, @Param("status") String status,
                      @Param("modifiedBy") com.smartehs.model.PersonRef modifiedBy);
    void softDelete(@Param("id") Long id);
}

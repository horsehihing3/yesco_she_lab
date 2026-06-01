package com.smartehs.mapper;

import com.smartehs.model.FireIssue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FireIssueMapper {
    List<FireIssue> findAll();
    FireIssue findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    void insert(FireIssue e);
    void update(FireIssue e);
    void softDelete(@Param("id") Long id);
}

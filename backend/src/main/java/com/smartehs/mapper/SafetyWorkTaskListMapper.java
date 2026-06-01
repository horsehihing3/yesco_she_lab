package com.smartehs.mapper;

import com.smartehs.model.SafetyWorkTaskList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyWorkTaskListMapper {

    List<SafetyWorkTaskList> findAll();

    SafetyWorkTaskList findById(@Param("id") Long id);

    SafetyWorkTaskList findBySafetyTaskId(@Param("safetyTaskId") String safetyTaskId);

    List<SafetyWorkTaskList> findBySafetyWorkId(@Param("safetyWorkId") String safetyWorkId);

    void insert(SafetyWorkTaskList taskList);

    void update(SafetyWorkTaskList taskList);

    void delete(@Param("id") Long id);

    void deleteBySafetyWorkId(@Param("safetyWorkId") String safetyWorkId);
}

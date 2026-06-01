package com.smartehs.mapper;

import com.smartehs.model.SafetyWorkList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyWorkListMapper {

    List<SafetyWorkList> findAll();

    List<SafetyWorkList> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    SafetyWorkList findById(@Param("id") Long id);

    SafetyWorkList findBySafetyWorkId(@Param("safetyWorkId") String safetyWorkId);

    List<SafetyWorkList> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);

    int countByTitleContaining(@Param("title") String title);

    List<SafetyWorkList> findByLocationContaining(@Param("location") String location, @Param("offset") int offset, @Param("limit") int limit);

    int countByLocationContaining(@Param("location") String location);

    List<SafetyWorkList> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    List<SafetyWorkList> findByTitleContainingAndLocationContaining(@Param("title") String title, @Param("location") String location, @Param("offset") int offset, @Param("limit") int limit);

    int countByTitleContainingAndLocationContaining(@Param("title") String title, @Param("location") String location);

    void insert(SafetyWorkList safetyWorkList);

    void update(SafetyWorkList safetyWorkList);

    void delete(@Param("id") Long id);
}

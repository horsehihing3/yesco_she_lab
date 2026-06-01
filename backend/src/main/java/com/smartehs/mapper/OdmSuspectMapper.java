package com.smartehs.mapper;

import com.smartehs.model.OdmSuspect;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdmSuspectMapper {
    List<OdmSuspect> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    List<OdmSuspect> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatus(@Param("status") String status);
    List<OdmSuspect> findByName(@Param("name") String name, @Param("offset") int offset, @Param("limit") int limit);
    int countByName(@Param("name") String name);
    OdmSuspect findById(@Param("id") Long id);
    void insert(OdmSuspect suspect);
    void update(OdmSuspect suspect);
    void delete(@Param("id") Long id);
}

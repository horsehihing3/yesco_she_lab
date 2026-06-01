package com.smartehs.mapper;

import com.smartehs.model.WasteCompliance;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WasteComplianceMapper {

    List<WasteCompliance> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    WasteCompliance findById(@Param("id") Long id);

    List<WasteCompliance> findByRegulationNameContaining(@Param("regulationName") String regulationName, @Param("offset") int offset, @Param("limit") int limit);

    int countByRegulationNameContaining(@Param("regulationName") String regulationName);

    List<WasteCompliance> findByStatus(@Param("status") String status);

    int countByStatus(@Param("status") String status);

    void insert(WasteCompliance wasteCompliance);

    void update(WasteCompliance wasteCompliance);

    void delete(@Param("id") Long id);
}

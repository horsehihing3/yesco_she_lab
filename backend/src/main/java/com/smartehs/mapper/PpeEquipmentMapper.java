package com.smartehs.mapper;

import com.smartehs.model.PpeEquipment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PpeEquipmentMapper {

    List<PpeEquipment> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    PpeEquipment findByIdAndDeletedFalse(@Param("id") Long id);

    List<PpeEquipment> findByCategoryAndDeletedFalse(@Param("category") String category, @Param("offset") int offset, @Param("limit") int limit);

    int countByCategoryAndDeletedFalse(@Param("category") String category);

    List<PpeEquipment> searchByNameAndDeletedFalse(@Param("name") String name, @Param("offset") int offset, @Param("limit") int limit);

    int countBySearchNameAndDeletedFalse(@Param("name") String name);

    List<PpeEquipment> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatusAndDeletedFalse(@Param("status") String status);

    int countByEquipmentIdStartingWith(@Param("prefix") String prefix);

    // KPI queries
    int countTotalItems();

    int countByStatusEquals(@Param("status") String status);

    Map<String, Object> getAverageWearRate();

    void insert(PpeEquipment equipment);

    void update(PpeEquipment equipment);

    void softDelete(@Param("id") Long id);
}

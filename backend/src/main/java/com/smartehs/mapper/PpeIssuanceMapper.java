package com.smartehs.mapper;

import com.smartehs.model.PpeIssuance;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PpeIssuanceMapper {

    List<PpeIssuance> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();

    PpeIssuance findByIdAndDeletedFalse(@Param("id") Long id);
    PpeIssuance findByIssuanceIdAndDeletedFalse(@Param("issuanceId") String issuanceId);

    List<PpeIssuance> findByEmployeeIdAndDeletedFalse(@Param("employeeId") String employeeId, @Param("offset") int offset, @Param("limit") int limit);
    int countByEmployeeIdAndDeletedFalse(@Param("employeeId") String employeeId);

    List<PpeIssuance> findByPpeTypeAndDeletedFalse(@Param("ppeType") String ppeType, @Param("offset") int offset, @Param("limit") int limit);
    int countByPpeTypeAndDeletedFalse(@Param("ppeType") String ppeType);

    List<PpeIssuance> searchByEmployeeNameAndDeletedFalse(@Param("name") String name, @Param("offset") int offset, @Param("limit") int limit);
    int countByEmployeeNameAndDeletedFalse(@Param("name") String name);

    int countByIssuanceIdStartingWith(@Param("prefix") String prefix);

    void insert(PpeIssuance ppeIssuance);
    void update(PpeIssuance ppeIssuance);
    void updateSignature(@Param("id") Long id);
    void softDelete(@Param("id") Long id);
}

package com.smartehs.mapper;

import com.smartehs.model.AccidentClaim;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccidentClaimMapper {

    List<AccidentClaim> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    AccidentClaim findById(@Param("id") Long id);

    List<AccidentClaim> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    List<AccidentClaim> findByCreatedBy(@Param("createdBy") String createdBy, @Param("offset") int offset, @Param("limit") int limit);

    int countByCreatedBy(@Param("createdBy") String createdBy);

    void insert(AccidentClaim claim);

    void update(AccidentClaim claim);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    void softDelete(@Param("id") Long id);

    int countByClaimIdStartingWith(@Param("prefix") String prefix);
}

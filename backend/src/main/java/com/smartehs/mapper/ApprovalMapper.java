package com.smartehs.mapper;

import com.smartehs.model.Approval;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ApprovalMapper {

    List<Approval> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    Approval findById(@Param("id") Long id);

    List<Approval> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    List<Approval> search(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);

    int countBySearch(@Param("keyword") String keyword);

    List<Approval> findByStatusAndSearch(@Param("status") String status, @Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatusAndSearch(@Param("status") String status, @Param("keyword") String keyword);

    void insert(Approval approval);

    void update(Approval approval);

    void delete(@Param("id") Long id);

    List<Approval> findByApplicantEmail(@Param("email") String email, @Param("offset") int offset, @Param("limit") int limit);

    int countByApplicantEmail(@Param("email") String email);

    List<Approval> findHistory(@Param("email") String email, @Param("offset") int offset, @Param("limit") int limit);

    int countHistory(@Param("email") String email);
}

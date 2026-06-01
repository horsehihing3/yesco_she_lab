package com.smartehs.mapper;

import com.smartehs.model.ProcessActivityForm;
import com.smartehs.model.ProcessActivityItem;
import com.smartehs.model.ProcessActivityProcess;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ProcessActivityMapper {

    // Form
    List<ProcessActivityForm> findAllForms(@Param("offset") int offset, @Param("limit") int limit);
    int countAllForms();
    ProcessActivityForm findFormById(@Param("id") Long id);
    void insertForm(ProcessActivityForm form);
    void updateForm(ProcessActivityForm form);
    void deleteForm(@Param("id") Long id);

    // Process
    List<ProcessActivityProcess> findProcessesByFormId(@Param("formId") Long formId);
    void insertProcess(ProcessActivityProcess process);
    void deleteProcessesByFormId(@Param("formId") Long formId);

    // Item
    List<ProcessActivityItem> findItemsByProcessIds(@Param("processIds") List<Long> processIds);
    void insertItem(ProcessActivityItem item);
    void deleteItemsByProcessIds(@Param("processIds") List<Long> processIds);
    void deleteItemsByFormId(@Param("formId") Long formId);
}

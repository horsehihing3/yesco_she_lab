package com.smartehs.service;

import com.smartehs.dto.response.CompanyTreeNodeResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmGroup;
import com.smartehs.model.IdmUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IdmService {

    private final IdmMapper idmMapper;

    /**
     * T_IDM_GROUP 만으로 조직 트리를 구성한다. T_IDM_COMPANY 는 사용하지 않는다.
     *  - 루트: UpperGroupCode 가 null/blank 거나, 부모 GroupCode 가 로드된 그룹 집합에 없는 그룹
     *  - 사용자: DeptCode ↔ GroupCode 로 attach (회사 경계 무시, 전역 매핑)
     */
    public List<CompanyTreeNodeResponse> getCompanyTree() {
        List<IdmGroup> groups = idmMapper.findActiveGroups();
        List<IdmUser> users = idmMapper.findActiveEmployees();

        // 부서별 사용자 분류 (전역)
        Map<String, List<IdmUser>> usersByDept = users.stream()
                .filter(u -> u.getDeptCode() != null && !u.getDeptCode().isBlank())
                .collect(Collectors.groupingBy(IdmUser::getDeptCode));

        // 로드된 GroupCode 집합 — 부모가 이 안에 없으면 사실상 루트
        Set<String> loadedGroupCodes = groups.stream()
                .map(IdmGroup::getGroupCode)
                .collect(Collectors.toSet());

        // 루트 그룹 식별
        List<IdmGroup> rootGroups = groups.stream()
                .filter(g -> g.getUpperGroupCode() == null
                          || g.getUpperGroupCode().isBlank()
                          || !loadedGroupCodes.contains(g.getUpperGroupCode()))
                .collect(Collectors.toList());

        List<CompanyTreeNodeResponse> tree = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        for (IdmGroup root : rootGroups) {
            tree.add(buildGroupNode(root, groups, usersByDept, root.getGroupName(), visited));
        }

        return tree;
    }

    private CompanyTreeNodeResponse buildGroupNode(
            IdmGroup group,
            List<IdmGroup> allGroups,
            Map<String, List<IdmUser>> usersByDept,
            String rootLabel,
            Set<String> visited
    ) {
        visited.add(group.getGroupCode());
        List<CompanyTreeNodeResponse> children = new ArrayList<>();

        // 자식 그룹 재귀 (순환 참조 방지)
        List<IdmGroup> childGroups = allGroups.stream()
                .filter(g -> group.getGroupCode().equals(g.getUpperGroupCode())
                        && !visited.contains(g.getGroupCode()))
                .collect(Collectors.toList());

        for (IdmGroup childGroup : childGroups) {
            children.add(buildGroupNode(childGroup, allGroups, usersByDept, rootLabel, visited));
        }

        // 이 그룹에 속한 사용자 추가 (DeptCode == GroupCode)
        List<IdmUser> deptUsers = usersByDept.getOrDefault(group.getGroupCode(), List.of());
        for (IdmUser user : deptUsers) {
            children.add(CompanyTreeNodeResponse.builder()
                    .nodeId("user-" + user.getUidNumber())
                    .type("USER")
                    .label(user.getUserName())
                    .userId(user.getUidNumber())
                    .username(user.getUid())
                    .email(user.getEmail())
                    .name(user.getUserName())
                    .department(group.getGroupName())
                    .company(rootLabel)
                    .phone(user.getMobile())
                    .children(List.of())
                    .build());
        }

        return CompanyTreeNodeResponse.builder()
                .nodeId("group-" + group.getCompanyCode() + "-" + group.getGroupCode())
                .type("GROUP")
                .label(group.getGroupName())
                .children(children)
                .build();
    }

}

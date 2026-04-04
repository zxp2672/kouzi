// 数据权限控制工具函数
// 实现上级机关可以查看管理下级数据，同级不能互相查看的权限控制逻辑

interface Organization {
  id: number;
  code: string;
  name: string;
  type: string;
  level: number;
  parent_id: number | null;
  path: string | null;
  children?: Organization[];
}

interface User {
  id: number;
  organization_id: number | null;
}

/**
 * 获取用户可访问的所有组织ID列表（包含下级组织）
 * @param userOrgId 用户所属的组织ID
 * @param allOrganizations 完整的组织列表
 * @returns 可访问的组织ID数组
 */
export function getAccessibleOrganizationIds(
  userOrgId: number | null,
  allOrganizations: Organization[]
): number[] {
  if (!userOrgId) {
    return [];
  }

  // 首先找到用户的组织
  const userOrg = allOrganizations.find(org => org.id === userOrgId);
  if (!userOrg) {
    return [userOrgId];
  }

  // 使用path字段查询所有下级组织
  // path格式: "1.2.3"，表示该组织的所有上级ID
  const accessibleIds: number[] = [userOrgId];

  // 查找所有下级组织
  const findChildren = (orgs: Organization[]) => {
    for (const org of orgs) {
      // 检查该组织的path是否以用户组织的path开头，或者parent_id是用户组织的ID
      if (org.parent_id === userOrgId) {
        accessibleIds.push(org.id);
        // 递归查找该组织的下级
        findChildrenInFlatList(org.id, allOrganizations, accessibleIds);
      } else if (userOrg.path && org.path?.startsWith(`${userOrg.path}.`)) {
        accessibleIds.push(org.id);
      }
    }
  };

  // 在扁平化列表中查找所有下级
  const findChildrenInFlatList = (
    parentId: number,
    orgs: Organization[],
    result: number[]
  ) => {
    for (const org of orgs) {
      if (org.parent_id === parentId) {
        result.push(org.id);
        findChildrenInFlatList(org.id, orgs, result);
      }
    }
  };

  // 查找直接下级
  findChildrenInFlatList(userOrgId, allOrganizations, accessibleIds);

  // 去重并返回
  return [...new Set(accessibleIds)];
}

/**
 * 检查用户是否可以访问某个组织的数据
 * @param userOrgId 用户所属的组织ID
 * @param targetOrgId 目标组织ID
 * @param allOrganizations 完整的组织列表
 * @returns 是否可以访问
 */
export function canAccessOrganization(
  userOrgId: number | null,
  targetOrgId: number | null,
  allOrganizations: Organization[]
): boolean {
  if (!userOrgId || !targetOrgId) {
    return false;
  }

  // 如果是同一个组织，可以访问
  if (userOrgId === targetOrgId) {
    return true;
  }

  // 获取可访问的组织列表并检查
  const accessibleIds = getAccessibleOrganizationIds(userOrgId, allOrganizations);
  return accessibleIds.includes(targetOrgId);
}

/**
 * 过滤数据，只返回用户可访问的组织相关数据
 * @param data 要过滤的数据数组
 * @param userOrgId 用户所属的组织ID
 * @param allOrganizations 完整的组织列表
 * @param getOrgIdFn 从数据项中获取组织ID的函数
 * @returns 过滤后的数据
 */
export function filterDataByPermission<T>(
  data: T[],
  userOrgId: number | null,
  allOrganizations: Organization[],
  getOrgIdFn: (item: T) => number | null
): T[] {
  const accessibleIds = getAccessibleOrganizationIds(userOrgId, allOrganizations);
  
  if (accessibleIds.length === 0) {
    return [];
  }

  return data.filter(item => {
    const itemOrgId = getOrgIdFn(item);
    return itemOrgId !== null && accessibleIds.includes(itemOrgId);
  });
}

/**
 * 构建组织树结构
 * @param flatList 扁平化的组织列表
 * @returns 树状结构的组织列表
 */
export function buildOrganizationTree(flatList: Organization[]): Organization[] {
  const map = new Map<number, Organization>();
  const roots: Organization[] = [];

  // 首先创建所有节点
  flatList.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  // 构建树
  flatList.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(item.parent_id);
      if (parent) {
        parent.children?.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
}

/**
 * 获取组织的层级路径名称
 * @param orgId 组织ID
 * @param allOrganizations 完整的组织列表
 * @returns 层级路径名称，如"公安局机关/公安处机关/所队"
 */
export function getOrganizationPathName(
  orgId: number,
  allOrganizations: Organization[]
): string {
  const org = allOrganizations.find(o => o.id === orgId);
  if (!org) {
    return '';
  }

  const path: string[] = [org.name];
  let current = org;

  // 向上查找所有父组织
  while (current.parent_id !== null) {
    const parent = allOrganizations.find(o => o.id === current.parent_id);
    if (!parent) break;
    path.unshift(parent.name);
    current = parent;
  }

  return path.join(' / ');
}

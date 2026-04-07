import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

export interface ApprovalStep {
  id: number;
  name: string;
  order: number;
  required_role: string;
  description: string;
}

export interface ApprovalFlow {
  id: number;
  code: string;
  name: string;
  type: string;
  organization: string;
  steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ApprovalFlowFormData {
  code: string;
  name: string;
  type: string;
  organization?: string;
  steps?: ApprovalStep[];
  is_active?: boolean;
}

const DEFAULT_FLOWS: ApprovalFlow[] = [
  {
    id: 1,
    code: 'FLOW-IN-001',
    name: '市局入库审核流程',
    type: 'inbound',
    organization: 'gaj',
    is_active: true,
    steps: [
      { id: 1, name: '操作员提交', order: 1, required_role: 'operator', description: '操作员创建入库单' },
      { id: 2, name: '部门管理员审核', order: 2, required_role: 'manager', description: '部门管理员审核' },
      { id: 3, name: '系统管理员审批', order: 3, required_role: 'admin', description: '系统管理员最终审批' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'FLOW-OUT-001',
    name: '出库审核流程',
    type: 'outbound',
    organization: 'gac',
    is_active: true,
    steps: [
      { id: 1, name: '操作员提交', order: 1, required_role: 'operator', description: '操作员创建出库单' },
      { id: 2, name: '部门管理员审核', order: 2, required_role: 'manager', description: '部门管理员审核' },
    ],
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'approval_flows';

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

function getFlowsFromLocalStorage(): { flows: ApprovalFlow[]; nextId: number } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        flows: parsed.flows || DEFAULT_FLOWS,
        nextId: parsed.nextId || 3,
      };
    }
  } catch { /* ignore */ }
  return { flows: DEFAULT_FLOWS, nextId: 3 };
}

function saveFlowsToLocalStorage(flows: ApprovalFlow[], nextId: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ flows, nextId }));
  } catch { /* ignore */ }
}

/**
 * 获取所有审核流程
 */
export async function fetchApprovalFlows(): Promise<ApprovalFlow[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    return getFlowsFromLocalStorage().flows;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('approval_flows')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase 获取审核流程失败，降级 localStorage:', error);
      return getFlowsFromLocalStorage().flows;
    }

    const flows = data.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      code: row.code as string,
      name: row.name as string,
      type: row.type as string,
      organization: (row.organization as string) || '',
      steps: (row.steps as ApprovalStep[]) || [],
      is_active: row.is_active as boolean,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string | undefined,
    }));

    // 同步到 localStorage
    const maxId = flows.reduce((max: number, f: ApprovalFlow) => Math.max(max, f.id), 0);
    saveFlowsToLocalStorage(flows, maxId + 1);

    return flows;
  } catch (error) {
    console.warn('Supabase 不可用，使用 localStorage:', error);
    return getFlowsFromLocalStorage().flows;
  }
}

/**
 * 创建审核流程
 */
export async function createApprovalFlow(flow: ApprovalFlowFormData): Promise<ApprovalFlow> {
  const hasSupabase = await isSupabaseAvailable();
  const now = new Date().toISOString();

  const defaultSteps: ApprovalStep[] = flow.steps || [
    { id: 1, name: '操作员提交', order: 1, required_role: 'operator', description: '操作员创建单据' },
    { id: 2, name: '管理员审核', order: 2, required_role: 'manager', description: '管理员审核' },
  ];

  if (!hasSupabase) {
    const { flows, nextId } = getFlowsFromLocalStorage();
    const newFlow: ApprovalFlow = {
      id: nextId,
      code: flow.code,
      name: flow.name,
      type: flow.type,
      organization: flow.organization || '',
      steps: defaultSteps,
      is_active: flow.is_active !== undefined ? flow.is_active : true,
      created_at: now,
    };
    saveFlowsToLocalStorage([...flows, newFlow], nextId + 1);
    return newFlow;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('approval_flows')
      .insert({
        code: flow.code,
        name: flow.name,
        type: flow.type,
        organization: flow.organization || '',
        steps: defaultSteps,
        is_active: flow.is_active !== undefined ? flow.is_active : true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('Supabase 创建失败，降级 localStorage:', error);
      const { flows, nextId } = getFlowsFromLocalStorage();
      const newFlow: ApprovalFlow = {
        id: nextId,
        code: flow.code,
        name: flow.name,
        type: flow.type,
        organization: flow.organization || '',
        steps: defaultSteps,
        is_active: flow.is_active !== undefined ? flow.is_active : true,
        created_at: now,
      };
      saveFlowsToLocalStorage([...flows, newFlow], nextId + 1);
      return newFlow;
    }

    return data as ApprovalFlow;
  } catch (error) {
    console.warn('Supabase 不可用:', error);
    const { flows, nextId } = getFlowsFromLocalStorage();
    const newFlow: ApprovalFlow = {
      id: nextId,
      code: flow.code,
      name: flow.name,
      type: flow.type,
      organization: flow.organization || '',
      steps: defaultSteps,
      is_active: flow.is_active !== undefined ? flow.is_active : true,
      created_at: now,
    };
    saveFlowsToLocalStorage([...flows, newFlow], nextId + 1);
    return newFlow;
  }
}

/**
 * 更新审核流程
 */
export async function updateApprovalFlow(id: number, flow: ApprovalFlowFormData): Promise<ApprovalFlow> {
  const hasSupabase = await isSupabaseAvailable();
  const now = new Date().toISOString();

  if (!hasSupabase) {
    const { flows, nextId } = getFlowsFromLocalStorage();
    const updated = flows.map(f =>
      f.id === id ? { ...f, ...flow, organization: flow.organization || f.organization, updated_at: now } : f
    );
    saveFlowsToLocalStorage(updated, nextId);
    const result = updated.find(f => f.id === id);
    if (!result) throw new Error('Flow not found');
    return result;
  }

  try {
    const client = getSupabaseClient();
    const updateData: Record<string, unknown> = {
      code: flow.code,
      name: flow.name,
      type: flow.type,
      organization: flow.organization || '',
      is_active: flow.is_active,
      updated_at: now,
    };
    if (flow.steps) {
      updateData.steps = flow.steps;
    }

    const { data, error } = await client
      .from('approval_flows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('Supabase 更新失败，降级 localStorage:', error);
      const { flows, nextId } = getFlowsFromLocalStorage();
      const updated = flows.map(f =>
        f.id === id ? { ...f, ...flow, organization: flow.organization || f.organization, updated_at: now } : f
      );
      saveFlowsToLocalStorage(updated, nextId);
      const result = updated.find(f => f.id === id);
      if (!result) throw new Error('Flow not found');
      return result;
    }

    return data as ApprovalFlow;
  } catch (error) {
    console.warn('Supabase 不可用:', error);
    const { flows, nextId } = getFlowsFromLocalStorage();
    const updated = flows.map(f =>
      f.id === id ? { ...f, ...flow, organization: flow.organization || f.organization, updated_at: now } : f
    );
    saveFlowsToLocalStorage(updated, nextId);
    const result = updated.find(f => f.id === id);
    if (!result) throw new Error('Flow not found');
    return result;
  }
}

/**
 * 删除审核流程
 */
export async function deleteApprovalFlow(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const { flows, nextId } = getFlowsFromLocalStorage();
    saveFlowsToLocalStorage(flows.filter(f => f.id !== id), nextId);
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('approval_flows')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase 删除失败，降级 localStorage:', error);
      const { flows, nextId } = getFlowsFromLocalStorage();
      saveFlowsToLocalStorage(flows.filter(f => f.id !== id), nextId);
    }
  } catch (error) {
    console.warn('Supabase 不可用:', error);
    const { flows, nextId } = getFlowsFromLocalStorage();
    saveFlowsToLocalStorage(flows.filter(f => f.id !== id), nextId);
  }
}

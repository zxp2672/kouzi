'use client';

import { useState } from 'react';
import { Building2, Users, Shield, FileSpreadsheet, Workflow, Landmark, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WarehouseManagement from './warehouses/page';
import UserManagement from './users/page';
import RoleManagement from './roles/page';
import ApprovalFlowManagement from './approval-flows/page';
import OrganizationManagement from './organizations/page';
import SystemConfig from './system-config/page';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system-config');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground mt-2">管理系统配置、组织架构、用户、角色和审核流程</p>
      </div>

      <Tabs defaultValue="system-config" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system-config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            系统配置
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            组织架构
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            仓库管理
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            角色权限
          </TabsTrigger>
          <TabsTrigger value="approval-flows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            审核流程
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system-config" className="mt-6">
          <SystemConfig />
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationManagement />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-6">
          <WarehouseManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="approval-flows" className="mt-6">
          <ApprovalFlowManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

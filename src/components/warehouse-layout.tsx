'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  ArrowLeftRight,
  FileCheck,
  Settings,
  Menu,
  X,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import ApprovalTodoBadge from '@/components/approval-todo-badge';

const navigation = [
  { name: '库存看板', href: '/', icon: LayoutDashboard },
  { name: '商品管理', href: '/products', icon: Package },
  { name: '入库管理', href: '/inbound', icon: ArrowDownToLine },
  { name: '出库管理', href: '/outbound', icon: ArrowUpFromLine },
  { name: '库存盘点', href: '/stock-count', icon: ClipboardCheck },
  { name: '库存调拨', href: '/transfer', icon: ArrowLeftRight },
  { name: '审核中心', href: '/approvals', icon: FileCheck },
];

interface LayoutProps {
  children: React.ReactNode;
}

const DEFAULT_CONFIG = {
  unit_name: 'XX市公安局',
  unit_logo_url: '',
  system_title: '库房管理系统',
  copyright_text: '© 2024 XX市公安局 版权所有',
};

export default function WarehouseLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const config = DEFAULT_CONFIG;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 border-r border-blue-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo 和单位名称 */}
          <div className="flex h-20 flex-col items-center justify-center border-b border-blue-200 dark:border-gray-700 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
            {config.unit_logo_url && (
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-md">
                <img
                  src={config.unit_logo_url}
                  alt="Logo"
                  className="w-7 h-7 object-contain"
                />
              </div>
            )}
            <h1 className="text-lg font-bold text-white text-center leading-tight">
              {config.unit_name}
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              {config.system_title}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 lg:hidden text-white hover:bg-white/20"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 底部设置 */}
          <div className="border-t border-blue-200 dark:border-gray-700 p-4">
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                pathname === '/settings'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-700 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="h-5 w-5" />
              系统设置
            </Link>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="flex h-16 items-center justify-between border-b border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-blue-600" />
          </Button>
          
          {/* 顶部单位标识 */}
          <div className="flex items-center gap-3">
            {config.unit_logo_url && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <img
                  src={config.unit_logo_url}
                  alt="Logo"
                  className="w-5 h-5 object-contain"
                />
              </div>
            )}
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {config.unit_name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {config.system_title}
              </p>
            </div>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <ApprovalTodoBadge />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              v1.0
            </span>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800">
          {children}
        </main>
        
        {/* 页脚 */}
        <footer className="border-t border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 lg:px-6">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {config.copyright_text}
          </p>
        </footer>
      </div>
    </div>
  );
}

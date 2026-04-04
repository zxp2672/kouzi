'use client';

import Link from 'next/link';
import { Bell, FileCheck, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useApprovalTodo } from '@/hooks/use-approval-todo';

export function ApprovalTodoBadge() {
  const { stats, loading } = useApprovalTodo();

  if (loading || stats.total === 0) {
    return (
      <Link href="/approvals">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Link href="/approvals">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-red-600" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
            >
              {stats.total > 99 ? '99+' : stats.total}
            </Badge>
          </Button>
        </Link>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-red-600" />
              审核待办
            </h3>
            <span className="text-sm text-muted-foreground">
              共 {stats.total} 条待审核
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/approvals" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">入库单</span>
                </div>
                {stats.inbound > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                    {stats.inbound}
                  </Badge>
                )}
              </div>
            </Link>
            <Link href="/approvals" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">出库单</span>
                </div>
                {stats.outbound > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                    {stats.outbound}
                  </Badge>
                )}
              </div>
            </Link>
            <Link href="/approvals" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">盘点单</span>
                </div>
                {stats.stockCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                    {stats.stockCount}
                  </Badge>
                )}
              </div>
            </Link>
            <Link href="/approvals" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">调拨单</span>
                </div>
                {stats.transfer > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                    {stats.transfer}
                  </Badge>
                )}
              </div>
            </Link>
          </div>
          <div className="pt-2 border-t">
            <Link href="/approvals">
              <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                查看全部审核
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ApprovalTodoBadge;

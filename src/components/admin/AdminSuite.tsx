import React from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminTransactions } from './AdminTransactions';
import { AdminProducts } from './AdminProducts';
import { AdminPricing } from './AdminPricing';
import { AdminVtuProviders } from './AdminVtuProviders';
import { AdminPaystack } from './AdminPaystack';
import { AdminCms } from './AdminCms';
import { AdminDisputes } from './AdminDisputes';
import { AdminNotifications } from './AdminNotifications';
import { AdminRoles } from './AdminRoles';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminReports } from './AdminReports';
import { AdminSettings } from './AdminSettings';

interface AdminSuiteProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
}

export const AdminSuite: React.FC<AdminSuiteProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
}) => {
  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={onSelectTab}
      onExitAdmin={onExitAdmin}
    >
      {currentTab === 'overview' && <AdminOverview onNavigateTab={onSelectTab} />}
      {currentTab === 'users' && <AdminUsers />}
      {currentTab === 'transactions' && <AdminTransactions />}
      {currentTab === 'products' && <AdminProducts />}
      {currentTab === 'pricing' && <AdminPricing />}
      {currentTab === 'vtu-providers' && <AdminVtuProviders />}
      {currentTab === 'paystack' && <AdminPaystack />}
      {currentTab === 'cms' && <AdminCms />}
      {currentTab === 'disputes' && <AdminDisputes />}
      {currentTab === 'notifications' && <AdminNotifications />}
      {currentTab === 'roles' && <AdminRoles />}
      {currentTab === 'audit-logs' && <AdminAuditLogs />}
      {currentTab === 'reports' && <AdminReports />}
      {currentTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
};

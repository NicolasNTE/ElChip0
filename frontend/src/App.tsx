import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CompaniesPage } from './pages/companies/CompaniesPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { AttendanceImportPage } from './pages/attendance/AttendanceImportPage';
import { AttendanceListPage } from './pages/attendance/AttendanceListPage';
import { JustificationsListPage } from './pages/justifications/JustificationsListPage';
import { JustificationCreatePage } from './pages/justifications/JustificationCreatePage';
import { JustificationDetailPage } from './pages/justifications/JustificationDetailPage';
import { PayrollReportPage } from './pages/reports/PayrollReportPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/attendance/import" element={<AttendanceImportPage />} />
          <Route path="/attendance" element={<AttendanceListPage />} />
          <Route path="/justifications" element={<JustificationsListPage />} />
          <Route path="/justifications/new" element={<JustificationCreatePage />} />
          <Route path="/justifications/:id" element={<JustificationDetailPage />} />
          <Route path="/reports/payroll" element={<PayrollReportPage />} />
        </Route>
      </Route>
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

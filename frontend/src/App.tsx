import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import CreateRequestPage from "./pages/CreateRequestPage";
import DashboardPage from "./pages/DashboardPage";
import JobDetailPage from "./pages/JobDetailPage";
import JobsPage from "./pages/JobsPage";
import ReportPage from "./pages/ReportPage";
import RequestDetailPage from "./pages/RequestDetailPage";
import RequestsListPage from "./pages/RequestsListPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="requests" element={<RequestsListPage />} />
        <Route path="requests/new" element={<CreateRequestPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="reports/:requestId" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

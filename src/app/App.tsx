import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../auth/LoginPage";
import RegisterPage from "../auth/RegisterPage";
import RequireAuth from "./RequireAuth";
import AppShell from "./AppShell";
import FundsPage from "../funds/FundsPage";
import FundLayout from "../funds/FundLayout";
import FundOverviewPage from "../funds/FundOverviewPage";
import MembersPage from "../members/MembersPage";
import MemberWalletPage from "../members/MemberWalletPage";
import BankPage from "../bank/BankPage";

// Route map (ADR 0006): /login is public; everything else is protected and rendered inside
// the app shell. Fund-scoped routes (/funds/:fundId/...) get added under here in later phases.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<FundsPage />} />
          {/* Fund-scoped routes carry the fund id in the URL (ADR 0006). Sections
              (overview, members, loans, …) are children of the fund layout. */}
          <Route path="/funds/:fundId" element={<FundLayout />}>
            <Route index element={<FundOverviewPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="members/:memberId/wallet" element={<MemberWalletPage />} />
            <Route path="bank" element={<BankPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

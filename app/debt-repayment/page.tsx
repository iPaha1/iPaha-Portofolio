// app/debt-repayment/page.tsx
import { currentUser }       from "@clerk/nextjs/server";
import { isAllowedEmail }    from "@/lib/debt/constants";
import { AccessRestricted } from "./_debt-repayment/access-restricted";
import { DebtDashboard } from "./_debt-repayment/debt-dashboard";

export const metadata = { title: "Debt Repayment Ledger · Private" };

export default async function DebtRepaymentPage() {
  const user         = await currentUser();
  const primaryEmail = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!user || !isAllowedEmail(primaryEmail)) {
    return <AccessRestricted />;
  }

  return <DebtDashboard currentUserEmail={primaryEmail!.toLowerCase()} />;
}
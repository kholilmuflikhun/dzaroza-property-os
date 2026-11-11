import { describe, expect, it } from "vitest";
import {
  authorizedExpenseWhere,
  authorizedInvoiceWhere,
  authorizedPaymentWhere,
} from "./finance-access-query";

const actor = (role: string) => ({ id: "member-a", organizationId: "org-a", role });
const assignment = {
  assignments: { some: {
    organizationId: "org-a",
    membershipId: "member-a",
    assignmentRole: "PROJECT_MANAGER",
    status: "ACTIVE",
  } },
};

describe("finance read query scopes", () => {
  it("allows Owner, Admin, and Finance to read all tenant financial records", () => {
    for (const role of ["OWNER", "ADMIN", "FINANCE"]) {
      expect(authorizedInvoiceWhere(actor(role))).toEqual({ organizationId: "org-a" });
      expect(authorizedPaymentWhere(actor(role))).toEqual({ organizationId: "org-a", invoiceId: { not: null } });
      expect(authorizedExpenseWhere(actor(role))).toEqual({ organizationId: "org-a" });
    }
  });

  it("limits Project Manager invoices and payments to active assigned projects", () => {
    expect(authorizedInvoiceWhere(actor("PROJECT_MANAGER"))).toEqual({
      organizationId: "org-a", project: assignment,
    });
    expect(authorizedPaymentWhere(actor("PROJECT_MANAGER"))).toEqual({
      organizationId: "org-a", invoiceId: { not: null }, invoice: { project: assignment },
    });
  });

  it("limits Project Manager expenses to active assigned projects", () => {
    expect(authorizedExpenseWhere(actor("PROJECT_MANAGER"))).toEqual({
      organizationId: "org-a", project: assignment,
    });
  });
});

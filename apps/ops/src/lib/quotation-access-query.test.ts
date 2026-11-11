import { describe, expect, it } from "vitest";
import { authorizedQuotationWhere } from "./quotation-access-query";

const actor = (role: string) => ({ id: "member-a", organizationId: "org-a", role });

describe("authorized quotation scopes", () => {
  it("allows Owner, Admin, and Finance organization-wide read access", () => {
    for (const role of ["OWNER", "ADMIN", "FINANCE"]) {
      expect(authorizedQuotationWhere(actor(role))).toEqual({ organizationId: "org-a" });
    }
  });

  it("limits Project Managers to quotations attached to their active managed projects", () => {
    expect(authorizedQuotationWhere(actor("PROJECT_MANAGER"))).toEqual({
      organizationId: "org-a",
      project: { assignments: { some: {
        organizationId: "org-a", membershipId: "member-a",
        assignmentRole: "PROJECT_MANAGER", status: "ACTIVE",
      } } },
    });
  });

  it("limits Sales to quotations for clients with an active Sales grant", () => {
    expect(authorizedQuotationWhere(actor("SALES"))).toEqual({
      organizationId: "org-a",
      client: { salesAccesses: { some: {
        organizationId: "org-a", membershipId: "member-a", status: "ACTIVE",
      } } },
    });
  });

  it("denies Staff and Client quotation listing", () => {
    for (const role of ["STAFF", "CLIENT", "UNKNOWN"]) {
      expect(authorizedQuotationWhere(actor(role))).toEqual({
        organizationId: "org-a", id: "__no_quotation_access__",
      });
    }
  });
});

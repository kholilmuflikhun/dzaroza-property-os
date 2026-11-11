import { describe, expect, it } from "vitest";
import { authorizedClientWhere } from "./client-access-query";

const actor = (role: string) => ({ id: "member-a", organizationId: "org-a", role });

describe("authorized client list scopes", () => {
  it("allows Owner, Admin, and Finance to read tenant clients", () => {
    for (const role of ["OWNER", "ADMIN", "FINANCE"]) {
      expect(authorizedClientWhere(actor(role))).toEqual({ organizationId: "org-a" });
    }
  });

  it("limits Project Managers to clients with an active managed project", () => {
    expect(authorizedClientWhere(actor("PROJECT_MANAGER"))).toEqual({
      organizationId: "org-a",
      projects: { some: { assignments: { some: {
        organizationId: "org-a", membershipId: "member-a",
        assignmentRole: "PROJECT_MANAGER", status: "ACTIVE",
      } } } },
    });
  });

  it("limits Staff to clients on projects assigned as contributor or viewer", () => {
    expect(authorizedClientWhere(actor("STAFF"))).toEqual({
      organizationId: "org-a",
      projects: { some: { assignments: { some: {
        organizationId: "org-a", membershipId: "member-a",
        assignmentRole: { in: ["CONTRIBUTOR", "VIEWER"] }, status: "ACTIVE",
      } } } },
    });
  });

  it("requires active Sales and Client Portal grants", () => {
    expect(authorizedClientWhere(actor("SALES"))).toEqual({
      organizationId: "org-a",
      salesAccesses: { some: { organizationId: "org-a", membershipId: "member-a", status: "ACTIVE" } },
    });
    expect(authorizedClientWhere(actor("CLIENT"))).toEqual({
      organizationId: "org-a",
      portalAccesses: { some: { organizationId: "org-a", membershipId: "member-a", status: "ACTIVE" } },
    });
  });

  it("returns an empty identifier scope for unknown roles", () => {
    expect(authorizedClientWhere(actor("UNKNOWN"))).toEqual({
      organizationId: "org-a", id: "__no_client_access__",
    });
  });
});

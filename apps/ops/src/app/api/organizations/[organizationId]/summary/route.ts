import { NextResponse } from "next/server";
import { prisma } from "@dzaroza/database";
import { requireTenantRole, toHttpError } from "@/lib/tenant";
import { MembershipRole } from "@dzaroza/database";
import { authorizedClientWhere } from "@/lib/client-access-query";
import { authorizedInvoiceWhere } from "@/lib/finance-access-query";
import { authorizedProjectWhere } from "@/lib/project-access-query";
import { ForbiddenError } from "@/lib/errors";

export async function GET(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  try {
    const { organizationId } = await context.params;
    if (!organizationId || organizationId.length > 64) throw new ForbiddenError();
    const membership = await requireTenantRole(organizationId, [
      MembershipRole.OWNER,
      MembershipRole.ADMIN,
      MembershipRole.FINANCE,
      MembershipRole.PROJECT_MANAGER,
    ]);
    const [clients, leads, projects, openInvoices] = await Promise.all([
      prisma.client.count({ where: authorizedClientWhere(membership) }),
      membership.role === MembershipRole.OWNER || membership.role === MembershipRole.ADMIN
        ? prisma.lead.count({ where: { organizationId } })
        : Promise.resolve(0),
      prisma.project.count({ where: authorizedProjectWhere(membership) }),
      prisma.invoice.count({ where: { ...authorizedInvoiceWhere(membership), status: { notIn: ["PAID", "VOID"] } } }),
    ]);
    return NextResponse.json({ organizationId: membership.organizationId, counts: { clients, leads, projects, openInvoices } });
  } catch (error) {
    const result = toHttpError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}

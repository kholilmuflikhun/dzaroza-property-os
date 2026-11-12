import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@dzaroza/database";
import { requireFinanceRead, requireTenantContext, toHttpError } from "@/lib/tenant";
import { authorizedInvoiceWhere } from "@/lib/finance-access-query";
import { authorizedQuotationWhere } from "@/lib/quotation-access-query";

export async function GET(_request: NextRequest, context: { params: Promise<{ organizationId: string; entityType: string; entityId: string }> }) {
  try {
    const { organizationId, entityType, entityId } = await context.params;
    if (!organizationId || organizationId.length > 64 || !entityId || entityId.length > 64 || !["invoice", "quotation"].includes(entityType)) {
      return NextResponse.json({ error: "Parameter aktivitas tidak valid." }, { status: 400 });
    }

    if (entityType === "invoice") {
      const actor = await requireFinanceRead(organizationId);
      const invoice = await prisma.invoice.findFirst({
        where: { ...authorizedInvoiceWhere(actor), id: entityId },
        select: { id: true },
      });
      if (!invoice) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
    } else {
      const actor = await requireTenantContext(organizationId);
      const quotation = await prisma.quotation.findFirst({
        where: { ...authorizedQuotationWhere(actor), id: entityId },
        select: { id: true },
      });
      if (!quotation) return NextResponse.json({ error: "Quotation tidak ditemukan." }, { status: 404 });
    }

    const activities = await prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: entityType === "invoice" ? "Invoice" : "Quotation",
        entityId,
      },
      select: {
        id: true,
        action: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ activities });
  } catch (error) {
    const result = toHttpError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}

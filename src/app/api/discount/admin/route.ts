import { NextRequest, NextResponse } from "next/server";
import DiscountCode from "@/src/app/models/Discount";
import dbConnect from "@/src/app/lib/dbconnect";

// ── GET: list all codes ───────────────────────────────────────────────────────
export async function GET() {
  try {
    await dbConnect();
    const codes = await DiscountCode.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ codes });
  } catch (error) {
    console.error("GET discount codes error:", error);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

// ── POST: create a new code ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { code, discountType, discountValue, expiresAt, createdBy } = body;

    if (!code || !discountType || discountValue == null) {
      return NextResponse.json(
        { error: "Missing required fields: code, discountType, discountValue" },
        { status: 400 }
      );
    }

    const newCode = await DiscountCode.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      ...(createdBy && { createdBy: createdBy.trim() }),
    });

    return NextResponse.json({ success: true, code: newCode });
  } catch (err: any) {
    console.error("POST discount error:", err);

    if (err.code === 11000) {
      return NextResponse.json({ error: "Code already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── DELETE: delete a code by ID ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await DiscountCode.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE discount error:", error);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}
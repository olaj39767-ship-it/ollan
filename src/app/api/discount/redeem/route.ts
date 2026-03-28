// app/api/discount/redeem/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/src/app/lib/dbconnect";
import DiscountCode from "@/src/app/models/Discount";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { code, usedBy } = await req.json(); // usedBy = email or orderId

    if (!code) {
      return NextResponse.json({ success: false, message: "No code." }, { status: 400 });
    }

    const doc = await DiscountCode.findOne({ code: code.trim().toUpperCase() });

    if (!doc || doc.isUsed) {
      return NextResponse.json({ success: false, message: "Code unavailable." }, { status: 400 });
    }

    // Atomically mark as used — prevents race conditions
    const updated = await DiscountCode.findOneAndUpdate(
      { _id: doc._id, isUsed: false }, // only update if still unused
      { isUsed: true, usedBy: usedBy || "unknown", usedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Code was just used by someone else." }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Discount redeem error:", err);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
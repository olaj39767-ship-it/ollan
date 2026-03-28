// app/api/discount/validate/route.ts  (Next.js App Router)
// OR pages/api/discount/validate.ts  (Pages Router — see bottom of file)

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/src/app/lib/dbconnect";
import DiscountCode from "@/src/app/models/Discount";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, message: "No code provided." }, { status: 400 });
    }

    const doc = await DiscountCode.findOne({ code: code.trim().toUpperCase() });

    if (!doc) {
      return NextResponse.json({ valid: false, message: "Invalid discount code." }, { status: 200 });
    }

    if (doc.isUsed) {
      return NextResponse.json({ valid: false, message: "This code has already been used." }, { status: 200 });
    }

    if (doc.expiresAt && new Date() > doc.expiresAt) {
      return NextResponse.json({ valid: false, message: "This code has expired." }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      discountType: doc.discountType,
      discountValue: doc.discountValue,
      message: `Code applied! ${doc.discountType === "percent" ? `${doc.discountValue}% off` : `₦${doc.discountValue} off`}`,
    });
  } catch (err) {
    console.error("Discount validate error:", err);
    return NextResponse.json({ valid: false, message: "Server error." }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// If you're using the Pages Router instead, use this:
// ──────────────────────────────────────────────────────────────────────────────
/*
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import DiscountCode from "@/models/DiscountCode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();

  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: "No code provided." });

  const doc = await DiscountCode.findOne({ code: code.trim().toUpperCase() });
  if (!doc) return res.json({ valid: false, message: "Invalid discount code." });
  if (doc.isUsed) return res.json({ valid: false, message: "This code has already been used." });
  if (doc.expiresAt && new Date() > doc.expiresAt)
    return res.json({ valid: false, message: "This code has expired." });

  return res.json({
    valid: true,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    message: `Code applied! ${doc.discountType === "percent" ? `${doc.discountValue}% off` : `₦${doc.discountValue} off`}`,
  });
}
*/
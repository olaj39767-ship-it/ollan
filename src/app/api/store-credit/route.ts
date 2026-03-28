// src/app/api/store-credit/route.ts

import { NextRequest, NextResponse } from "next/server";
import User from "@/src/app/models/User";
import dbConnect from "@/src/app/lib/dbconnect";

// GET: Return all users that have store credit record in Next.js DB
export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({})
      .select("_id name email storeCredit")
      .lean();

    return NextResponse.json(users);   // ← Return array directly (easier to handle)
  } catch (error) {
    console.error("GET store-credit error:", error);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}

// POST: Create user if not exists + add credit
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { userId, email, name = "", amount, reason = "admin_gift" } = await req.json();

    if (!userId || !email || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "userId, email and amount (>0) required" }, { status: 400 });
    }

    let user = await User.findOne({ _id: userId });

    if (!user) {
      user = await User.create({
        _id: userId,
        email,
        name,
        storeCredit: 0,
      });
    }

    const previous = user.storeCredit || 0;
    user.storeCredit = previous + Number(amount);
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Added ₦${amount} store credit`,
      newBalance: user.storeCredit,
    });
  } catch (error: any) {
    console.error("POST store-credit error:", error);
    return NextResponse.json({ error: "Failed to add store credit" }, { status: 500 });
  }
}
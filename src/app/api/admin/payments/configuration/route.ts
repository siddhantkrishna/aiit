import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { configurationOptions, configure } from "@/lib/fees/admin";
export async function GET(req:NextRequest) { try { adminIdentity(req); return NextResponse.json(await configurationOptions()); } catch(error) { return feeResponse(error); } }
export async function POST(req:NextRequest) { try { sameOrigin(req); return NextResponse.json(await configure(adminIdentity(req),await req.json())); } catch(error) { return feeResponse(error); } }
export const dynamic="force-dynamic";

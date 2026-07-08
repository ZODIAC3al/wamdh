import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const apkUrl = "https://expo.dev/artifacts/eas/GpD16Jryb-eGcXaHONO-Y0llugFfmp1GPzlcX0HN5Mk.apk";
    
    // Redirect to the direct EAS production APK URL on Expo CDN
    return NextResponse.redirect(apkUrl, 307);
  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse("Download failed", { status: 500 });
  }
}


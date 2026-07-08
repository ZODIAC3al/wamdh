import { existsSync, readFileSync } from "fs";
import { NextResponse } from "next/server";
import { join } from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Path to the APK file in the public folder
    const filePath = join(process.cwd(), "public", "downloads", "wamdh.apk");

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error("APK file not found at:", filePath);
      return new NextResponse("File not found", { status: 404 });
    }

    // Read the file into memory
    const fileBuffer = readFileSync(filePath);

    // Return the file with proper headers for download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="wamdh.apk"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse("Download failed", { status: 500 });
  }
}

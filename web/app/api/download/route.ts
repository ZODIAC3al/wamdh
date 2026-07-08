import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { join } from "path";

export async function GET() {
  try {
    // Path to the APK file in the public folder
    const filePath = join(process.cwd(), "public", "downloads", "wamdh.apk");

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error("APK file not found at:", filePath);
      return NextResponse.json(
        { error: "APK file not found" },
        { status: 404 },
      );
    }

    // Get file stats
    const fileStats = await stat(filePath);

    // Create readable stream for large files
    const fileStream = createReadStream(filePath);

    // Return the file with proper headers for download
    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="wamdh.apk"',
        "Cache-Control": "public, max-age=86400",
        "Content-Length": fileStats.size.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download APK", details: String(error) },
      { status: 500 },
    );
  }
}

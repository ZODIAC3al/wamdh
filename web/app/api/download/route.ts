import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_EAS_URL = "https://expo.dev/artifacts/eas/GpD16Jryb-eGcXaHONO-Y0llugFfmp1GPzlcX0HN5Mk.apk";

export async function GET(req: NextRequest) {
  try {
    const localApkPath = path.join(process.cwd(), "public", "downloads", "wamdh.apk");

    if (fs.existsSync(localApkPath)) {
      const stat = fs.statSync(localApkPath);
      const fileSize = stat.size;
      const range = req.headers.get("range");

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        const fileStream = fs.createReadStream(localApkPath, { start, end });
        // Convert Node stream to Web ReadableStream
        const stream = new ReadableStream({
          start(controller) {
            fileStream.on("data", (chunk) => controller.enqueue(chunk));
            fileStream.on("end", () => controller.close());
            fileStream.on("error", (err) => controller.error(err));
          },
          cancel() {
            fileStream.destroy();
          },
        });

        return new NextResponse(stream as unknown as BodyInit, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize.toString(),
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Disposition": 'attachment; filename="wamdh.apk"',
            "Cache-Control": "public, max-age=3600",
          },
        });
      } else {
        const fileStream = fs.createReadStream(localApkPath);
        const stream = new ReadableStream({
          start(controller) {
            fileStream.on("data", (chunk) => controller.enqueue(chunk));
            fileStream.on("end", () => controller.close());
            fileStream.on("error", (err) => controller.error(err));
          },
          cancel() {
            fileStream.destroy();
          },
        });

        return new NextResponse(stream as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Length": fileSize.toString(),
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Disposition": 'attachment; filename="wamdh.apk"',
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    // Proxy stream remote APK if local APK doesn't exist to guarantee valid MIME headers & avoid redirect drops
    const remoteRes = await fetch(FALLBACK_EAS_URL);
    if (!remoteRes.ok) {
      throw new Error(`Failed to fetch remote APK: ${remoteRes.statusText}`);
    }

    const contentLength = remoteRes.headers.get("content-length");
    const headers: Record<string, string> = {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="wamdh.apk"',
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new NextResponse(remoteRes.body as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("APK Download Route Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Download failed. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

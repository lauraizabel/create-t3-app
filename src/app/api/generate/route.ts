import JSZip from "jszip";
import { ProjectGenerator } from "@/generator/project-generator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const generator = new ProjectGenerator();
    const result = generator.generate(await request.json());
    const zip = new JSZip();
    const root = zip.folder(result.manifest.project.name)!;
    result.files.forEach((content, path) => root.file(path, content));
    const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const body = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;
    return new Response(body, {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${result.manifest.project.name}.zip"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project generation failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}

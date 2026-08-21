/**
 * Server-only report photo storage.
 *
 * Uploads into the private `report-images` bucket with the service-role client
 * (never reachable from the browser) and returns a long-lived signed URL that
 * the UI can render directly.
 */

const BUCKET = "report-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadReportImage(reportId: string, dataUrl: string): Promise<string | null> {
  const match = /^data:([a-z/+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1]!.toLowerCase();
  if (!ALLOWED.includes(contentType)) return null;

  const bytes = Uint8Array.from(atob(match[2]!), (char) => char.charCodeAt(0));
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;

  const extension = contentType.split("/")[1]!.replace("jpeg", "jpg");
  const path = `${reportId}/photo.${extension}`;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) {
    console.error("report image upload error", error.message);
    return null;
  }

  const { data } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

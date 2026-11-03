import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";

export const DOCUMENT_BUCKET = "documents";
const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf", "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx" };

export function storagePath(value: string): string {
  let path = value;
  if (/^https?:\/\//.test(value)) {
    const url = new URL(value);
    if (url.origin !== new URL(process.env.SUPABASE_URL!).origin) throw new Error("Unknown document storage origin");
    const prefix = `/storage/v1/object/public/${DOCUMENT_BUCKET}/`;
    if (!url.pathname.startsWith(prefix)) throw new Error("Unknown document bucket");
    path = decodeURIComponent(url.pathname.slice(prefix.length));
  }
  if (!path || path.startsWith("/") || path.split("/").some(part => part === ".." || part === ".") || /[\\\x00-\x1f?#]/.test(path)) throw new Error("Invalid document path");
  return path;
}

export async function requirePrivateBucket() {
  const { data, error } = await supabase.storage.getBucket(DOCUMENT_BUCKET);
  if (error || !data || data.public) throw new Error("Private document storage is not ready. Please contact AIIT.");
}

export async function validateUpload(file: File, imageOnly = false, allowOffice = false) {
  const officeFile = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type);
  if (officeFile && !allowOffice) throw new Error("Use JPG, PNG, WebP or PDF for admission documents.");
  if (!file.size || file.size > 3 * 1024 * 1024 || !types[file.type] || (imageOnly && !file.type.startsWith("image/"))) throw new Error("Files must be JPG, PNG, WebP or PDF and under 3MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid = file.type === "application/msword" ? bytes.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]))
    : file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))
    : file.type === "application/pdf" ? bytes.subarray(0, 5).toString() === "%PDF-"
    : file.type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!valid) throw new Error("File content does not match its type.");
  return bytes;
}

export async function uploadPrivateFile(folder: string, file: File, imageOnly = false, allowOffice = false) {
  const bytes = await validateUpload(file, imageOnly, allowOffice);
  const path = `${folder}/${randomUUID()}.${types[file.type]}`;
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) throw new Error("Document upload failed. Please try again.");
  return path;
}

// Call only after authorizing the application, student, or payment record.
export async function signDocument(value: string | null) {
  if (!value) return null;
  await requirePrivateBucket();
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(storagePath(value), 120);
  if (error) throw new Error("Unable to open document. Please reload and retry.");
  return data.signedUrl;
}

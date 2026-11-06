import { supabase } from "@/lib/supabase";

// Call only after checking the requesting administrator's session.
export async function signedDocumentUrl(stored: string | null) {
  if (!stored) return null;
  const prefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/`;
  if (!stored.startsWith(prefix)) throw new Error("Unsupported document storage reference");
  const objectPath = decodeURIComponent(stored.slice(prefix.length));
  if (!/^(applications|vacancies)\//.test(objectPath) || objectPath.split("/").includes("..") || objectPath.includes("\\")) throw new Error("Invalid document storage reference");
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(objectPath, 300);
  if (error || !data?.signedUrl) throw new Error("Document access is temporarily unavailable");
  return data.signedUrl;
}

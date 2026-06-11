/**
 * Browser-only API helpers: resolving the Supabase access token for backend
 * calls, and uploading a file straight to Supabase Storage via the signed
 * upload URL (the file never passes through the backend).
 */
"use client"

import { createClient } from "@/lib/supabase/client"

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "rfp-documents"

/** The current user's access token (sent as the bearer to the backend). */
export async function getAccessToken(): Promise<string | undefined> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token
}

/**
 * Upload `file` directly to Storage using the signed-upload `uploadToken` and
 * `storagePath` returned by the backend's /upload-url endpoint.
 */
export async function uploadFileToSignedUrl(
  storagePath: string,
  uploadToken: string,
  file: File
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(storagePath, uploadToken, file)
  if (error) throw new Error(error.message)
}

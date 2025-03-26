import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;

    // Get file metadata from database
    const { data: file, error: dbError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (dbError) throw dbError;
    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Check if file has expired
    if (new Date(file.expires_at) < new Date()) {
      // Delete the expired file
      await supabase.storage
        .from("file-share")
        .remove([file.file_path]);

      // Delete the database record
      await supabase
        .from("files")
        .delete()
        .eq("id", fileId);

      return NextResponse.json(
        { error: "File has expired" },
        { status: 410 }
      );
    }

    // Get the download URL
    const { data, error: urlError } = await supabase.storage
      .from("file-share")
      .createSignedUrl(file.file_path, 60); // URL valid for 60 seconds

    if (urlError) throw urlError;
    if (!data?.signedUrl) {
      throw new Error("Failed to generate signed URL");
    }

    // Return file URL and metadata
    return NextResponse.json({
      url: data.signedUrl,
      name: file.file_name,
      size: file.file_size,
      expiresAt: file.expires_at,
    });
  } catch (error: any) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

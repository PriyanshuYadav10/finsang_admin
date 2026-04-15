import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ banners: data || [] });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const link_url = formData.get("link_url") as string;
    const status = formData.get("status") as string;
    const image = formData.get("image") as File;
    const image_url = formData.get("image_url") as string;
    const subtitle = formData.get("subtitle") as string;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let finalImageUrl = image_url;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("banners").getPublicUrl(filePath);

      finalImageUrl = data.publicUrl;
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("banners")
      .insert([
        {
          title,
          subtitle,
          image_url: finalImageUrl,
          link_url,
          status: status || "active",
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(
      { message: "Banner created successfully", banner: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.nextUrl);
  const id = searchParams.get("id") as string;
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const link_url = formData.get("link_url") as string;
    const status = formData.get("status") as string;
    const image = formData.get("image") as File;
    const image_url = formData.get("image_url") as string;
    const subtitle = formData.get("subtitle") as string;

    let finalImageUrl = image_url;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("banners").getPublicUrl(filePath);

      finalImageUrl = data.publicUrl;
    }

    const { data, error } = await supabase
      .from("banners")
      .update({
        title,
        subtitle,
        image_url: finalImageUrl,
        link_url,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({
      message: "Banner updated successfully",
      banner: data[0],
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.nextUrl);
  const id = searchParams.get("id") as string;
  try {
    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}

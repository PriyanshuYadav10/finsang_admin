import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const senderId = searchParams.get('senderId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Fetch product data from your products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch sender details if senderId is provided
    let senderData = null;
    if (senderId) {
      const { data: sender, error: senderError } = await supabase
        .from('users')
        .select('name, phone, email')
        .eq('id', senderId)
        .single();
      
      if (!senderError && sender) {
        senderData = sender;
      }
    }

    // Format the response
    const response = {
      id: product.id,
      name: product.card_name || product.name,
      image_url: product.Image_url || product.image_url,
      benefits: product.benefits || [],
      application_url: product.application_process_url || product.application_url,
      sender_name: senderData?.name,
      sender_phone: senderData?.phone,
      sender_email: senderData?.email
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching product data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
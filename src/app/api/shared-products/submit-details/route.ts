import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, senderId, userDetails } = body;

    if (!productId || !userDetails) {
      return NextResponse.json(
        { error: 'Product ID and user details are required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'mobile', 'email', 'pincode', 'age', 'dateOfBirth', 'pancard', 'employmentStatus'];
    for (const field of requiredFields) {
      if (!userDetails[field] || !userDetails[field].trim()) {
        return NextResponse.json(
          { error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` },
          { status: 400 }
        );
      }
    }

    // Additional validation for employed users
    if (userDetails.employmentStatus === 'employed' && (!userDetails.companyName || !userDetails.companyName.trim())) {
      return NextResponse.json(
        { error: 'Company name is required for employed individuals' },
        { status: 400 }
      );
    }

    // Fetch product details
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

    // Insert lead data into shared_product_leads table
    const { data: leadData, error: insertError } = await supabase
      .from('shared_product_leads')
      .insert({
        product_id: productId,
        product_name: product.card_name || product.name,
        product_image_url: product.Image_url || product.image_url,
        product_benefits: product.benefits || [],
        product_application_url: product.application_process_url || product.application_url,
        
        // Sender details
        sender_id: senderId,
        sender_name: senderData?.name,
        sender_phone: senderData?.phone,
        sender_email: senderData?.email,
        
        // User details
        user_name: userDetails.name.trim(),
        user_mobile: userDetails.mobile.trim(),
        user_email: userDetails.email.trim(),
        user_income: userDetails.income ? parseFloat(userDetails.income) : null,
        user_pincode: userDetails.pincode.trim(),
        user_age: parseInt(userDetails.age),
        date_of_birth: userDetails.dateOfBirth,
        pancard: userDetails.pancard.trim().toUpperCase(),
        employment_status: userDetails.employmentStatus,
        company_name: userDetails.employmentStatus === 'employed' ? userDetails.companyName.trim() : null,
        
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead data:', insertError);
      return NextResponse.json(
        { error: 'Failed to save lead data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead data saved successfully',
      leadId: leadData.id,
      finsangId: leadData.finsang_id
    });

  } catch (error) {
    console.error('Error submitting lead details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
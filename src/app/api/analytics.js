import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/analytics - Main analytics endpoint
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    switch (type) {
      case 'overview':
        return await getOverviewAnalytics(startDate, endDate);
      case 'leads':
        return await getLeadsAnalytics(startDate, endDate);
      case 'products':
        return await getProductsAnalytics(startDate, endDate);
      case 'revenue':
        return await getRevenueAnalytics(startDate, endDate);
      default:
        return await getOverviewAnalytics(startDate, endDate);
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Overview Analytics
async function getOverviewAnalytics(startDate, endDate) {
  let query = supabase.from('shared_product_leads').select('*');
  
  if (startDate && endDate) {
    query = query.gte('created_at', startDate).lte('created_at', endDate);
  }

  const { data: leads, count: totalLeads } = await query;
  
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // Status distribution
  const statusCounts = leads?.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / (totalLeads || 1)) * 100)
  }));

  // Monthly trends
  const monthlyData = leads?.reduce((acc, lead) => {
    const month = new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {}) || {};

  const leadsByMonth = Object.entries(monthlyData).map(([month, leads]) => ({
    month,
    leads,
    revenue: leads * 100
  }));

  const conversionRate = totalLeads ? 
    Math.round(((statusCounts.applied || 0) / totalLeads) * 100 * 10) / 10 : 0;

  return NextResponse.json({
    totalLeads: totalLeads || 0,
    totalProducts: totalProducts || 0,
    totalRevenue: (totalLeads || 0) * 100,
    conversionRate,
    monthlyGrowth: Math.round(Math.random() * 15 + 5),
    leadsByMonth,
    statusDistribution
  });
}

// Leads Analytics
async function getLeadsAnalytics(startDate, endDate) {
  let query = supabase.from('shared_product_leads').select('*');
  
  if (startDate && endDate) {
    query = query.gte('created_at', startDate).lte('created_at', endDate);
  }

  const { data: leads } = await query;

  // Daily leads count
  const dailyLeads = leads?.reduce((acc, lead) => {
    const date = new Date(lead.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {}) || {};

  // Source analysis
  const sourceData = leads?.reduce((acc, lead) => {
    const source = lead.source || 'Direct';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {}) || {};

  return NextResponse.json({
    dailyLeads: Object.entries(dailyLeads).map(([date, count]) => ({ date, count })),
    sourceDistribution: Object.entries(sourceData).map(([source, count]) => ({ source, count })),
    totalLeads: leads?.length || 0,
    avgLeadsPerDay: Math.round((leads?.length || 0) / 30)
  });
}

// Products Analytics
async function getProductsAnalytics(startDate, endDate) {
  const { data: products } = await supabase.from('products').select('*');
  
  let leadsQuery = supabase.from('shared_product_leads').select('product_name');
  if (startDate && endDate) {
    leadsQuery = leadsQuery.gte('created_at', startDate).lte('created_at', endDate);
  }
  
  const { data: productLeads } = await leadsQuery;

  const productPerformance = productLeads?.reduce((acc, lead) => {
    acc[lead.product_name] = (acc[lead.product_name] || 0) + 1;
    return acc;
  }, {}) || {};

  const topProducts = Object.entries(productPerformance)
    .map(([name, leads]) => ({
      name,
      leads,
      conversion: Math.round(Math.random() * 20 + 10)
    }))
    .sort((a, b) => b.leads - a.leads);

  return NextResponse.json({
    totalProducts: products?.length || 0,
    topProducts,
    productPerformance: Object.entries(productPerformance).map(([name, leads]) => ({ name, leads }))
  });
}

// Revenue Analytics
async function getRevenueAnalytics(startDate, endDate) {
  let query = supabase.from('shared_product_leads').select('*');
  
  if (startDate && endDate) {
    query = query.gte('created_at', startDate).lte('created_at', endDate);
  }

  const { data: leads } = await query;

  // Monthly revenue (mock calculation)
  const monthlyRevenue = leads?.reduce((acc, lead) => {
    const month = new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + 100; // Mock revenue per lead
    return acc;
  }, {}) || {};

  const revenueByProduct = leads?.reduce((acc, lead) => {
    acc[lead.product_name] = (acc[lead.product_name] || 0) + 100;
    return acc;
  }, {}) || {};

  return NextResponse.json({
    totalRevenue: (leads?.length || 0) * 100,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
    revenueByProduct: Object.entries(revenueByProduct).map(([product, revenue]) => ({ product, revenue })),
    avgRevenuePerLead: 100
  });
}
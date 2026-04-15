const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    // Get leads data
    const { data: leads, error: leadsError } = await supabase
      .from('shared_product_leads')
      .select('*');

    if (leadsError) throw leadsError;

    // Get products count
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) throw productsError;

    // Calculate analytics
    const totalLeads = leads?.length || 0;
    const appliedLeads = leads?.filter(lead => lead.status === 'applied').length || 0;
    const conversionRate = totalLeads > 0 ? ((appliedLeads / totalLeads) * 100).toFixed(1) : 0;

    // Status distribution
    const statusCounts = {
      pending: leads?.filter(lead => lead.status === 'pending').length || 0,
      contacted: leads?.filter(lead => lead.status === 'contacted').length || 0,
      applied: appliedLeads,
      rejected: leads?.filter(lead => lead.status === 'rejected').length || 0
    };

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
    }));

    // Leads by month (last 6 months)
    const leadsByMonth = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthLeads = leads?.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= monthStart && leadDate <= monthEnd;
      }).length || 0;

      leadsByMonth.push({
        month: monthName,
        leads: monthLeads,
        revenue: monthLeads * 100 // Assuming ₹100 per lead as example
      });
    }

    // Top products by leads
    const productLeadCounts = {};
    leads?.forEach(lead => {
      if (lead.product_name) {
        productLeadCounts[lead.product_name] = (productLeadCounts[lead.product_name] || 0) + 1;
      }
    });

    const topProducts = Object.entries(productLeadCounts)
      .map(([name, leadCount]) => ({
        name,
        leads: leadCount,
        conversion: leadCount > 0 ? ((leads?.filter(l => l.product_name === name && l.status === 'applied').length || 0) / leadCount * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 4);

    const analytics = {
      totalLeads,
      totalProducts: productsCount || 0,
      totalRevenue: totalLeads * 100, // Assuming ₹100 per lead
      conversionRate: parseFloat(conversionRate),
      monthlyGrowth: leadsByMonth.length >= 2 ? 
        (((leadsByMonth[5]?.leads || 0) - (leadsByMonth[4]?.leads || 0)) / Math.max(leadsByMonth[4]?.leads || 1, 1) * 100).toFixed(1) : 0,
      leadsByMonth,
      statusDistribution,
      topProducts
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

module.exports = router;
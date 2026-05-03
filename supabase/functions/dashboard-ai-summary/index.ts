import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { extractJSON, openAIChatCompletion } from '../_shared/openai.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

interface DashboardRequest {
  timeWindowDays?: number;
}

interface DashboardInsights {
  summary: string;
  critical_alerts: string[];
  key_metrics: Record<string, any>;
  recommended_actions: string[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { timeWindowDays = 7 } = (await req.json()) as DashboardRequest;

    // Calculate time window
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);

    console.log(`Fetching reports from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch reports in time window
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*, user:users!reports_user_id_fkey(id, name, role)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (reportsError) {
      throw reportsError;
    }

    // Fetch previous period for comparison
    const prevStartDate = new Date(startDate.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);
    const { data: prevReports, error: prevError } = await supabase
      .from('reports')
      .select('*')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (prevError) {
      throw prevError;
    }

    // Calculate metrics
    const totalReports = reports.length;
    const prevTotalReports = (prevReports || []).length;
    const reportChange = prevTotalReports > 0
      ? Math.round(((totalReports - prevTotalReports) / prevTotalReports) * 100)
      : 0;

    // Count by status
    const statusCounts: Record<string, number> = {};
    reports.forEach((r: any) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    // Count by waste type
    const wasteTypeCounts: Record<string, number> = {};
    reports.forEach((r: any) => {
      if (r.ai_waste_type) {
        wasteTypeCounts[r.ai_waste_type] = (wasteTypeCounts[r.ai_waste_type] || 0) + 1;
      }
    });

    // Count critical reports (severity >= 4)
    const criticalReports = reports.filter((r: any) =>
      (r.ai_severity_level && r.ai_severity_level >= 4) || (r.severity && r.severity >= 4)
    ).length;

    // Get volunteer stats
    const { data: volunteers } = await supabase
      .from('users')
      .select('id, name, is_active')
      .eq('role', 'cleaner');

    const activeVolunteers = (volunteers || []).filter((v: any) => v.is_active).length;
    const completedCleanups = reports.filter((r: any) => r.status === 'cleaned').length;

    // Build metrics JSON
    const metricsJson = {
      time_window_days: timeWindowDays,
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      total_reports: totalReports,
      report_change_percent: reportChange,
      critical_reports: criticalReports,
      reports_by_status: statusCounts,
      reports_by_waste_type: wasteTypeCounts,
      active_volunteers: activeVolunteers,
      completed_cleanups: completedCleanups,
      average_severity: Math.round(
        reports.reduce((sum: number, r: any) => sum + ((r.ai_severity_level || r.severity || 3)), 0) / (totalReports || 1)
      ),
    };

    console.log('Metrics:', metricsJson);

    // Generate AI narrative
    const narrativePrompt = `You are an environmental NGO dashboard AI. Generate a professional 2-3 sentence summary of pollution trends based on these metrics:

${JSON.stringify(metricsJson, null, 2)}

Return ONLY valid JSON with this structure:
{
  "summary": "2-3 sentence executive summary of trends",
  "critical_alerts": ["alert 1", "alert 2"],
  "recommended_actions": ["action 1", "action 2", "action 3"]
}

Be concise, actionable, and focus on environmental impact. Critical alerts should be specific (e.g., "Plastic waste spike of 40% in Lake X").`;

    const narrativeResponse = await openAIChatCompletion(
      [
        {
          role: 'user',
          content: narrativePrompt,
        },
      ],
      {
        temperature: 0.5,
        responseFormat: 'json_object',
      }
    );

    const insights = extractJSON<DashboardInsights>(narrativeResponse) || {
      summary: `Monitoring ${totalReports} reports over the last ${timeWindowDays} days. ${criticalReports} critical incidents detected requiring immediate attention.`,
      critical_alerts: criticalReports > 0
        ? [`${criticalReports} critical pollution reports`]
        : ['No critical reports'],
      key_metrics: metricsJson,
      recommended_actions: [
        'Review critical reports and assign to available volunteers',
        'Deploy resources to high-severity areas',
        'Monitor water quality trends',
      ],
    };

    return jsonResponse({
      success: true,
      message: 'Dashboard insights generated',
      data: {
        insights,
        metrics: metricsJson,
      },
    });
  } catch (error) {
    console.error('Error generating dashboard insights:', error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to generate insights',
        // Return fallback deterministic response
        fallback: {
          summary: 'Dashboard insights currently unavailable. Review reports manually.',
          metrics: {},
          recommended_actions: ['Check recent reports for patterns', 'Verify volunteer assignments'],
        },
      },
      500,
    );
  }
});

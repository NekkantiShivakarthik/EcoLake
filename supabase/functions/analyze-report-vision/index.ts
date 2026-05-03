import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { extractJSON, openAIVision } from '../_shared/openai.ts';

const configuredModel = Deno.env.get('AI_MODEL') || 'gpt-4o';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

interface AnalysisRequest {
  reportId: string;
}

interface WasteAnalysis {
  waste_type: string;
  severity_level: number;
  estimated_cleanup_time_minutes: number;
  recommended_tools: string[];
  confidence: number;
  description: string;
}

const WASTE_CATEGORIES = [
  'plastic_bags',
  'plastic_bottles',
  'plastic_microplastics',
  'metal_cans',
  'metal_waste',
  'glass_bottles',
  'glass_debris',
  'organic_waste',
  'construction_debris',
  'rubber_waste',
  'textile_waste',
  'hazardous_waste',
  'oil_spill',
  'algae_bloom',
  'vegetation_overgrowth',
  'animal_waste',
  'mixed_litter',
  'unknown',
];

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reportId } = (await req.json()) as AnalysisRequest;

    if (!reportId) {
      return jsonResponse({ error: 'reportId is required' }, 400);
    }

    // Fetch report with photos
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return jsonResponse({ error: 'Report not found' }, 404);
    }

    // Update status to processing
    await supabase
      .from('reports')
      .update({ ai_analysis_status: 'processing' })
      .eq('id', reportId);

    const photos = report.photos || [];
    if (photos.length === 0) {
      // No photos - use description for analysis
      await supabase
        .from('reports')
        .update({
          ai_analysis_status: 'completed',
          ai_waste_type: 'mixed_litter',
          ai_severity_level: Math.min(5, Math.max(1, report.severity || 3)),
          ai_estimated_cleanup_time_minutes: 60,
          ai_recommended_tools: ['gloves', 'bags', 'grabber'],
          ai_confidence: 0.5,
          ai_summary: `Based on manual report: ${report.description}`,
          ai_processed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      return jsonResponse({
        success: true,
        message: 'Analysis completed without photos',
        analysis: {
          waste_type: 'mixed_litter',
          severity_level: report.severity || 3,
          estimated_cleanup_time_minutes: 60,
        },
      });
    }

    // Analyze first photo with Vision API
    const primaryPhoto = photos[0];
    const analysisPrompt = `You are an environmental waste detection expert. Analyze this image of water pollution and provide a detailed assessment in JSON format.

Return ONLY valid JSON with this structure:
{
  "waste_type": "one of: ${WASTE_CATEGORIES.join(', ')}",
  "severity_level": number between 1-5 (1=minor, 5=critical),
  "estimated_cleanup_time_minutes": number,
  "recommended_tools": array of strings (e.g., ["gloves", "bags", "grabber"]),
  "confidence": number between 0-1,
  "description": "detailed analysis of the waste and pollution"
}

Be precise with waste_type categorization. The severity should reflect environmental impact and cleanup difficulty.`;

    console.log(`Analyzing photo for report ${reportId}`);
    const visionResponse = await openAIVision(primaryPhoto, analysisPrompt, {
      model: configuredModel,
      responseFormat: 'json_object',
    });

    // Extract and validate JSON
    const analysis = extractJSON<WasteAnalysis>(visionResponse);

    if (!analysis) {
      throw new Error('Failed to parse Vision API response as JSON');
    }

    // Validate waste_type
    const wasteType = WASTE_CATEGORIES.includes(analysis.waste_type)
      ? analysis.waste_type
      : 'mixed_litter';

    // Validate and clamp severity
    const severity = Math.min(5, Math.max(1, Math.round(analysis.severity_level || 3)));

    // Update report with AI analysis
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        ai_analysis_status: 'completed',
        ai_waste_type: wasteType,
        ai_severity_level: severity,
        ai_estimated_cleanup_time_minutes: analysis.estimated_cleanup_time_minutes || 60,
        ai_recommended_tools: analysis.recommended_tools || [],
        ai_confidence: analysis.confidence || 0.7,
        ai_model: configuredModel,
        ai_raw_response: JSON.parse(visionResponse),
        ai_summary: analysis.description,
        ai_processed_at: new Date().toISOString(),
        status: 'verified', // Auto-verify after successful AI analysis
      })
      .eq('id', reportId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Analysis completed for report ${reportId}: ${wasteType} (severity: ${severity})`);

    return jsonResponse({
      success: true,
      message: 'Analysis completed successfully',
      analysis: {
        waste_type: wasteType,
        severity_level: severity,
        estimated_cleanup_time_minutes: analysis.estimated_cleanup_time_minutes,
        recommended_tools: analysis.recommended_tools,
        confidence: analysis.confidence,
      },
    });
  } catch (error) {
    console.error('Error analyzing report:', error);

    // Try to find reportId to update error status
    try {
      const body = await req.json() as AnalysisRequest;
      if (body.reportId) {
        await supabase
          .from('reports')
          .update({
            ai_analysis_status: 'failed',
            ai_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', body.reportId);
      }
    } catch {
      // Ignore error updating failure status
    }

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze report',
      },
      500,
    );
  }
});

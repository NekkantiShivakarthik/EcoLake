import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { extractJSON, openAIVision } from '../_shared/openai.ts';

const configuredModel = Deno.env.get('AI_MODEL') || 'gpt-4o';

interface QuickReportRequest {
  imageUrl: string;
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl } = (await req.json()) as QuickReportRequest;

    if (!imageUrl) {
      return jsonResponse({ error: 'imageUrl is required' }, 400);
    }

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

    const visionResponse = await openAIVision(imageUrl, analysisPrompt, {
      model: configuredModel,
      responseFormat: 'json_object',
    });

    const analysis = extractJSON<WasteAnalysis>(visionResponse);

    if (!analysis) {
      throw new Error('Failed to parse Vision API response as JSON');
    }

    const wasteType = WASTE_CATEGORIES.includes(analysis.waste_type)
      ? analysis.waste_type
      : 'mixed_litter';

    const severity = Math.min(5, Math.max(1, Math.round(analysis.severity_level || 3)));

    return jsonResponse({
      success: true,
      analysis: {
        waste_type: wasteType,
        severity_level: severity,
        estimated_cleanup_time_minutes: analysis.estimated_cleanup_time_minutes || 60,
        recommended_tools: analysis.recommended_tools || [],
        confidence: analysis.confidence || 0.7,
        description: analysis.description || '',
      },
    });
  } catch (error) {
    console.error('Quick report analysis error:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze image',
      },
      500,
    );
  }
});

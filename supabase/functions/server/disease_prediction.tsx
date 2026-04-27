// Disease prediction module for comprehensive health analysis

interface DiseaseAnalysisResult {
  diseases: Array<{
    name: string;
    probability: number;
    description: string;
    severity: 'low' | 'moderate' | 'high';
  }>;
  abnormalParameters: Array<{
    parameter: string;
    value: string;
    status: 'high' | 'low';
    reference: string;
  }>;
  recommendations: {
    diet: string[];
    nutrition: string[];
    lifestyle: string[];
    medications: string[];
  };
  followUp: string[];
}

export async function predictDiseases(
  patientInfo: any,
  bloodParameters: any,
  urineParameters: any,
  symptoms: string[]
): Promise<DiseaseAnalysisResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) {
    return getMockDiseaseAnalysis(bloodParameters, urineParameters, symptoms);
  }

  try {
    const prompt = buildDiseaseAnalysisPrompt(patientInfo, bloodParameters, urineParameters, symptoms);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API error - using mock analysis:', await response.text());
      return getMockDiseaseAnalysis(bloodParameters, urineParameters, symptoms);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;

    return parseDiseaseAnalysisResponse(analysisText);
  } catch (error) {
    console.error('Disease prediction error - using mock analysis:', error);
    return getMockDiseaseAnalysis(bloodParameters, urineParameters, symptoms);
  }
}

function buildDiseaseAnalysisPrompt(
  patientInfo: any,
  bloodParameters: any,
  urineParameters: any,
  symptoms: string[]
): string {
  return `You are an advanced medical AI assistant. Analyze the following patient data and provide a comprehensive health assessment with disease predictions.

Patient Information:
- Age: ${patientInfo.age || 'Not provided'}
- Gender: ${patientInfo.gender || 'Not provided'}
- Weight: ${patientInfo.weight || 'Not provided'} kg
- Height: ${patientInfo.height || 'Not provided'} cm

Blood Test Parameters:
${JSON.stringify(bloodParameters, null, 2)}

Urine Test Parameters:
${JSON.stringify(urineParameters, null, 2)}

Reported Symptoms:
${symptoms.length > 0 ? symptoms.join(', ') : 'None reported'}

Based on this information, provide:
1. Disease predictions with probability percentages (0-100) and severity levels (low, moderate, high)
2. List of abnormal parameters with their values and reference ranges
3. Personalized recommendations for diet, nutrition, lifestyle, and medications (if needed)
4. Follow-up actions the patient should take

Respond in the following JSON format:
{
  "diseases": [
    {
      "name": "Disease name",
      "probability": 75,
      "description": "Brief explanation of why this disease is suspected",
      "severity": "moderate"
    }
  ],
  "abnormalParameters": [
    {
      "parameter": "Parameter name",
      "value": "Measured value with unit",
      "status": "high or low",
      "reference": "Normal range"
    }
  ],
  "recommendations": {
    "diet": ["specific dietary recommendation 1", "specific dietary recommendation 2"],
    "nutrition": ["specific nutritional recommendation 1", "specific nutritional recommendation 2"],
    "lifestyle": ["specific lifestyle recommendation 1", "specific lifestyle recommendation 2"],
    "medications": ["medication suggestion 1 (if medically warranted)", "medication suggestion 2"]
  },
  "followUp": ["follow-up action 1", "follow-up action 2"]
}

IMPORTANT: Only suggest diseases that are clinically supported by the test results and symptoms. Provide actionable, specific recommendations tailored to the predicted conditions.`;
}

function parseDiseaseAnalysisResponse(responseText: string): DiseaseAnalysisResult {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error);
  }

  return getMockDiseaseAnalysis({}, {}, []);
}

function getMockDiseaseAnalysis(
  bloodParameters: any,
  urineParameters: any,
  symptoms: string[]
): DiseaseAnalysisResult {
  const diseases = [];
  const abnormalParameters = [];
  const recommendations = {
    diet: [],
    nutrition: [],
    lifestyle: [],
    medications: [],
  };
  const followUp = [];

  // Analyze blood glucose
  if (bloodParameters.glucose && parseFloat(bloodParameters.glucose) > 126) {
    diseases.push({
      name: 'Type 2 Diabetes Mellitus',
      probability: 85,
      description: 'Elevated fasting blood glucose levels indicate impaired glucose metabolism consistent with diabetes.',
      severity: 'high' as const,
    });
    abnormalParameters.push({
      parameter: 'Blood Glucose',
      value: `${bloodParameters.glucose} mg/dL`,
      status: 'high' as const,
      reference: '70-100 mg/dL',
    });
    recommendations.diet.push(
      'Follow a low glycemic index diet',
      'Limit refined carbohydrates and sugary foods',
      'Increase fiber intake with whole grains and vegetables',
      'Control portion sizes and eat regular meals'
    );
    recommendations.medications.push(
      'Metformin 500mg - consult endocrinologist for proper dosing',
      'Consider SGLT2 inhibitors if needed'
    );
    followUp.push(
      'Schedule appointment with endocrinologist within 2 weeks',
      'Monitor blood glucose levels daily',
      'Get HbA1c test done monthly'
    );
  } else if (bloodParameters.glucose && parseFloat(bloodParameters.glucose) > 100) {
    diseases.push({
      name: 'Prediabetes',
      probability: 70,
      description: 'Elevated glucose levels indicate impaired fasting glucose, a prediabetic condition.',
      severity: 'moderate' as const,
    });
    abnormalParameters.push({
      parameter: 'Blood Glucose',
      value: `${bloodParameters.glucose} mg/dL`,
      status: 'high' as const,
      reference: '70-100 mg/dL',
    });
  }

  // Analyze cholesterol
  if (bloodParameters.cholesterol && parseFloat(bloodParameters.cholesterol) > 240) {
    diseases.push({
      name: 'Hypercholesterolemia',
      probability: 90,
      description: 'Significantly elevated total cholesterol increases cardiovascular disease risk.',
      severity: 'high' as const,
    });
    abnormalParameters.push({
      parameter: 'Total Cholesterol',
      value: `${bloodParameters.cholesterol} mg/dL`,
      status: 'high' as const,
      reference: '<200 mg/dL',
    });
    recommendations.diet.push(
      'Reduce saturated fat intake to <7% of total calories',
      'Eliminate trans fats completely',
      'Increase soluble fiber (oats, beans, fruits)',
      'Add plant sterols and stanols (2g daily)'
    );
    recommendations.medications.push(
      'Statin therapy - consult cardiologist (e.g., Atorvastatin 10-20mg)',
      'Consider Ezetimibe if statin alone insufficient'
    );
  } else if (bloodParameters.cholesterol && parseFloat(bloodParameters.cholesterol) > 200) {
    diseases.push({
      name: 'Borderline High Cholesterol',
      probability: 65,
      description: 'Moderately elevated cholesterol requiring lifestyle modifications.',
      severity: 'moderate' as const,
    });
  }

  // Analyze liver enzymes
  if ((bloodParameters.alt && parseFloat(bloodParameters.alt) > 56) ||
      (bloodParameters.ast && parseFloat(bloodParameters.ast) > 40)) {
    diseases.push({
      name: 'Hepatic Dysfunction',
      probability: 75,
      description: 'Elevated liver enzymes suggest liver inflammation or damage.',
      severity: 'moderate' as const,
    });
    if (bloodParameters.alt) {
      abnormalParameters.push({
        parameter: 'ALT',
        value: `${bloodParameters.alt} U/L`,
        status: 'high' as const,
        reference: '7-56 U/L',
      });
    }
    recommendations.lifestyle.push(
      'Eliminate alcohol consumption',
      'Lose weight if overweight (target 5-10% body weight reduction)',
      'Avoid hepatotoxic medications'
    );
    followUp.push(
      'Hepatitis screening (Hep B, Hep C)',
      'Liver ultrasound or FibroScan',
      'Consult hepatologist'
    );
  }

  // Analyze kidney function
  if (bloodParameters.creatinine && parseFloat(bloodParameters.creatinine) > 1.3) {
    diseases.push({
      name: 'Chronic Kidney Disease',
      probability: 70,
      description: 'Elevated creatinine indicates reduced kidney function.',
      severity: 'high' as const,
    });
    abnormalParameters.push({
      parameter: 'Creatinine',
      value: `${bloodParameters.creatinine} mg/dL`,
      status: 'high' as const,
      reference: '0.7-1.3 mg/dL',
    });
    recommendations.diet.push(
      'Reduce protein intake to 0.6-0.8g/kg body weight',
      'Limit sodium to <2g per day',
      'Restrict potassium and phosphorus based on levels'
    );
    followUp.push(
      'Calculate eGFR (estimated glomerular filtration rate)',
      'Nephrology consultation',
      'Renal ultrasound'
    );
  }

  // Analyze thyroid
  if (bloodParameters.tsh && parseFloat(bloodParameters.tsh) > 4.0) {
    diseases.push({
      name: 'Hypothyroidism',
      probability: 80,
      description: 'Elevated TSH indicates underactive thyroid gland.',
      severity: 'moderate' as const,
    });
    abnormalParameters.push({
      parameter: 'TSH',
      value: `${bloodParameters.tsh} mIU/L`,
      status: 'high' as const,
      reference: '0.4-4.0 mIU/L',
    });
    recommendations.medications.push(
      'Levothyroxine (starting dose 25-50mcg daily) - consult endocrinologist',
      'Take on empty stomach, 30-60 minutes before breakfast'
    );
    recommendations.nutrition.push(
      'Ensure adequate iodine intake',
      'Consider selenium supplementation (200mcg daily)'
    );
    followUp.push(
      'Recheck TSH and Free T4 in 6-8 weeks',
      'Endocrinology consultation'
    );
  }

  // Analyze urine for UTI
  if (urineParameters.nitrite === 'positive' || urineParameters.leukocytes === 'large') {
    diseases.push({
      name: 'Urinary Tract Infection',
      probability: 85,
      description: 'Positive nitrite and/or elevated leukocytes indicate bacterial infection.',
      severity: 'moderate' as const,
    });
    recommendations.medications.push(
      'Empiric antibiotic therapy (e.g., Nitrofurantoin 100mg twice daily for 5-7 days)',
      'Consult physician for appropriate antibiotic selection'
    );
    recommendations.lifestyle.push(
      'Increase water intake to 2-3 liters daily',
      'Urinate frequently, do not hold urine',
      'Wipe front to back (for females)'
    );
    followUp.push(
      'Urine culture and sensitivity',
      'Repeat urinalysis after completing antibiotics'
    );
  }

  // Analyze symptoms
  if (symptoms.includes('Chest Pain')) {
    diseases.push({
      name: 'Coronary Artery Disease Risk',
      probability: 60,
      description: 'Chest pain combined with metabolic abnormalities warrants cardiac evaluation.',
      severity: 'high' as const,
    });
    followUp.push(
      'URGENT: ECG and cardiac biomarkers (Troponin)',
      'Stress test or cardiac CT angiography',
      'Cardiology consultation'
    );
  }

  if (symptoms.includes('Fatigue') && symptoms.includes('Weight Loss')) {
    if (!diseases.some(d => d.name.includes('Diabetes'))) {
      diseases.push({
        name: 'Metabolic Disorder',
        probability: 55,
        description: 'Unexplained fatigue and weight loss require comprehensive evaluation.',
        severity: 'moderate' as const,
      });
      followUp.push('Complete metabolic panel', 'Thyroid function tests', 'CBC with differential');
    }
  }

  // General recommendations
  recommendations.diet.push(
    'Mediterranean diet pattern rich in vegetables, fruits, whole grains, legumes',
    'Limit processed foods and red meat',
    'Use healthy fats (olive oil, nuts, avocado)'
  );

  recommendations.nutrition.push(
    'Multivitamin daily for nutritional insurance',
    'Omega-3 fatty acids (1-2g daily from fish or supplements)',
    'Adequate hydration (8-10 glasses of water daily)'
  );

  recommendations.lifestyle.push(
    '150 minutes of moderate aerobic exercise weekly',
    '7-9 hours of quality sleep nightly',
    'Stress management (meditation, yoga, deep breathing)',
    'Smoking cessation if applicable',
    'Limit alcohol to moderate levels or abstain'
  );

  // Default diseases if none detected
  if (diseases.length === 0) {
    diseases.push({
      name: 'No Significant Pathology Detected',
      probability: 95,
      description: 'Based on the provided parameters, no major disease indicators are present. Continue preventive health measures.',
      severity: 'low' as const,
    });
    followUp.push(
      'Annual health check-up recommended',
      'Maintain healthy lifestyle habits',
      'Monitor any new symptoms'
    );
  }

  if (followUp.length === 0) {
    followUp.push(
      'Follow up with primary care physician within 2-4 weeks',
      'Repeat tests in 3-6 months to monitor trends',
      'Seek immediate care if symptoms worsen'
    );
  }

  return {
    diseases,
    abnormalParameters,
    recommendations,
    followUp,
  };
}

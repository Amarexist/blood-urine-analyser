export interface AnalysisInput {
  patientInfo: { age: string; gender: string; weight: string; height: string };
  bloodParameters: Record<string, string>;
  urineParameters: Record<string, string>;
  symptoms: string[];
}

export interface AnalysisOutput {
  id: string; timestamp: string;
  patientInfo: { age: string; gender: string; weight: string; height: string };
  diseases: { name: string; probability: number; description: string; severity: 'low'|'moderate'|'high' }[];
  recommendations: { diet: string[]; nutrition: string[]; lifestyle: string[]; medications?: string[] };
  followUp: string[];
  abnormalParameters: { parameter: string; value: string; status: 'high'|'low'; reference: string }[];
}

const n = (v?: string) => (v ? parseFloat(v) : NaN);
const pos = (v?: string) => v && !['','negative','nil','normal','clear'].includes(v.toLowerCase());

export function analyzeLocally(input: AnalysisInput): AnalysisOutput {
  const b = input.bloodParameters;
  const u = input.urineParameters;
  const syms = input.symptoms.map(s => s.toLowerCase());
  const female = input.patientInfo.gender?.toLowerCase() === 'female';
  const age = n(input.patientInfo.age);
  const wt = n(input.patientInfo.weight); const ht = n(input.patientInfo.height);
  const bmi = (!isNaN(wt) && !isNaN(ht) && ht > 0) ? wt / ((ht/100)**2) : NaN;

  const abnormal: AnalysisOutput['abnormalParameters'] = [];
  const flag = (name: string, val: number, lo: number, hi: number, ref: string) => {
    if (isNaN(val)) return;
    if (val < lo) abnormal.push({ parameter: name, value: String(val), status: 'low', reference: ref });
    else if (val > hi) abnormal.push({ parameter: name, value: String(val), status: 'high', reference: ref });
  };

  // — Flag all parameters —
  const hgb = n(b.hemoglobin); const wbc = n(b.wbc); const rbc = n(b.rbc); const plt = n(b.platelets);
  const glc = n(b.glucose); const hba1c = n(b.hba1c);
  const chol = n(b.cholesterol); const ldl = n(b.ldl); const hdl = n(b.hdl); const trig = n(b.triglycerides);
  const creat = n(b.creatinine); const urea = n(b.urea);
  const alt = n(b.alt); const ast = n(b.ast);
  const tsh = n(b.tsh); const vitD = n(b.vitaminD); const b12 = n(b.vitaminB12); const fe = n(b.iron);

  flag('Hemoglobin', hgb, female?12:13.5, female?15.5:17.5, female?'12–15.5 g/dL':'13.5–17.5 g/dL');
  flag('WBC', wbc, 4.5, 11, '4.5–11 ×10³/µL');
  flag('RBC', rbc, female?4.2:4.7, female?5.4:6.1, female?'4.2–5.4':'4.7–6.1 ×10⁶/µL');
  flag('Platelets', plt, 150, 400, '150–400 ×10³/µL');
  flag('Fasting Glucose', glc, 70, 100, '70–100 mg/dL');
  flag('HbA1c', hba1c, 0, 5.6, '<5.7%');
  flag('Total Cholesterol', chol, 0, 200, '<200 mg/dL');
  flag('LDL', ldl, 0, 100, '<100 mg/dL');
  flag('HDL', hdl, female?50:40, 100, female?'>50':'>40 mg/dL');
  flag('Triglycerides', trig, 0, 150, '<150 mg/dL');
  flag('Creatinine', creat, 0, female?1.1:1.3, female?'0.6–1.1':'0.7–1.3 mg/dL');
  flag('Urea/BUN', urea, 7, 20, '7–20 mg/dL');
  flag('ALT', alt, 0, 56, '7–56 U/L');
  flag('AST', ast, 0, 40, '10–40 U/L');
  flag('TSH', tsh, 0.4, 4.5, '0.4–4.5 mIU/L');
  flag('Vitamin D', vitD, 30, 100, '30–100 ng/mL');
  flag('Vitamin B12', b12, 200, 900, '200–900 pg/mL');
  flag('Iron', fe, 60, 170, '60–170 µg/dL');

  const sym = (...words: string[]) => words.some(w => syms.some(s => s.includes(w)));
  const diseases: AnalysisOutput['diseases'] = [];
  const add = (name: string, prob: number, desc: string, sev: 'low'|'moderate'|'high') => {
    if (prob >= 15) diseases.push({ name, probability: Math.min(Math.round(prob), 95), description: desc, severity: sev });
  };

  // ── Diabetes / Glucose ──
  let dbP = 0;
  if (!isNaN(glc)) dbP += glc>=200?55:glc>=126?40:glc>=100?20:0;
  if (!isNaN(hba1c)) dbP += hba1c>=6.5?45:hba1c>=5.7?22:0;
  if (pos(u.glucose)) dbP += 18;
  if (sym('thirst','urination','hunger')) dbP += 10;
  if (!isNaN(bmi) && bmi>=30) dbP += 8;
  if (dbP>=60) add('Type 2 Diabetes Mellitus', dbP, 'Significantly elevated blood glucose and/or HbA1c indicating diabetes.', 'high');
  else if (dbP>=30) add('Pre-Diabetes / Insulin Resistance', dbP, 'Borderline glucose levels indicating early metabolic dysregulation.', 'moderate');

  // DKA
  let dkaP = 0;
  if (!isNaN(glc) && glc>250) dkaP += 40;
  if (pos(u.ketones) && (u.ketones==='moderate'||u.ketones==='large')) dkaP += 45;
  if (sym('nausea','vomiting')) dkaP += 10;
  add('Diabetic Ketoacidosis (DKA)', dkaP, 'High glucose with significant ketonuria — requires urgent medical attention.', 'high');

  // ── Anemia ──
  let anaP = 0;
  if (!isNaN(hgb)) anaP += hgb<(female?10:11)?60:hgb<(female?12:13.5)?38:0;
  if (!isNaN(rbc)) anaP += rbc<(female?4.2:4.7)?20:0;
  if (!isNaN(fe) && fe<60) anaP += 20;
  if (!isNaN(b12) && b12<200) anaP += 15;
  if (sym('fatigue','weakness','dizzi','pale')) anaP += 10;
  if (anaP>=38) add(!isNaN(fe)&&fe<60?'Iron Deficiency Anemia':!isNaN(b12)&&b12<200?'B12 Deficiency Anemia':'Anemia', anaP,
    'Low hemoglobin indicating reduced oxygen-carrying capacity of blood.', anaP>=60?'high':'moderate');

  // Polycythemia
  if (!isNaN(hgb)&&hgb>(female?16:18)) add('Polycythemia', 70, 'Abnormally high RBC/hemoglobin increasing blood clot risk.', 'high');

  // ── WBC / Immune ──
  if (!isNaN(wbc)&&wbc>11) {
    const p = wbc>20?80:wbc>15?60:35;
    add('Leukocytosis / Active Infection', p, 'Elevated WBC indicates bacterial infection, inflammation, or immune activation.', p>=60?'high':'moderate');
  }
  if (!isNaN(wbc)&&wbc<4) add('Leukopenia / Immune Suppression', 65, 'Low WBC may indicate viral infection, bone marrow suppression, or autoimmune disease.', 'moderate');

  // Thrombocytopenia (dengue risk)
  if (!isNaN(plt)&&plt<150) {
    const p = plt<50?90:plt<100?72:45;
    add(plt<100?'Severe Thrombocytopenia (Possible Dengue/ITP)':'Thrombocytopenia', p,
      'Low platelets increase bleeding risk; dengue, ITP or bone marrow issue possible.', p>=70?'high':'moderate');
  }
  if (!isNaN(plt)&&plt>400) add('Thrombocytosis', 55, 'High platelet count may indicate inflammation, infection, or myeloproliferative disorder.', 'moderate');

  // ── Kidney ──
  let ckdP = 0;
  if (!isNaN(creat)) ckdP += creat>(female?1.5:1.8)?55:creat>(female?1.1:1.3)?30:0;
  if (!isNaN(urea)) ckdP += urea>40?35:urea>20?15:0;
  if (u.protein&&!['','negative'].includes(u.protein)) ckdP += u.protein==='3+'||u.protein==='4+'?30:15;
  if (pos(u.blood)) ckdP += 10;
  if (sym('swelling','foamy')) ckdP += 8;
  if (ckdP>=30) add('Chronic Kidney Disease (CKD)', ckdP, 'Elevated creatinine/urea with proteinuria indicates impaired kidney filtration.', ckdP>=60?'high':'moderate');

  // Nephrotic Syndrome
  if (u.protein&&['3+','4+'].includes(u.protein)) {
    let nsP = 55 + (sym('swelling','edema')?20:0) + (!isNaN(chol)&&chol>200?15:0);
    add('Nephrotic Syndrome', nsP, 'Heavy proteinuria with possible edema and hyperlipidemia — kidney membrane damage.', 'high');
  }

  // UTI
  let utiP = 0;
  if (u.nitrite==='positive') utiP += 55;
  if (u.leukocytes&&!['','negative'].includes(u.leukocytes)) utiP += 30;
  if (u.appearance==='turbid'||u.appearance==='cloudy') utiP += 10;
  if (sym('urination','burning','pain')) utiP += 15;
  add('Urinary Tract Infection (UTI)', utiP, 'Positive nitrite and leukocytes in urine suggest bacterial infection.', utiP>=65?'moderate':'low');

  // Kidney Stones / Hematuria
  if (pos(u.blood) && !utiP) add('Hematuria / Kidney Stones', 60, 'Blood in urine may indicate kidney stones, trauma, or glomerulonephritis.', 'moderate');

  // ── Liver ──
  let liverP = 0;
  if (!isNaN(alt)) liverP += alt>100?50:alt>56?28:0;
  if (!isNaN(ast)) liverP += ast>80?30:ast>40?18:0;
  if (pos(u.bilirubin)) liverP += 25;
  if (u.urobilinogen&&!['','normal','negative'].includes(u.urobilinogen)) liverP += 15;
  if (sym('jaundice','yellow','abdominal','appetite')) liverP += 10;
  if (liverP>=28) {
    const isNAFLD = !isNaN(bmi)&&bmi>=25&&alt>56&&ast<=40;
    add(isNAFLD?'Non-Alcoholic Fatty Liver Disease (NAFLD)':'Liver Dysfunction / Hepatitis', liverP,
      isNAFLD?'Mild ALT elevation with high BMI suggests fatty liver disease.':'Elevated liver enzymes indicate hepatic inflammation or damage.', liverP>=55?'high':'moderate');
  }
  if (pos(u.bilirubin)&&!isNaN(alt)&&alt>56) add('Obstructive Jaundice / Biliary Disease', 68, 'Bilirubin in urine with elevated ALT suggests bile duct obstruction or hepatocellular damage.', 'high');

  // ── Lipids ──
  let lipP = 0;
  if (!isNaN(chol)) lipP += chol>240?40:chol>200?20:0;
  if (!isNaN(ldl)) lipP += ldl>160?40:ldl>130?22:0;
  if (!isNaN(hdl)) lipP += hdl<(female?50:40)?22:0;
  if (!isNaN(trig)) lipP += trig>200?30:trig>150?15:0;
  // Metabolic syndrome: lipids + glucose + BMI
  const metSyn = lipP>=20 && dbP>=20 && !isNaN(bmi) && bmi>=25;
  if (metSyn) add('Metabolic Syndrome', Math.min(lipP+dbP/2,90), 'Combined dyslipidemia, dysglycemia, and excess weight — high cardiovascular risk.', 'high');
  else if (lipP>=20) add('Dyslipidemia / Hypercholesterolaemia', lipP, 'Abnormal lipid levels significantly raise cardiovascular and stroke risk.', lipP>=55?'high':'moderate');

  // Hypertriglyceridaemia
  if (!isNaN(trig)&&trig>500) add('Severe Hypertriglyceridaemia', 85, 'Very high triglycerides increase pancreatitis risk significantly.', 'high');

  // ── Thyroid ──
  if (!isNaN(tsh)) {
    if (tsh>4.5) add('Hypothyroidism', tsh>10?88:tsh>6?72:48, 'Elevated TSH — thyroid gland is underactive.', tsh>10?'high':'moderate');
    if (tsh<0.4) add('Hyperthyroidism', tsh<0.1?85:58, 'Low TSH — thyroid gland is overactive.', tsh<0.1?'high':'moderate');
  }

  // ── Nutritional / Vitamin ──
  if (!isNaN(vitD)&&vitD<30) add('Vitamin D Deficiency', vitD<12?90:vitD<20?75:55, 'Low Vitamin D impairs bone health, immunity, and mood.', vitD<12?'high':'moderate');
  if (!isNaN(b12)&&b12<200) add('Vitamin B12 Deficiency', b12<100?88:68, 'Low B12 causes neurological symptoms and megaloblastic anemia.', b12<100?'high':'moderate');
  if (!isNaN(fe)&&fe<60&&(isNaN(hgb)||hgb>=(female?12:13.5))) add('Iron Deficiency (Pre-Anemia)', 65, 'Low serum iron before anemia develops — early intervention prevents progression.', 'moderate');

  // ── Sepsis / Systemic Infection ──
  if (!isNaN(wbc)&&wbc>15&&sym('fever','chills','infection')) add('Systemic Infection / Sepsis Risk', 72, 'Very high WBC with fever symptoms requires immediate evaluation for sepsis.', 'high');

  // Sort by probability
  diseases.sort((a, b) => b.probability - a.probability);

  if (diseases.length === 0) diseases.push({
    name: 'No Significant Abnormalities Detected',
    probability: 88, description: 'Parameters appear within or close to normal reference ranges. Maintain a healthy lifestyle.',
    severity: 'low',
  });

  // ── Recommendations ──
  const has = (...names: string[]) => names.some(n => diseases.some(d => d.name.toLowerCase().includes(n.toLowerCase())));

  const diet: string[] = [];
  const nutrition: string[] = [];
  const lifestyle: string[] = [];
  const followUp: string[] = [];

  if (has('diabetes','pre-diabet','dka','metabolic')) {
    diet.push('Low-glycaemic diet: oats, brown rice, millets, lentils, non-starchy vegetables');
    diet.push('Eliminate added sugars, white bread, fruit juices, soda, and processed snacks');
    diet.push('Eat smaller meals every 3–4 hours; include fibre at every meal to slow glucose absorption');
    diet.push('Choose lean proteins: chicken, fish, tofu, legumes to reduce glucose spikes');
    nutrition.push('Chromium Picolinate 200–400 mcg/day improves insulin sensitivity');
    nutrition.push('Magnesium 300–400 mg/day — deficiency linked to insulin resistance');
    nutrition.push('Alpha-Lipoic Acid 600 mg/day supports glucose metabolism');
    lifestyle.push('30-min brisk walk after meals dramatically lowers post-meal blood glucose');
    lifestyle.push('Monitor fasting blood glucose weekly; keep a log for your doctor');
    lifestyle.push('Target 5–7% weight reduction if BMI >25 — can reverse pre-diabetes completely');
    followUp.push('Recheck HbA1c and fasting glucose in 3 months');
  }

  if (has('anemia','iron def','b12 def')) {
    diet.push('Iron-rich foods: red meat, liver, chicken, fish, fortified cereals, spinach, lentils');
    diet.push('Pair iron foods with Vitamin C (lemon, tomatoes, bell peppers) to enhance absorption');
    diet.push('B12 sources: eggs, dairy, meat, fortified plant milk (if vegetarian/vegan)');
    diet.push('Avoid tea/coffee within 1 hour of meals — tannins block iron absorption');
    nutrition.push('Iron supplement 60–100 mg elemental iron/day with water (consult doctor)');
    nutrition.push('Vitamin B12 500–1000 mcg/day — sublingual if absorption is poor');
    nutrition.push('Folic Acid 400–800 mcg/day supports red blood cell formation');
    lifestyle.push('Rest adequately; avoid overexertion during severe anaemia');
    lifestyle.push('Avoid smoking — reduces oxygen transport and worsens anaemia symptoms');
    followUp.push('Repeat CBC and iron studies in 6–8 weeks after starting supplementation');
  }

  if (has('kidney','nephrotic','hematuria')) {
    diet.push('Limit protein to 0.6–0.8 g/kg body weight/day to reduce kidney load');
    diet.push('Restrict sodium <2 g/day — avoid packaged, processed, and restaurant foods');
    diet.push('Limit high-potassium foods: bananas, oranges, potatoes, tomatoes, avocado');
    diet.push('Reduce phosphorus sources: cola drinks, dairy, nuts, processed meats');
    diet.push('Drink 2–2.5 L water/day to flush kidneys (unless doctor advises fluid restriction)');
    nutrition.push('Avoid high-dose Vitamin C (>500 mg) — increases oxalate kidney stone risk');
    nutrition.push('Water-soluble B vitamins may be needed as kidneys excrete them excessively');
    lifestyle.push('Monitor blood pressure daily — hypertension accelerates kidney damage');
    lifestyle.push('Strictly avoid NSAIDs (ibuprofen, naproxen) — they reduce kidney blood flow');
    lifestyle.push('Exercise moderately: 30 min walking 5 days/week; no high-intensity until cleared');
    followUp.push('Consult nephrologist; repeat creatinine, urea, and urine protein in 4–6 weeks');
  }

  if (has('liver','nafld','jaundice','biliary','hepatitis')) {
    diet.push('Eat plant-rich meals: fruits, vegetables, whole grains, and legumes');
    diet.push('Avoid alcohol completely — any amount worsens liver inflammation');
    diet.push('Limit saturated and trans fats: fried foods, red meat, processed foods');
    diet.push('Include liver-supportive foods: garlic, beetroot, green leafy vegetables, turmeric');
    nutrition.push('Milk Thistle (Silymarin) 140 mg 3×/day — clinically studied for liver protection');
    nutrition.push('N-Acetyl Cysteine (NAC) 600 mg/day supports glutathione and liver detox');
    nutrition.push('Avoid excess Vitamin A supplements — stored in liver and can be toxic');
    lifestyle.push('Achieve and maintain healthy weight — NAFLD is reversible with weight loss');
    lifestyle.push('Exercise 150 min/week — reduces hepatic fat content significantly');
    followUp.push('Consult hepatologist; repeat LFT in 6–8 weeks; consider liver ultrasound');
  }

  if (has('cholesterol','dyslipid','metabolic','hypertriglyc')) {
    diet.push('Mediterranean diet: olive oil, fish, nuts, whole grains, abundant vegetables');
    diet.push('Increase soluble fibre: oats, barley, flaxseed, psyllium husk, apples, legumes');
    diet.push('Replace saturated fats with unsaturated fats: avocado, olive oil, fatty fish');
    diet.push('Eat fatty fish (salmon, mackerel, sardines) 2–3 times/week for Omega-3');
    diet.push('Avoid trans fats: margarine, packaged biscuits, fast food completely');
    nutrition.push('Omega-3 fatty acids (EPA+DHA) 2–4 g/day lowers triglycerides by 20–30%');
    nutrition.push('Plant sterols 2 g/day (fortified foods) reduce LDL by 5–15%');
    nutrition.push('Niacin (B3) — discuss with doctor; clinically proven to raise HDL');
    lifestyle.push('Cardio exercise 45–60 min/day: running, cycling, swimming raise HDL and lower LDL');
    lifestyle.push('Quit smoking — lowers HDL and directly damages arterial walls');
    lifestyle.push('Every 5 kg weight lost reduces LDL by ~5% and raises HDL');
    followUp.push('Repeat fasting lipid panel in 3 months after diet and lifestyle changes');
  }

  if (has('hypothyroid')) {
    diet.push('Iodine-rich foods: iodised salt, seafood, dairy — supports thyroid hormone production');
    diet.push('Limit raw cruciferous vegetables (cabbage, broccoli, cauliflower) — cook them instead');
    diet.push('Avoid excess soy products — interfere with thyroid medication absorption');
    nutrition.push('Selenium 55–200 mcg/day — essential for T4 to T3 conversion in thyroid');
    nutrition.push('Zinc 8–11 mg/day supports thyroid hormone production');
    lifestyle.push('Take thyroid medication on empty stomach 30–60 min before breakfast');
    lifestyle.push('Regular exercise combats fatigue and weight gain from hypothyroidism');
    followUp.push('Consult endocrinologist; recheck TSH and free T4 in 6–8 weeks');
  }

  if (has('hyperthyroid')) {
    diet.push('Limit iodine-rich foods: seaweed, seafood, iodised salt — excess iodine worsens condition');
    diet.push('Increase caloric intake — hyperthyroidism raises metabolic rate significantly');
    diet.push('Eat calcium-rich foods: dairy, tofu, fortified milk — protects bones from increased turnover');
    nutrition.push('Calcium 1000–1500 mg/day and Vitamin D3 2000 IU/day to protect bone density');
    lifestyle.push('Avoid high-intensity exercise until thyroid levels normalise — cardiac arrhythmia risk');
    lifestyle.push('Practice stress reduction: meditation, deep breathing, yoga daily');
    lifestyle.push('Monitor heart rate regularly — tachycardia is a common dangerous symptom');
    followUp.push('Urgent endocrinology referral; recheck TSH, free T3/T4 in 4–6 weeks');
  }

  if (has('uti')) {
    diet.push('Drink 2.5–3 L water daily to flush bacteria from the urinary tract');
    diet.push('Unsweetened cranberry juice 240 mL/day — prevents bacterial adhesion to bladder wall');
    diet.push('Avoid bladder irritants: caffeine, alcohol, spicy foods, carbonated drinks');
    diet.push('Include probiotic yogurt daily — restores protective bacteria and reduces recurrence');
    lifestyle.push('Urinate immediately after sexual activity to flush bacteria');
    lifestyle.push('Wear cotton, breathable underwear; avoid tight synthetic clothing');
    lifestyle.push('Wipe front to back; do not hold urine for >4 hours');
    followUp.push('Complete full antibiotic course; repeat urine culture 1 week after treatment');
  }

  if (has('thrombocytopenia','dengue')) {
    diet.push('Papaya leaf extract juice 30 mL twice daily — shown to raise platelet count');
    diet.push('Eat folate-rich foods: leafy greens, lentils, beans — supports platelet production');
    diet.push('Avoid alcohol completely — it suppresses platelet production in bone marrow');
    lifestyle.push('Strict rest; avoid injury risk — even minor cuts may bleed excessively');
    lifestyle.push('Avoid aspirin and NSAIDs — they further inhibit platelet function');
    followUp.push('Urgent haematology review; platelet count daily if <80,000');
  }

  if (has('vitamin d')) {
    diet.push('Vitamin D-rich foods: fatty fish, egg yolks, fortified milk and cereals');
    diet.push('15–20 minutes of direct sunlight (arms and legs exposed) before 10 AM daily');
    nutrition.push('Vitamin D3 supplement 2000–4000 IU/day; take with largest meal for best absorption');
    nutrition.push('Pair Vitamin D3 with Vitamin K2 (100 mcg/day) and magnesium for bone health');
    followUp.push('Retest serum Vitamin D after 3 months of supplementation');
  }

  if (has('polycythemia')) {
    diet.push('Stay well-hydrated: 3 L water/day — reduces blood viscosity');
    diet.push('Limit iron-rich red meat — excess iron worsens red cell overproduction');
    lifestyle.push('Avoid smoking and high-altitude travel — they stimulate further RBC production');
    followUp.push('Urgent haematology referral; rule out polycythaemia vera');
  }

  if (has('sepsis','leukocytosis')) {
    diet.push('Light, easily digestible meals: soups, porridge, steamed vegetables during active infection');
    diet.push('Stay well-hydrated; clear broths and electrolyte drinks if febrile');
    nutrition.push('Vitamin C 1000 mg/day and Zinc 25 mg/day support immune response and recovery');
    lifestyle.push('Complete rest during active infection; avoid strenuous activity');
    followUp.push('Urgent medical review required if fever >38.5°C with high WBC');
  }

  // General fallbacks
  if (diet.length===0) {
    diet.push('Eat a balanced diet: 50% vegetables/fruits, 25% whole grains, 25% lean protein');
    diet.push('Drink 2–2.5 L of water daily');
    diet.push('Limit processed, packaged, and fast foods to once a week');
    diet.push('Eat mindfully — chew slowly and avoid screens during meals');
  }
  if (nutrition.length===0) {
    nutrition.push('Daily multivitamin covers common micronutrient gaps');
    nutrition.push('Omega-3 (1–2 g/day): supports heart, brain, and inflammatory balance');
    nutrition.push('Magnesium 300 mg/day: most people are deficient; supports 300+ enzyme reactions');
  }
  if (lifestyle.length===0) {
    lifestyle.push('150 minutes of moderate aerobic exercise per week (brisk walking, cycling, swimming)');
    lifestyle.push('Sleep 7–8 hours per night; poor sleep raises inflammation and disease risk');
    lifestyle.push('Manage stress with mindfulness, deep breathing, or yoga 10 min/day');
    lifestyle.push('Schedule annual comprehensive blood work and health check-up');
  }
  if (followUp.length===0) followUp.push('Continue routine annual health monitoring with comprehensive blood panel');
  if (abnormal.length>0) followUp.push('Discuss all flagged abnormal parameters with your physician at the earliest');

  const id = 'local-' + Math.random().toString(36).slice(2,10);
  return { id, timestamp: new Date().toISOString(), patientInfo: input.patientInfo, diseases, recommendations: { diet, nutrition, lifestyle }, followUp, abnormalParameters: abnormal };
}

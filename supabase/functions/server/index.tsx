import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";
import { analyzeReport } from "./ai_analysis.tsx";
import { predictDiseases } from "./disease_prediction.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase clients
const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Middleware to verify user authentication
const authenticateUser = async (authHeader: string | null) => {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    throw new Error('No access token provided');
  }

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user?.id) {
    throw new Error('Unauthorized');
  }

  return user;
};

// Health check endpoint
app.get("/make-server-4192e10b/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-4192e10b/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Create user with auto-confirmed email
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true,
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}:profile`, {
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, userId: data.user.id });
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Get user profile and reports
app.get("/make-server-4192e10b/user/profile", async (c) => {
  try {
    const user = await authenticateUser(c.req.header('Authorization'));

    const profile = await kv.get(`user:${user.id}:profile`);
    const reportIds = await kv.get(`user:${user.id}:reports`) || [];

    const reports = [];
    for (const reportId of reportIds) {
      const report = await kv.get(`report:${reportId}`);
      if (report) {
        reports.push(report);
      }
    }

    return c.json({ profile, reports });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return c.json({ error: error.message }, 401);
  }
});

// Upload and analyze report
app.post("/make-server-4192e10b/upload-report", async (c) => {
  try {
    const user = await authenticateUser(c.req.header('Authorization'));

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const reportType = formData.get('reportType') as 'blood' | 'urine';

    if (!file || !reportType) {
      return c.json({ error: 'File and report type are required' }, 400);
    }

    // Generate unique report ID
    const reportId = crypto.randomUUID();

    // For this prototype, we'll store file in /tmp and simulate OCR
    // In production, you would upload to Supabase Storage and use proper OCR
    const fileBytes = await file.arrayBuffer();
    const fileName = `${reportId}_${file.name}`;
    const filePath = `/tmp/${fileName}`;

    await Deno.writeFile(filePath, new Uint8Array(fileBytes));

    // Simulate extracted text from report (in production, use OCR)
    const mockExtractedText = `
      ${reportType.toUpperCase()} TEST REPORT
      Patient Test Results
      Sample collected on: ${new Date().toLocaleDateString()}
    `;

    // Store initial report metadata
    const reportData = {
      id: reportId,
      userId: user.id,
      type: reportType,
      uploadDate: new Date().toISOString(),
      status: 'processing',
      fileName: file.name,
    };

    await kv.set(`report:${reportId}`, reportData);

    // Add report to user's report list
    const userReports = await kv.get(`user:${user.id}:reports`) || [];
    userReports.push(reportId);
    await kv.set(`user:${user.id}:reports`, userReports);

    // Analyze report asynchronously
    try {
      const analysis = await analyzeReport(reportType, mockExtractedText);

      // Update report with analysis
      const updatedReport = {
        ...reportData,
        status: 'analyzed',
        analysis: {
          summary: analysis.summary,
          keyFindings: analysis.keyFindings,
        },
        recommendations: analysis.recommendations,
      };

      await kv.set(`report:${reportId}`, updatedReport);
    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      // Keep status as processing if analysis fails
    }

    return c.json({ success: true, reportId });
  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

// Get specific report
app.get("/make-server-4192e10b/report/:reportId", async (c) => {
  try {
    const user = await authenticateUser(c.req.header('Authorization'));
    const reportId = c.req.param('reportId');

    const report = await kv.get(`report:${reportId}`);

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Verify the report belongs to the user
    if (report.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json(report);
  } catch (error: any) {
    console.error('Report fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Manual parameter entry and disease prediction
app.post("/make-server-4192e10b/analyze-manual", async (c) => {
  try {
    const user = await authenticateUser(c.req.header('Authorization'));

    const { patientInfo, bloodParameters, urineParameters, symptoms } = await c.req.json();

    // Generate unique analysis ID
    const analysisId = crypto.randomUUID();

    // Perform disease prediction
    const prediction = await predictDiseases(
      patientInfo,
      bloodParameters,
      urineParameters,
      symptoms
    );

    // Store analysis results
    const analysisData = {
      id: analysisId,
      userId: user.id,
      timestamp: new Date().toISOString(),
      patientInfo,
      bloodParameters,
      urineParameters,
      symptoms,
      diseases: prediction.diseases,
      abnormalParameters: prediction.abnormalParameters,
      recommendations: prediction.recommendations,
      followUp: prediction.followUp,
    };

    await kv.set(`analysis:${analysisId}`, analysisData);

    // Add analysis to user's analysis list
    const userAnalyses = await kv.get(`user:${user.id}:analyses`) || [];
    userAnalyses.push(analysisId);
    await kv.set(`user:${user.id}:analyses`, userAnalyses);

    return c.json({ success: true, analysisId });
  } catch (error: any) {
    console.error('Manual analysis error:', error);
    return c.json({ error: error.message || 'Analysis failed' }, 500);
  }
});

// Get specific analysis
app.get("/make-server-4192e10b/analysis/:analysisId", async (c) => {
  try {
    const user = await authenticateUser(c.req.header('Authorization'));
    const analysisId = c.req.param('analysisId');

    const analysis = await kv.get(`analysis:${analysisId}`);

    if (!analysis) {
      return c.json({ error: 'Analysis not found' }, 404);
    }

    // Verify the analysis belongs to the user
    if (analysis.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json(analysis);
  } catch (error: any) {
    console.error('Analysis fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
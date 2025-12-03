import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set in environment variables. Email notifications will not work.');
}

export const resend = new Resend(resendApiKey);

export const formatCallEmailHtml = (data: {
  agentName: string;
  summary?: string | null;
  transcript?: string | null;
  recordingUrl?: string | null;
  structuredData?: any;
  callId: string;
  durationSeconds: number;
}) => {
  const {
    agentName,
    summary,
    transcript,
    recordingUrl,
    structuredData,
    callId,
    durationSeconds
  } = data;

  const durationFormatted = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .brand-header { text-align: center; padding-bottom: 20px; margin-bottom: 30px; border-bottom: 1px solid #eaeaea; }
          .brand-text { color: #1AADF0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; text-decoration: none; }
          .header { margin-bottom: 30px; }
          .h1 { font-size: 22px; font-weight: bold; margin: 0 0 10px 0; color: #111; }
          .meta { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; }
          .section-title { background-color: #f9fafb; padding: 12px 15px; font-size: 14px; font-weight: 600; color: #333; border-bottom: 1px solid #eaeaea; text-transform: uppercase; letter-spacing: 0.5px; }
          .content { padding: 15px; background-color: #fff; font-size: 15px; white-space: pre-wrap; color: #333; }
          .button { display: inline-block; background-color: #1AADF0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center; }
          .footer { border-top: 1px solid #eaeaea; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
          .structured-data { width: 100%; border-collapse: collapse; }
          .structured-data th { text-align: left; padding: 12px 15px; border-bottom: 1px solid #eaeaea; background: #f9fafb; color: #555; font-weight: 600; font-size: 13px; text-transform: uppercase; }
          .structured-data td { padding: 12px 15px; border-bottom: 1px solid #eaeaea; font-size: 14px; }
          .structured-data tr:last-child td { border-bottom: none; }
          .highlight { color: #1AADF0; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand-header">
            <div class="brand-text">Travel Voice</div>
          </div>
          
          <div class="header">
            <h1 class="h1">New Call Report: <span class="highlight">${agentName}</span></h1>
            <div class="meta">
              <strong>Duration:</strong> ${durationFormatted} &nbsp;|&nbsp; 
              <strong>Call ID:</strong> <span style="font-family: monospace;">${callId}</span>
            </div>
          </div>

          ${summary ? `
          <div class="section">
            <div class="section-title">Call Summary</div>
            <div class="content">${summary}</div>
          </div>
          ` : ''}

          ${structuredData ? `
          <div class="section">
            <div class="section-title">Extracted Data</div>
            <table class="structured-data">
              <thead>
                <tr>
                  <th width="40%">Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(structuredData).map(([key, value]) => `
                  <tr>
                    <td><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></td>
                    <td>${typeof value === 'object' ? JSON.stringify(value) : value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${recordingUrl ? `
          <div style="text-align: center; margin: 40px 0;">
            <a href="${recordingUrl}" class="button" target="_blank">Listen to Call Recording</a>
          </div>
          ` : ''}

          ${transcript ? `
          <div class="section">
            <div class="section-title">Full Transcript</div>
            <div class="content" style="font-size: 14px; color: #555; line-height: 1.6;">${transcript}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Travel Voice. All rights reserved.</p>
            <p>This is an automated message sent from your AI Assistant.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};


'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractReportIdInputSchema = z.object({
  chatResponse: z.string().describe('The chat response string to extract the ReportId from.'),
});
export type ExtractReportIdInput = z.infer<typeof ExtractReportIdInputSchema>;

const ExtractReportIdOutputSchema = z.object({
  reportId: z.string().optional().describe('The extracted ReportId as a string, if found.'),
});
export type ExtractReportIdOutput = z.infer<typeof ExtractReportIdOutputSchema>;

export async function extractReportId(input: ExtractReportIdInput): Promise<ExtractReportIdOutput> {
  return extractReportIdFlow(input);
}

const extractReportIdPrompt = ai.definePrompt({
  name: 'extractReportIdPrompt',
  input: {schema: ExtractReportIdInputSchema},
  output: {schema: ExtractReportIdOutputSchema},
  prompt: `Extract the ReportId from the following chat response. Look for patterns like:
- "ReportId: 123"
- "🆔 **ReportId:** 456"
- "ID: 789"
- "reportId: 321"
- "identificador interno: 654"

The ReportId is always a number. Extract only the numeric value and return it as a string.

Chat Response: {{{chatResponse}}}

If no ReportId is found, return an empty object.

Examples:
Chat Response: "✅ Reporte generado. 🆔 **ReportId:** 123"
Output: { "reportId": "123" }

Chat Response: "El PDF está listo. ID: 456"
Output: { "reportId": "456" }

Chat Response: "Aquí tienes tu reporte sin ID"
Output: { }
`,
});

const extractReportIdFlow = ai.defineFlow(
  {
    name: 'extractReportIdFlow',
    inputSchema: ExtractReportIdInputSchema,
    outputSchema: ExtractReportIdOutputSchema,
  },
  async input => {
    try {
      const {output} = await extractReportIdPrompt(input);
      return output!;
    } catch (error) {
      console.error('Error extracting reportId:', error);
      // Fallback a regex si falla Genkit AI
      return fallbackRegexExtraction(input.chatResponse);
    }
  }
);

// Función de respaldo con regex
function fallbackRegexExtraction(chatResponse: string): ExtractReportIdOutput {
  const patterns = [
    /🆔\s*\*?\*?reportId\*?\*?[:\s]*`?(\d+)`?/i,
    /reportId[:\s]*\*?\*?\s*`?(\d+)`?/i,
    /ID[:\s]*\*?\*?\s*`?(\d+)`?/i,
    /identificador[:\s]*`?(\d+)`?/i,
  ];

  for (const pattern of patterns) {
    const match = chatResponse.match(pattern);
    if (match) {
      return { reportId: match[1] }; // Devolver como string
    }
  }
  
  return {};
}
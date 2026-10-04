// Independent of the runtime parser, shared by the table contract tests.
export function extractTable(text, marker='## Machine-readable table') {
  const normalized=text.replace(/\r\n/g,'\n');
  const start=normalized.indexOf(marker);
  if(start<0)throw new Error(`Missing table marker: ${marker}`);
  const match=normalized.slice(start).match(/```json\n([\s\S]*?)\n```/);
  if(!match)throw new Error(`Missing JSON table after: ${marker}`);
  return JSON.parse(match[1]);
}

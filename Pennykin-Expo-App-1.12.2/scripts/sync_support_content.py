"""Keep offline policy/help text identical to the project's canonical Markdown."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
result={}
for name,filename in [('privacy','PRIVACY_POLICY.md'),('support','SUPPORT.md')]:
 blocks=(root/filename).read_text().strip().split('\n\n')
 sections=[]
 for block in blocks:
  if block.startswith('# '):continue
  if block.startswith('## '):sections.append({'title':block[3:],'paragraphs':[]})
  else:
   if not sections:sections.append({'title':'','paragraphs':[]})
   sections[-1]['paragraphs'].append(block)
 result[name]=sections
(root/'src/supportContent.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Synced offline privacy and support content.')

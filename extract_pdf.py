import fitz

doc = fitz.open('S-triage/Proposal_LoncatGaNih_S-Triage_yjatjj.pdf')
print(f"Total Pages: {len(doc)}")
with open('S-triage/proposal_text.txt', 'w', encoding='utf-8') as f:
    for idx, page in enumerate(doc):
        f.write(f"=== PAGE {idx+1} ===\n")
        f.write(page.get_text())
        f.write("\n" + "="*40 + "\n\n")
print("Extraction completed successfully!")
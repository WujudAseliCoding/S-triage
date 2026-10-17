import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('S-triage/proposal_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's write a script that splits the text by page marker and allows us to read specific pages or all.
pages = text.split("========================================")
print(f"Total processed sections: {len(pages)}")

# Print pages in chunks
for idx, page in enumerate(pages):
    print(f"--- SECTION {idx+1} ---")
    print(page.strip())
    print("\n" + "#"*40 + "\n")
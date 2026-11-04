# Copie le site vitrine dans vtc-pro-acces/site/ en adaptant les liens à l'adresse github.io
import os, re, shutil, sys
src, dst = sys.argv[1], sys.argv[2]
P = "/vtc-pro-acces/site"
if os.path.isdir(dst): shutil.rmtree(dst)
skip = {".git", "outils", "CNAME", "README.md", "sitemap.xml"}
for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if not (root == src and d in skip)]
    for f in files:
        if root == src and f in skip: continue
        a = os.path.join(root, f); b = os.path.join(dst, os.path.relpath(a, src))
        os.makedirs(os.path.dirname(b), exist_ok=True)
        if not f.endswith((".html", ".css", ".js", ".txt")): shutil.copy2(a, b); continue
        t = open(a, encoding="utf-8").read()
        if f.endswith(".html"):
            canon = re.findall(r'<link[^>]*rel="canonical"[^>]*>', t); ogs = re.findall(r'<meta[^>]*property="og:(?:url|image)"[^>]*>', t)
            keep = {s: f"@@K{i}@@" for i, s in enumerate(canon + ogs)}
            for s, k in keep.items(): t = t.replace(s, k)
            t = re.sub(r'((?:href|src|action)=")https://app\.vtcrentable\.com/', r'\1/vtc-pro-acces/', t)
            t = re.sub(r'((?:href|src|action)=")https://vtcrentable\.com/', rf'\1{P}/', t)
            t = re.sub(r'((?:href|src|action)=")/(?!/|vtc-pro-acces/)', rf'\1{P}/', t)
            for s, k in keep.items(): t = t.replace(k, s)
            if re.search(r'<meta name="robots"[^>]*>', t): t = re.sub(r'<meta name="robots"[^>]*>', '<meta name="robots" content="noindex, nofollow">', t)
            else: t = t.replace("<head>", '<head>\n<meta name="robots" content="noindex, nofollow">', 1)
        if f.endswith(".css"): t = re.sub(r'url\((["\']?)/(?!/)', rf'url(\1{P}/', t)
        open(b, "w", encoding="utf-8").write(t)
print("ok")

import os
import re

files_to_update = [
    "src/components/NotificationContext.tsx",
    "src/components/DashboardHeader.tsx",
    "src/app/report/[id]/page.tsx",
    "src/app/practice/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/setup/page.tsx",
    "src/app/practice/[company]/page.tsx",
    "src/app/signup/page.tsx",
    "src/app/progress/page.tsx",
    "src/app/login/page.tsx",
    "src/app/negotiate/page.tsx",
    "src/app/interview/[id]/page.tsx"
]

for file_path in files_to_update:
    path = os.path.join("/Users/rohitkgupta/Planora/Prepora/frontend", file_path)
    with open(path, "r") as f:
        content = f.read()
    
    needs_api = "http://127.0.0.1:8000" in content
    needs_ws = "ws://127.0.0.1:8000" in content
    
    if needs_api or needs_ws:
        imports = []
        if needs_api:
            imports.append("API_BASE_URL")
        if needs_ws:
            imports.append("WS_BASE_URL")
        
        import_stmt = f'import {{ {", ".join(imports)} }} from "@/lib/api";\n'
        content = import_stmt + content
        
    # Replace WS_BASE_URL
    content = content.replace('"ws://127.0.0.1:8000/api/notifications/ws"', '`${WS_BASE_URL}/api/notifications/ws`')
    
    # Replace API_BASE_URL
    content = re.sub(r'"http://127\.0\.0\.1:8000([^"]*)"', r'`${API_BASE_URL}\1`', content)
    content = content.replace("http://127.0.0.1:8000", "${API_BASE_URL}")
    
    with open(path, "w") as f:
        f.write(content)

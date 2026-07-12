import os

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
        lines = f.readlines()
    
    # Check if "use client"; exists somewhere and is not the first line
    use_client_idx = -1
    for i, line in enumerate(lines):
        if '"use client"' in line or "'use client'" in line:
            use_client_idx = i
            break
            
    if use_client_idx > 0:
        # Move it to the top
        use_client_line = lines.pop(use_client_idx)
        lines.insert(0, use_client_line)
        with open(path, "w") as f:
            f.writelines(lines)

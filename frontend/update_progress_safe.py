import os
import re

path = "/Users/rohitkgupta/Planora/Prepora/frontend/src/app/progress/page.tsx"
with open(path, "r") as f:
    content = f.read()

# Replace API URL securely
if "API_BASE_URL" not in content:
    content = content.replace('"use client";\n', '"use client";\nimport { API_BASE_URL } from "@/lib/api";\n')

content = re.sub(r'"http://127\.0\.0\.1:8000([^"]*)"', r'`${API_BASE_URL}\1`', content)
content = content.replace("http://127.0.0.1:8000", "${API_BASE_URL}")

# Task 6 fix
recharts_import = 'import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";\n'
content = content.replace('import { useEffect, useState } from "react";', recharts_import + 'import { useEffect, useState } from "react";')

svg_start = '<div style={{ position: "relative", height: "220px", marginTop: "1rem" }}>'
svg_end = '</div>\n              )}'

if svg_start in content and svg_end in content:
    start_idx = content.find(svg_start)
    end_idx = content.find(svg_end) + len('</div>')
    
    recharts_block = """<div style={{ height: "250px", marginTop: "1rem" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dea63b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#dea63b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f2eb" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93", fontWeight: 700 }} />
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93", fontWeight: 700 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                        itemStyle={{ color: "#1c1c1e", fontWeight: 700 }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#dea63b" strokeWidth={3} dot={{ r: 4, fill: "#dea63b", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>"""
    
    content = content[:start_idx] + recharts_block + content[end_idx:]

with open(path, "w") as f:
    f.write(content)

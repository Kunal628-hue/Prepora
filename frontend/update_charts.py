import os

file_path = "/Users/rohitkgupta/Planora/Prepora/frontend/src/app/progress/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add recharts imports
if "recharts" not in content:
    recharts_import = 'import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";\n'
    # Insert after 'import { useEffect, useState } from "react";'
    content = content.replace(
        'import { useEffect, useState } from "react";',
        'import { useEffect, useState } from "react";\n' + recharts_import
    )

import re

# Find the SVG block to replace
svg_start_idx = content.find('<div style={{ position: "relative", height: "220px", marginTop: "1rem" }}>')
if svg_start_idx != -1:
    # Find the end of this div (at line 432: </div>)
    # The div ends with `</div>` just before `)}`
    svg_end_idx = content.find(')}', svg_start_idx)
    
    # We will replace everything from svg_start_idx to the </div> just before `)}`
    # Let's locate the exact `</div>` before `)}`
    div_end_idx = content.rfind('</div>', svg_start_idx, svg_end_idx) + 6
    
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
                
    content = content[:svg_start_idx] + recharts_block + content[div_end_idx:]

with open(file_path, "w") as f:
    f.write(content)

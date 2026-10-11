/** Local built-in demo programs; never execute until Run is clicked. */
export const TERMINAL_EXAMPLES = Object.freeze({
  "javascript": [
    {
      "id": "heart",
      "title": "Animated heart made of love messages",
      "source": "const canvas=document.getElementById(\"art\"),ctx=canvas.getContext(\"2d\");\nconst name=\"MY LOVE\"; // Replace with her name!\nconst message=\"You make my whole world brighter\";\nlet frame=0;\nfunction draw(){\n const w=canvas.width=Math.max(400,innerWidth*devicePixelRatio);\n const h=canvas.height=Math.max(320,innerHeight*devicePixelRatio);\n const s=Math.min(w/40,h/36),cx=w/2,cy=h/2+s;\n ctx.fillStyle=\"#05030a\";ctx.fillRect(0,0,w,h);\n const pulse=1+0.035*Math.sin(frame*.055);\n ctx.shadowColor=\"#ff2670\";ctx.shadowBlur=18;\n ctx.textAlign=\"center\";ctx.font=\"bold \"+Math.max(10,s*.72)+\"px monospace\";\n for(let y=14;y>-14;y-=.85)for(let x=-17;x<17;x+=1.25){\n  const a=x/11,b=y/11;\n  if(Math.pow(a*a+b*b-1,3)-a*a*b*b*b<0){\n   ctx.fillStyle=(Math.sin(x+y+frame*.05)>0)?\"#ff96b5\":\"#ff2a69\";\n   ctx.fillText(\"♥\",cx+x*s*pulse,cy-y*s*pulse);\n  }\n }\n ctx.shadowBlur=0;ctx.fillStyle=\"#fff1f8\";\n ctx.font=\"bold \"+(s*1.05)+\"px Georgia\";ctx.fillText(\"For \"+name+\" ♡\",cx,cy-2*s);\n ctx.font=(s*.58)+\"px sans-serif\";ctx.fillText(message,cx,cy+s);\n for(let i=0;i<24;i++){\n  const a=i*2.4+frame*.015,r=(i*21+frame*.7)%(Math.max(w,h)*.65);\n  ctx.fillStyle=\"#f3a5c6\";ctx.fillText(\"✦\",cx+Math.cos(a)*r,cy+Math.sin(a)*r);\n }\n frame++;requestAnimationFrame(draw);\n}draw();"
    },
    {
      "id": "birthday",
      "title": "Birthday candles & wishes",
      "source": "const canvas=document.getElementById(\"art\"),ctx=canvas.getContext(\"2d\");\nconst name=\"YOUR NAME\"; // Change this for the birthday star!\nconst wishes=[\"Today the universe celebrates YOU ✨\",\n \"I hope your smile never runs out\",\n \"May every dream come true\",\n \"I am grateful you're in my life.\",\n \"HAPPY BIRTHDAY ♡\"];\nlet frame=0;\nfunction draw(){\n const w=canvas.width=Math.max(400,innerWidth*devicePixelRatio);\n const h=canvas.height=Math.max(330,innerHeight*devicePixelRatio);\n const s=Math.min(w/900,h/560),cx=w/2;\n ctx.fillStyle=\"#050713\";ctx.fillRect(0,0,w,h);\n for(let i=0;i<75;i++){\n  const x=(i*167.89)%w,y=(i*73.11+frame*(1+i%3)*.17)%h;\n  ctx.fillStyle=i%3?\"#816a9f\":\"#ffc46d\";ctx.fillRect(x,y,2*s,2*s);\n }\n ctx.textAlign=\"center\";ctx.fillStyle=\"#ffbadc\";\n ctx.shadowColor=\"#f36eac\";ctx.shadowBlur=24*s;\n ctx.font=\"bold \"+(48*s)+\"px Georgia\";ctx.fillText(\"Happy Birthday!\",cx,95*s);\n ctx.shadowBlur=0;ctx.font=(22*s)+\"px Georgia\";ctx.fillText(name,cx,135*s);\n for(let i=0;i<5;i++){\n  const x=cx+(i-2)*65*s,y=205*s;\n  ctx.fillStyle=[\"#ff94c8\",\"#f4b44c\",\"#97cdeb\",\"#c99af9\",\"#f9aca3\"][i];\n  ctx.fillRect(x-9*s,y,18*s,65*s);\n  ctx.fillStyle=\"#fff3a1\";ctx.beginPath();\n  ctx.ellipse(x,y-12*s-Math.sin(frame*.13+i)*5*s,7*s,17*s,0,0,Math.PI*2);ctx.fill();\n }\n ctx.font=(19*s)+\"px monospace\";\n wishes.forEach((line,i)=>{\n  const visible=Math.min(line.length,Math.max(0,Math.floor(frame*.6)-i*35));\n  if(!visible)return;\n  ctx.fillStyle=i===4?\"#ffa5d5\":\"#dce0ff\";\n  ctx.fillText(line.slice(0,visible),cx,(315+i*43)*s);\n });\n frame++;requestAnimationFrame(draw);\n}draw();"
    },
    {
      "id": "console",
      "title": "JavaScript console",
      "source": "console.log(\"Hello, CodeQuest!\");\nconsole.log(\"2 + 2 =\",2+2);"
    }
  ],
  "html": [
    {
      "id": "letter",
      "title": "Interactive love letter",
      "source": "<style>\nbody{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at top,#6c2c61,#100818 75%);font:16px Georgia;color:#fff}\n.card{max-width:480px;margin:10px;padding:40px;border:1px solid #fa9ac8;border-radius:28px;text-align:center;box-shadow:0 20px 80px #0008;background:#1a102caa;animation:rise .8s ease}\nh1{color:#ffb6da;font-size:40px}.heart{font-size:90px;animation:pulse 1.2s infinite}.hidden{display:none}\nbutton{padding:13px 25px;background:#fb81b6;color:#231024;border:0;border-radius:20px;cursor:pointer}\n@keyframes pulse{50%{transform:scale(1.18)}}@keyframes rise{from{opacity:0;transform:translateY(30px)}}\n</style>\n<main class=\"card\"><div class=\"heart\">💖</div><h1>For you...</h1>\n<p>I made this little corner of the internet just to make you smile.</p>\n<button onclick=\"document.getElementById('secret').classList.remove('hidden')\">Open my surprise</button>\n<p id=\"secret\" class=\"hidden\">You mean the world to me. Happy Birthday! ✨</p></main>"
    }
  ],
  "css": [
    {
      "id": "heart",
      "title": "Glowing CSS heart",
      "source": "#display{display:grid;justify-items:center;gap:10px;min-height:100vh;background:radial-gradient(circle,#561433,#07040c 70%);}\n#display h1{font:48px Georgia;color:#ffc1e7}\n#display p{color:#ffd8ef}\n#display button{background:#ff85b4;color:#2b0a1d;transition:transform .2s}\n#display button:hover{transform:scale(1.1)}\n.heart{font-size:130px;color:#ff3d7e;filter:drop-shadow(0 0 40px #ff0044);animation:beat 1.2s ease-in-out infinite}\n@keyframes beat{50%{transform:scale(1.3)}}"
    }
  ],
  "python": [
    {
      "id": "heart",
      "title": "Python ASCII heart",
      "source": "name=\"My love\"\nprint(\"A little heart just for\",name)\nfor y in range(15,-16,-1):\n    row=\"\"\n    for x in range(-30,31):\n        a,b=x/20,y/10\n        heart=(a*a+b*b-1)**3-a*a*b*b*b\n        row+=\"♥\" if heart<=0 else \" \"\n    print(row)\nprint(\"Happy birthday! You are wonderful.\")"
    },
    {
      "id": "hello",
      "title": "Python hello world",
      "source": "for i in range(1,6):\n    print(\"Step\",i,\"♥\")"
    }
  ],
  "csharp": [
    {
      "id": "heart",
      "title": "C# birthday message",
      "source": "using System;\nConsole.WriteLine(\"╔══════════════════════════╗\");\nConsole.WriteLine(\"║    HAPPY BIRTHDAY! ♥     ║\");\nConsole.WriteLine(\"╚══════════════════════════╝\");\nfor(int i=0;i<5;i++) Console.WriteLine(new string('♥',i*2+1));\nConsole.WriteLine(\"You make the world brighter.\");"
    },
    {
      "id": "hello",
      "title": "C# hello world",
      "source": "using System;\nConsole.WriteLine(\"Hello CodeQuest!\");"
    }
  ]
});
export function exampleFor(language,id){const options=TERMINAL_EXAMPLES[language]||[];return options.find(x=>x.id===id)||options[0]||null;}

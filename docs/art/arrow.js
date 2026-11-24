// a heavy arrow from (x,y) of length len; dir 'right' or 'down'
window.arrow=function(ctx,x,y,len,dir,color,w){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
if(dir==='down'){ctx.moveTo(x,y);ctx.lineTo(x,y+len);ctx.moveTo(x-len*.28,y+len*.72);ctx.lineTo(x,y+len);ctx.lineTo(x+len*.28,y+len*.72);}
else{ctx.moveTo(x,y);ctx.lineTo(x+len,y);ctx.moveTo(x+len*.72,y-len*.28);ctx.lineTo(x+len,y);ctx.lineTo(x+len*.72,y+len*.28);}
ctx.stroke();ctx.restore();};

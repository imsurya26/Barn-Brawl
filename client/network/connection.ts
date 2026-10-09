import type { ClientMessage,ServerMessage,Snapshot } from '../../shared/protocol';
export class Connection {
  socket?:WebSocket; id=''; token=''; code=''; state?:Snapshot; status='CONNECTING'; retry?:ReturnType<typeof setTimeout>; closed=false; retryStart=0;
  onState:(s:Snapshot)=>void=()=>{}; onStatus:()=>void=()=>{}; onNotice:(m:string)=>void=()=>{};
  connect() {
    clearTimeout(this.retry); this.closed=false;
    const url=import.meta.env.VITE_GAME_SERVER_URL || `${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`;
    this.socket=new WebSocket(url);
    this.socket.onopen=()=>{this.status='ONLINE'; this.onStatus(); if(this.token) this.send({type:'resume',token:this.token,code:this.code}); this.retryStart=0;};
    this.socket.onmessage=e=>{ const m=JSON.parse(e.data) as ServerMessage;
      if(m.type==='welcome') {this.id=m.id;this.token=m.token;this.code=m.code;this.onStatus();}
      if(m.type==='state') {this.state=m.state;this.onState(m.state);}
      if(m.type==='error'||m.type==='notice') {this.onNotice(m.message);if(m.type==='error' && m.message.startsWith('Reconnect window')) {this.leave();this.onStatus();}}
    };
    this.socket.onclose=()=>{ if(this.closed)return; this.status='DISCONNECTED';this.onStatus(); this.retryStart||=Date.now(); if(Date.now()-this.retryStart<25000) this.retry=setTimeout(()=>this.connect(),1200); else this.onNotice('Server unavailable. Return to the menu and try again.'); };
    this.socket.onerror=()=>{};
  }
  send(message:ClientMessage) { if(this.socket?.readyState===WebSocket.OPEN) this.socket.send(JSON.stringify(message)); else if(message.type!=='input') this.onNotice('Connecting to the farm server. Please try again in a moment.'); }
  leave() {this.send({type:'leave'});this.id='';this.token='';this.code='';this.state=undefined;}
}

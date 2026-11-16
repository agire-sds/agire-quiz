import QRCode from 'qrcode';

type Kind='classic'|'road'|'poll'|'brainstorm';
const path:Record<Kind,string>={classic:'#/join',road:'#/road/join',poll:'#/poll/join',brainstorm:'#/brainstorm/join'};
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

export async function printPreparationSheet(kind:Kind,title:string,name:string,pin:string){
  if(!/^\d{6}$/.test(pin))throw Error('PIN de la préparation indisponible');
  const page=window.open('','_blank','width=900,height=1100');
  if(!page)throw Error('Autorisez la fenêtre de la fiche à imprimer');
  try{
    const joinUrl=`${location.origin}${import.meta.env.BASE_URL}?pin=${pin}${path[kind]}`;
    const qr=await QRCode.toDataURL(joinUrl,{width:720,margin:2,errorCorrectionLevel:'M'});
    const logo=`${location.origin}${import.meta.env.BASE_URL}logo-agire-quiz.png`;
    page.document.open();
    page.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>AGIRE Quiz - ${escapeHtml(name)}</title><style>
      @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1b2937;margin:0;text-align:center}.sheet{min-height:245mm;border:2px solid #7b9e28;border-radius:16px;padding:20mm 14mm}.logo{width:170px;max-height:100px;object-fit:contain}h1{font-size:28px;margin:12mm 0 4mm}.quiz{font-size:21px;margin:0 0 3mm}.prep{font-size:16px;color:#526276;margin:0 0 12mm}.pin-label{font-size:18px;margin:0}.pin{font-size:54px;font-weight:800;letter-spacing:8px;margin:3mm 0 8mm}.qr{width:105mm;height:105mm;object-fit:contain}.url{font-size:12px;overflow-wrap:anywhere;margin:6mm 0 0}.hint{font-size:17px;margin:5mm 0}.print{margin:15px auto;padding:12px 20px;font-size:17px;background:#18784e;color:white;border:0;border-radius:8px;cursor:pointer}@media print{.print{display:none}.sheet{border-color:#7b9e28}}
    </style></head><body><button class="print" onclick="window.print()">Imprimer ou enregistrer en PDF</button><main class="sheet"><img class="logo" src="${logo}" alt="AGIRE Quiz"><h1>Rejoindre le quiz</h1><p class="quiz">${escapeHtml(title)}</p><p class="prep">${escapeHtml(name)}</p><p class="pin-label">Code PIN</p><p class="pin">${pin}</p><img class="qr" src="${qr}" alt="QR code de connexion"><p class="hint">Scannez le QR code avec votre téléphone.</p><p class="url">${escapeHtml(joinUrl)}</p></main></body></html>`);
    page.document.close();
    page.opener=null;
  }catch(error){page.close();throw error}
}

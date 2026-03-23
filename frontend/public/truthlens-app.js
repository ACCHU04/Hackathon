var DEMOS=[
  "The Eiffel Tower is located in London and was built in 1950. It stands 330 metres tall and attracts over 7 million visitors annually. The tower was designed by Gustave Eiffel.",
  "NASA's James Webb Space Telescope was launched on December 25, 2021 and cost approximately $10 billion to develop. It orbits the Sun at the L2 point, 1.5 million kilometres from Earth.",
  "The United States has the world's largest economy with a GDP of $25.46 trillion in 2022. The unemployment rate fell to 3.4% in early 2023. The Federal Reserve raised rates 11 times in 2022-2023."
];
var MOCK=[
  {id:"c1",text:"The Eiffel Tower is located in London.",span:[0,37],verdict:"FALSE",conf:.97,type:"location",conflict:true,conflictReason:"Wikipedia confirms the Eiffel Tower is in Paris, France.",wwc:["An official City of London statement"],evidence:[{title:"Eiffel Tower — Wikipedia",url:"#",snippet:"A wrought-iron lattice tower on the Champ de Mars in Paris, France.",label:"wikipedia"},{title:"Britannica",url:"#",snippet:"Iron lattice tower on the Champ-de-Mars in Paris.",label:"cited"}],pinned:false,accepted:false},
  {id:"c2",text:"The Eiffel Tower was built in 1950.",span:[38,74],verdict:"FALSE",conf:.98,type:"temporal",conflict:false,conflictReason:"",wwc:["A revised record showing 1950"],evidence:[{title:"History.com",url:"#",snippet:"Built between 1887 and 1889 as the entrance arch for the 1889 World's Fair.",label:"cited"}],pinned:false,accepted:false},
  {id:"c3",text:"The Eiffel Tower stands 330 metres tall.",span:[75,115],verdict:"TRUE",conf:.94,type:"numeric",conflict:false,conflictReason:"",wwc:["A new survey showing different height"],evidence:[{title:"Official Eiffel Tower Site",url:"#",snippet:"The Eiffel Tower is 330 m tall including the broadcasting aerial.",label:"cited"}],pinned:false,accepted:false},
  {id:"c4",text:"The tower was designed by Gustave Eiffel.",span:[116,172],verdict:"PARTIALLY_TRUE",conf:.74,type:"entity",conflict:true,conflictReason:"Sauvestre and Nouguier were primary designers under Eiffel's company.",wwc:["Definitive attribution from primary sources"],evidence:[{title:"Wikipedia — Gustave Eiffel",url:"#",snippet:"Design by Sauvestre and Nouguier under Eiffel et Compagnie.",label:"wikipedia"}],pinned:false,accepted:false}
];
var NQ_SUGGESTIONS=[
  {icon:"calendar",text:"When was the Eiffel Tower actually built?"},
  {icon:"map-pin",text:"Where exactly is the Eiffel Tower located?"},
  {icon:"ruler",text:"What is the exact height of the Eiffel Tower?"},
  {icon:"user",text:"Who really designed the Eiffel Tower?"},
  {icon:"globe",text:"How many tourists visit the Eiffel Tower?"},
  {icon:"info",text:"What is the Eiffel Tower made of?"}
];
var NQ_ANSWERS={
  "when":{claims:[{text:"Construction began in January 1887.",v:"TRUE",conf:.99},{text:"The tower was completed on March 31, 1889.",v:"TRUE",conf:.98}],reasoning:"Multiple sources confirm it was built 1887-1889, not 1950."},
  "where":{claims:[{text:"The Eiffel Tower is located in Paris, France.",v:"TRUE",conf:.99},{text:"It stands on the Champ de Mars near the Seine River.",v:"TRUE",conf:.97}],reasoning:"All sources confirm Paris, France — 7th arrondissement on the Champ de Mars."},
  "height":{claims:[{text:"The Eiffel Tower stands 330 m (1,083 ft) tall.",v:"TRUE",conf:.94},{text:"Without the antenna it measures 300.65 m.",v:"TRUE",conf:.92}],reasoning:"Official sources confirm 330m including the broadcasting aerial."},
  "who":{claims:[{text:"Conceived by engineers Nouguier and Sauvestre.",v:"TRUE",conf:.88},{text:"Gustave Eiffel's company built it, giving him naming credit.",v:"PARTIALLY_TRUE",conf:.82}],reasoning:"Design credit is nuanced — Eiffel owned the company but detailed engineering was by Sauvestre and Nouguier."},
  "default":{claims:[{text:"Verified claim based on Wikipedia and Britannica sources.",v:"TRUE",conf:.85},{text:"Supporting evidence found across multiple trusted domains.",v:"TRUE",conf:.80}],reasoning:"Cross-referenced against Wikipedia, Britannica, and official sources."}
};
var VM={
  FALSE:{l:"FALSE",color:"var(--red)",bg:"rgba(255,59,92,.08)",bdr:"rgba(255,59,92,.28)",stripe:"#FF3B5C",rot:"-4deg"},
  TRUE:{l:"VERIFIED",color:"var(--green)",bg:"rgba(0,255,136,.07)",bdr:"rgba(0,255,136,.28)",stripe:"#00FF88",rot:"-2deg"},
  PARTIALLY_TRUE:{l:"PARTIAL",color:"var(--amber)",bg:"rgba(255,184,0,.07)",bdr:"rgba(255,184,0,.28)",stripe:"#FFB800",rot:"-3deg"},
  UNVERIFIABLE:{l:"UNCLEAR",color:"rgba(232,244,255,.35)",bg:"rgba(232,244,255,.03)",bdr:"rgba(232,244,255,.1)",stripe:"rgba(232,244,255,.15)",rot:"-1deg"},
  PENDING:{l:"SCANNING",color:"var(--cyan)",bg:"rgba(0,212,255,.05)",bdr:"rgba(0,212,255,.2)",stripe:"rgba(0,212,255,.3)",rot:"0deg"}
};
var STAGES=["extracting","searching","verifying","conflicts","detecting","done"];
var SMSG=["Extracting claims…","Searching Wikipedia + web…","Verifying with LangChain…","Detecting conflicts…","AI content check…","Complete ✓"];
var SLABS=["Extract","Search","Verify","Conflicts","AI Check"];
var SICONS=["cpu","search","shield-check","alert-triangle","bot"];

/* ─── i18n TRANSLATIONS ─── */
var LANG_FLAGS={en:"\ud83c\uddfa\ud83c\uddf8",hi:"\ud83c\uddee\ud83c\uddf3",ta:"\ud83c\uddee\ud83c\uddf3",kn:"\ud83c\uddee\ud83c\uddf3",te:"\ud83c\uddee\ud83c\uddf3",de:"\ud83c\udde9\ud83c\uddea"};
var LANG_RTL=[];
var curLang="en";
var I18N={
  en:{nav_analyze:"Analyze",nav_demos:"Demos",nav_reports:"Reports",nav_docs:"Docs",hero_badge:"AI-Powered Fact Verification Engine",hero_title:'Every Claim.<br><span style="color:var(--cyan);text-shadow:0 0 22px rgba(0,212,255,.4)">Verified.</span>',hero_desc:"Upload a PDF, paste an article, record voice \u2014 TruthLens extracts every claim and verifies it against Wikipedia + web.",tab_text:"Text / URL",tab_file:"Upload File",tab_voice:"Voice",btn_run:"Run Analysis",empty_title:"READY TO SCAN",empty_desc:"Load a demo or enter text, then click Run Analysis.",placeholder:"Paste a URL (https://\u2026) or article text\u2026\n\nLoad a demo below or press \u2318\u21b5",quick_demos:"Quick demos \u2192",drop_title:"Drop file or click to browse",drop_desc:"PDF, DOCX, TXT, HTML, MD \u00b7 up to 10 MB",mic_start:"Click microphone to start recording",mic_rec:"Recording\u2026",accuracy:"Accuracy",accurate:"accurate",breakdown:"Breakdown",claims_label:"Claims",conflicts_label:"Conflicts",true_label:"True",false_label:"False",partial_label:"Partial",verdict_key:"Verdict Key",vk_true:"True",vk_true_desc:"Verified by sources",vk_false:"False",vk_false_desc:"Contradicted",vk_partial:"Partial",vk_partial_desc:"Mixed evidence",vk_unverifiable:"Unverifiable",vk_unverifiable_desc:"No evidence",ask_query:"Ask New Query",ask_query_desc:"Ask a follow-up about these claims",ai_detection:"AI Detection",ai_prob:"AI probability",filter_label:"Filter:",filter_all:"All",filter_true:"True",filter_false:"False",filter_partial:"Partial",filter_conflict:"Conflict",extracted_claims:"EXTRACTED CLAIMS",settings_title:"Settings",llm_model:"LLM Model",search_provider:"Search Provider",save_settings:"Save Settings",override_title:"Override Verdict",new_verdict:"New verdict",reason:"Reason",apply_override:"Apply Override",confidence:"Confidence",to_run:"to run",lang_changed:"Language changed"},
  hi:{nav_analyze:"\u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923",nav_demos:"\u0921\u0947\u092e\u094b",nav_reports:"\u0930\u093f\u092a\u094b\u0930\u094d\u091f",nav_docs:"\u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c\u093c",hero_badge:"\u090f\u0906\u0908-\u0938\u0902\u091a\u093e\u0932\u093f\u0924 \u0924\u0925\u094d\u092f \u0938\u0924\u094d\u092f\u093e\u092a\u0928 \u0907\u0902\u091c\u0928",hero_title:'\u0939\u0930 \u0926\u093e\u0935\u093e\u0964<br><span style="color:var(--cyan);text-shadow:0 0 22px rgba(0,212,255,.4)">\u0938\u0924\u094d\u092f\u093e\u092a\u093f\u0924\u0964</span>',hero_desc:"PDF \u0905\u092a\u0932\u094b\u0921 \u0915\u0930\u0947\u0902, \u0932\u0947\u0916 \u092a\u0947\u0938\u094d\u091f \u0915\u0930\u0947\u0902, \u0906\u0935\u093e\u091c\u093c \u0930\u093f\u0915\u0949\u0930\u094d\u0921 \u0915\u0930\u0947\u0902 \u2014 TruthLens \u0939\u0930 \u0926\u093e\u0935\u0947 \u0915\u094b \u0928\u093f\u0915\u093e\u0932\u0924\u093e \u0939\u0948 \u0914\u0930 \u0935\u093f\u0915\u093f\u092a\u0940\u0921\u093f\u092f\u093e + \u0935\u0947\u092c \u0938\u0947 \u0938\u0924\u094d\u092f\u093e\u092a\u093f\u0924 \u0915\u0930\u0924\u093e \u0939\u0948\u0964",tab_text:"\u091f\u0947\u0915\u094d\u0938\u094d\u091f / URL",tab_file:"\u092b\u093c\u093e\u0907\u0932 \u0905\u092a\u0932\u094b\u0921",tab_voice:"\u0906\u0935\u093e\u091c\u093c",btn_run:"\u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u091a\u0932\u093e\u090f\u0902",empty_title:"\u0938\u094d\u0915\u0948\u0928 \u0915\u0947 \u0932\u093f\u090f \u0924\u0948\u092f\u093e\u0930",empty_desc:"\u0921\u0947\u092e\u094b \u0932\u094b\u0921 \u0915\u0930\u0947\u0902 \u092f\u093e \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902, \u092b\u093f\u0930 \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u091a\u0932\u093e\u090f\u0902 \u0915\u094d\u0932\u093f\u0915 \u0915\u0930\u0947\u0902\u0964",placeholder:"URL \u092a\u0947\u0938\u094d\u091f \u0915\u0930\u0947\u0902 (https://\u2026) \u092f\u093e \u0932\u0947\u0916\u2026\n\n\u0928\u0940\u091a\u0947 \u0921\u0947\u092e\u094b \u0932\u094b\u0921 \u0915\u0930\u0947\u0902 \u092f\u093e \u2318\u21b5 \u0926\u092c\u093e\u090f\u0902",quick_demos:"\u0924\u094d\u0935\u0930\u093f\u0924 \u0921\u0947\u092e\u094b \u2192",drop_title:"\u092b\u093c\u093e\u0907\u0932 \u0921\u094d\u0930\u0949\u092a \u0915\u0930\u0947\u0902 \u092f\u093e \u092c\u094d\u0930\u093e\u0909\u091c\u093c \u0915\u0930\u0947\u0902",drop_desc:"PDF, DOCX, TXT, HTML, MD \u00b7 10 MB \u0924\u0915",mic_start:"\u0930\u093f\u0915\u0949\u0930\u094d\u0921\u093f\u0902\u0917 \u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u092e\u093e\u0907\u0915\u094d\u0930\u094b\u092b\u094b\u0928 \u0915\u094d\u0932\u093f\u0915 \u0915\u0930\u0947\u0902",mic_rec:"\u0930\u093f\u0915\u0949\u0930\u094d\u0921\u093f\u0902\u0917\u2026",accuracy:"\u0938\u091f\u0940\u0915\u0924\u093e",accurate:"\u0938\u091f\u0940\u0915",breakdown:"\u0935\u093f\u0935\u0930\u0923",claims_label:"\u0926\u093e\u0935\u0947",conflicts_label:"\u0935\u093f\u0930\u094b\u0927",true_label:"\u0938\u0924\u094d\u092f",false_label:"\u0905\u0938\u0924\u094d\u092f",partial_label:"\u0906\u0902\u0936\u093f\u0915",verdict_key:"\u0928\u093f\u0930\u094d\u0923\u092f \u0915\u0941\u0902\u091c\u0940",vk_true:"\u0938\u0924\u094d\u092f",vk_true_desc:"\u0938\u094d\u0930\u094b\u0924\u094b\u0902 \u0926\u094d\u0935\u093e\u0930\u093e \u0938\u0924\u094d\u092f\u093e\u092a\u093f\u0924",vk_false:"\u0905\u0938\u0924\u094d\u092f",vk_false_desc:"\u0916\u0902\u0921\u0928",vk_partial:"\u0906\u0902\u0936\u093f\u0915",vk_partial_desc:"\u092e\u093f\u0936\u094d\u0930\u093f\u0924 \u0938\u093e\u0915\u094d\u0937\u094d\u092f",vk_unverifiable:"\u0905\u0938\u0924\u094d\u092f\u093e\u092a\u0928\u0940\u092f",vk_unverifiable_desc:"\u0915\u094b\u0908 \u0938\u093e\u0915\u094d\u0937\u094d\u092f \u0928\u0939\u0940\u0902",ask_query:"\u0928\u092f\u093e \u092a\u094d\u0930\u0936\u094d\u0928 \u092a\u0942\u091b\u0947\u0902",ask_query_desc:"\u0907\u0928 \u0926\u093e\u0935\u094b\u0902 \u0915\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902 \u092a\u0942\u091b\u0947\u0902",ai_detection:"\u090f\u0906\u0908 \u092a\u0939\u091a\u093e\u0928",ai_prob:"\u090f\u0906\u0908 \u0938\u0902\u092d\u093e\u0935\u0928\u093e",filter_label:"\u092b\u093c\u093f\u0932\u094d\u091f\u0930:",filter_all:"\u0938\u092d\u0940",filter_true:"\u0938\u0924\u094d\u092f",filter_false:"\u0905\u0938\u0924\u094d\u092f",filter_partial:"\u0906\u0902\u0936\u093f\u0915",filter_conflict:"\u0935\u093f\u0930\u094b\u0927",extracted_claims:"\u0928\u093f\u0915\u093e\u0932\u0947 \u0917\u090f \u0926\u093e\u0935\u0947",settings_title:"\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938",llm_model:"LLM \u092e\u0949\u0921\u0932",search_provider:"\u0916\u094b\u091c \u092a\u094d\u0930\u0926\u093e\u0924\u093e",save_settings:"\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938 \u0938\u0947\u0935 \u0915\u0930\u0947\u0902",override_title:"\u0928\u093f\u0930\u094d\u0923\u092f \u092c\u0926\u0932\u0947\u0902",new_verdict:"\u0928\u092f\u093e \u0928\u093f\u0930\u094d\u0923\u092f",reason:"\u0915\u093e\u0930\u0923",apply_override:"\u0913\u0935\u0930\u0930\u093e\u0907\u0921 \u0932\u093e\u0917\u0942 \u0915\u0930\u0947\u0902",confidence:"\u0935\u093f\u0936\u094d\u0935\u093e\u0938",to_run:"\u091a\u0932\u093e\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f",lang_changed:"\u092d\u093e\u0937\u093e \u092c\u0926\u0932\u0940"},
  ta:{nav_analyze:"\u0bb5\u0bbf\u0b9a\u0bbe\u0bb0\u0ba3\u0bc8",nav_demos:"\u0b9f\u0bc6\u0bae\u0bcb",nav_reports:"\u0b85\u0bb1\u0bbf\u0b95\u0bcd\u0b95\u0bc8",nav_docs:"\u0b86\u0bb5\u0ba3\u0b99\u0bcd\u0b95\u0bb3\u0bcd",hero_badge:"AI \u0b9a\u0bbe\u0bb2\u0bbf\u0ba4 \u0b89\u0ba3\u0bcd\u0bae\u0bc8 \u0b9a\u0bb0\u0bbf\u0baa\u0bbe\u0bb0\u0bcd\u0baa\u0bcd\u0baa\u0bc1 \u0b8e\u0ba3\u0bcd\u0b9c\u0bbf\u0ba9\u0bcd",hero_title:'\u0b92\u0bb5\u0bcd\u0bb5\u0bcb\u0bb0\u0bcd \u0b95\u0bc2\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd.<br><span style="color:var(--cyan);text-shadow:0 0 22px rgba(0,212,255,.4)">\u0b9a\u0bb0\u0bbf\u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.</span>',hero_desc:"PDF \u0baa\u0ba4\u0bbf\u0bb5\u0bc7\u0bb1\u0bcd\u0bb1\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0b95\u0b9f\u0bcd\u0b9f\u0bc1\u0bb0\u0bc8\u0b95\u0bb3\u0bc8 \u0b92\u0b9f\u0bcd\u0b9f\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0baa\u0ba4\u0bbf\u0bb5\u0bc1 \u0b9a\u0bc6\u0baf\u0bcd\u0baf\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u2014 TruthLens \u0b92\u0bb5\u0bcd\u0bb5\u0bcb\u0bb0\u0bcd \u0b95\u0bc2\u0bb1\u0bcd\u0bb1\u0bc8\u0baf\u0bc1\u0bae\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0ba4\u0bcd\u0ba4\u0bc6\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1 \u0bb5\u0bbf\u0b95\u0bcd\u0b95\u0bbf\u0baa\u0bc0\u0b9f\u0bbf\u0baf\u0bbe + \u0bb5\u0bc6\u0baa\u0bcd \u0bae\u0bc2\u0bb2\u0bae\u0bcd \u0b9a\u0bb0\u0bbf\u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bbf\u0bb1\u0ba4\u0bc1.",tab_text:"\u0b89\u0bb0\u0bc8 / URL",tab_file:"\u0b95\u0bcb\u0baa\u0bcd\u0baa\u0bc1 \u0baa\u0ba4\u0bbf\u0bb5\u0bc7\u0bb1\u0bcd\u0bb1\u0bc1",tab_voice:"\u0b95\u0bc1\u0bb0\u0bb2\u0bcd",btn_run:"\u0bb5\u0bbf\u0b9a\u0bbe\u0bb0\u0ba3\u0bc8 \u0b9a\u0bc6\u0baf\u0bcd",empty_title:"\u0b8e\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0ba4\u0bcd \u0ba4\u0baf\u0bbe\u0bb0\u0bcd",empty_desc:"\u0b9f\u0bc6\u0bae\u0bcb \u0b8f\u0bb1\u0bcd\u0bb1\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b85\u0bb2\u0bcd\u0bb2\u0ba4\u0bc1 \u0b89\u0bb0\u0bc8\u0baf\u0bc8 \u0b89\u0bb3\u0bcd\u0bb3\u0bbf\u0b9f\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd, \u0baa\u0bbf\u0ba9\u0bcd\u0ba9\u0bb0\u0bcd \u0bb5\u0bbf\u0b9a\u0bbe\u0bb0\u0ba3\u0bc8 \u0b9a\u0bc6\u0baf\u0bcd \u0b95\u0bcd\u0bb3\u0bbf\u0b95\u0bcd \u0b9a\u0bc6\u0baf\u0bcd\u0baf\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd.",placeholder:"URL \u0b92\u0b9f\u0bcd\u0b9f\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd (https://\u2026) \u0b85\u0bb2\u0bcd\u0bb2\u0ba4\u0bc1 \u0b89\u0bb0\u0bc8\u2026",quick_demos:"\u0bb5\u0bbf\u0bb0\u0bc8\u0bb5\u0bc1 \u0b9f\u0bc6\u0bae\u0bcb \u2192",drop_title:"\u0b95\u0bcb\u0baa\u0bcd\u0baa\u0bc8 \u0b87\u0bb4\u0bc1\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd \u0b85\u0bb2\u0bcd\u0bb2\u0ba4\u0bc1 \u0b95\u0bcd\u0bb3\u0bbf\u0b95\u0bcd \u0b9a\u0bc6\u0baf\u0bcd",drop_desc:"PDF, DOCX, TXT, HTML, MD \u00b7 10 MB \u0bb5\u0bb0\u0bc8",mic_start:"\u0baa\u0ba4\u0bbf\u0bb5\u0bc1 \u0b9a\u0bc6\u0baf\u0bcd\u0baf \u0bae\u0bc8\u0b95\u0bcd\u0b95\u0bc8 \u0b95\u0bcd\u0bb3\u0bbf\u0b95\u0bcd \u0b9a\u0bc6\u0baf\u0bcd\u0baf\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd",mic_rec:"\u0baa\u0ba4\u0bbf\u0bb5\u0bc1 \u0b9a\u0bc6\u0baf\u0bcd\u0b95\u0bbf\u0bb1\u0ba4\u0bc1\u2026",accuracy:"\u0ba4\u0bc1\u0bb2\u0bcd\u0bb2\u0bbf\u0baf\u0bae\u0bcd",accurate:"\u0ba4\u0bc1\u0bb2\u0bcd\u0bb2\u0bbf\u0baf\u0bae\u0bcd",breakdown:"\u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",claims_label:"\u0b95\u0bc2\u0bb1\u0bcd\u0bb1\u0bc1\u0b95\u0bb3\u0bcd",conflicts_label:"\u0bae\u0bc1\u0bb0\u0ba3\u0bcd\u0baa\u0bbe\u0b9f\u0bc1\u0b95\u0bb3\u0bcd",true_label:"\u0b89\u0ba3\u0bcd\u0bae\u0bc8",false_label:"\u0baa\u0bca\u0baf\u0bcd",partial_label:"\u0baa\u0b95\u0bc1\u0ba4\u0bbf",verdict_key:"\u0ba4\u0bc0\u0bb0\u0bcd\u0baa\u0bcd\u0baa\u0bc1 \u0b95\u0bc1\u0bb1\u0bbf\u0baf\u0bc0\u0b9f\u0bc1",vk_true:"\u0b89\u0ba3\u0bcd\u0bae\u0bc8",vk_true_desc:"\u0b86\u0ba4\u0bbe\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bbe\u0bb2\u0bcd \u0b9a\u0bb0\u0bbf\u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1",vk_false:"\u0baa\u0bca\u0baf\u0bcd",vk_false_desc:"\u0bae\u0bb1\u0bc1\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1",vk_partial:"\u0baa\u0b95\u0bc1\u0ba4\u0bbf",vk_partial_desc:"\u0b95\u0bb2\u0ba8\u0bcd\u0ba4 \u0b86\u0ba4\u0bbe\u0bb0\u0b99\u0bcd\u0b95\u0bb3\u0bcd",vk_unverifiable:"\u0b9a\u0bb0\u0bbf\u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95 \u0b87\u0baf\u0bb2\u0bbe\u0ba4\u0ba4\u0bc1",vk_unverifiable_desc:"\u0b86\u0ba4\u0bbe\u0bb0\u0bae\u0bcd \u0b87\u0bb2\u0bcd\u0bb2\u0bc8",ask_query:"\u0baa\u0bc1\u0ba4\u0bbf\u0baf \u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf",ask_query_desc:"\u0b87\u0ba8\u0bcd\u0ba4 \u0b95\u0bc2\u0bb1\u0bcd\u0bb1\u0bc1\u0b95\u0bb3\u0bcd \u0baa\u0bb1\u0bcd\u0bb1\u0bbf \u0b95\u0bc7\u0bb3\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd",ai_detection:"AI \u0b95\u0ba3\u0bcd\u0b9f\u0bb1\u0bbf\u0ba4\u0bb2\u0bcd",ai_prob:"AI \u0ba8\u0bbf\u0b95\u0bb4\u0bcd\u0ba4\u0b95\u0bb5\u0bc1",filter_label:"\u0bb5\u0b9f\u0bbf\u0b95\u0b9f\u0bcd\u0b9f\u0bbf:",filter_all:"\u0b85\u0ba9\u0bc8\u0ba4\u0bcd\u0ba4\u0bc1\u0bae\u0bcd",filter_true:"\u0b89\u0ba3\u0bcd\u0bae\u0bc8",filter_false:"\u0baa\u0bca\u0baf\u0bcd",filter_partial:"\u0baa\u0b95\u0bc1\u0ba4\u0bbf",filter_conflict:"\u0bae\u0bc1\u0bb0\u0ba3\u0bcd\u0baa\u0bbe\u0b9f\u0bc1",extracted_claims:"\u0baa\u0bbf\u0bb0\u0bbf\u0ba4\u0bcd\u0ba4\u0bc6\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0b95\u0bc2\u0bb1\u0bcd\u0bb1\u0bc1\u0b95\u0bb3\u0bcd",settings_title:"\u0b85\u0bae\u0bc8\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bcd",llm_model:"LLM \u0bae\u0bbe\u0ba4\u0bbf\u0bb0\u0bbf",search_provider:"\u0ba4\u0bc7\u0b9f\u0bb2\u0bcd \u0b85\u0bae\u0bc8\u0baa\u0bcd\u0baa\u0bbe\u0bb3\u0bb0\u0bcd",save_settings:"\u0b9a\u0bc7\u0bae\u0bbf",override_title:"\u0ba4\u0bc0\u0bb0\u0bcd\u0baa\u0bcd\u0baa\u0bc1 \u0bae\u0bbe\u0bb1\u0bcd\u0bb1\u0bc1",new_verdict:"\u0baa\u0bc1\u0ba4\u0bbf\u0baf \u0ba4\u0bc0\u0bb0\u0bcd\u0baa\u0bcd\u0baa\u0bc1",reason:"\u0b95\u0bbe\u0bb0\u0ba3\u0bae\u0bcd",apply_override:"\u0baa\u0baf\u0ba9\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1",confidence:"\u0ba8\u0bae\u0bcd\u0baa\u0bbf\u0b95\u0bcd\u0b95\u0bc8",to_run:"\u0b9a\u0bc6\u0baf\u0bb2\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4",lang_changed:"\u0bae\u0bca\u0bb4\u0bbf \u0bae\u0bbe\u0bb1\u0bcd\u0bb1\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1"},
  kn:{nav_analyze:"\u0cb5\u0cbf\u0cb6\u0ccd\u0cb2\u0cc7\u0cb7\u0ca3\u0cc6",nav_demos:"\u0ca1\u0cc6\u0cae\u0ccb",nav_reports:"\u0cb5\u0cb0\u0ca6\u0cbf",nav_docs:"\u0ca6\u0cbe\u0c96\u0cb2\u0cc6\u0c97\u0cb3\u0cc1",hero_badge:"AI \u0c9a\u0cbe\u0cb2\u0cbf\u0ca4 \u0cb8\u0ca4\u0ccd\u0caf \u0caa\u0cb0\u0cbf\u0cb6\u0cc0\u0cb2\u0ca8\u0cc6 \u0c8e\u0c82\u0c9c\u0cbf\u0ca8\u0ccd",hero_title:'\u0caa\u0ccd\u0cb0\u0ca4\u0cbf \u0cb9\u0cc7\u0cb3\u0cbf\u0c95\u0cc6.<br><span style="color:var(--cyan);text-shadow:0 0 22px rgba(0,212,255,.4)">\u0caa\u0cb0\u0cbf\u0cb6\u0cc0\u0cb2\u0cbf\u0cb8\u0cb2\u0cbe\u0c97\u0cbf\u0ca6\u0cc6.</span>',hero_desc:"PDF \u0c85\u0caa\u0ccd\u0cb2\u0ccb\u0ca1\u0ccd \u0cae\u0cbe\u0ca1\u0cbf, \u0cb2\u0cc7\u0c96\u0ca8 \u0c85\u0c82\u0c9f\u0cbf\u0cb8\u0cbf, \u0ca7\u0ccd\u0cb5\u0ca8\u0cbf \u0cb0\u0cc6\u0c95\u0cbe\u0cb0\u0ccd\u0ca1\u0ccd \u0cae\u0cbe\u0ca1\u0cbf \u2014 TruthLens \u0caa\u0ccd\u0cb0\u0ca4\u0cbf \u0cb9\u0cc7\u0cb3\u0cbf\u0c95\u0cc6\u0caf\u0ca8\u0ccd\u0ca8\u0cc1 \u0cb9\u0cc6\u0c95\u0ccd\u0c95\u0cbf \u0cb5\u0cbf\u0c95\u0cbf\u0caa\u0cc0\u0ca1\u0cbf\u0caf + \u0cb5\u0cc6\u0cac\u0ccd \u0cae\u0cc2\u0cb2\u0c95 \u0caa\u0cb0\u0cbf\u0cb6\u0cc0\u0cb2\u0cbf\u0cb8\u0cc1\u0ca4\u0ccd\u0ca4\u0ca6\u0cc6.",tab_text:"\u0caa\u0ca0\u0ccd\u0caf / URL",tab_file:"\u0c95\u0ca1\u0ca4 \u0c85\u0caa\u0ccd\u0cb2\u0ccb\u0ca1\u0ccd",tab_voice:"\u0ca7\u0ccd\u0cb5\u0ca8\u0cbf",btn_run:"\u0cb5\u0cbf\u0cb6\u0ccd\u0cb2\u0cc7\u0cb7\u0ca3\u0cc6 \u0ca8\u0ca1\u0cc6\u0cb8\u0cbf",empty_title:"\u0cb8\u0ccd\u0c95\u0ccd\u0caf\u0cbe\u0ca8\u0ccd \u0cb8\u0cbf\u0ca6\u0ccd\u0ca7",empty_desc:"\u0ca1\u0cc6\u0cae\u0ccb \u0cb2\u0ccb\u0ca1\u0ccd \u0cae\u0cbe\u0ca1\u0cbf \u0c85\u0ca5\u0cb5\u0cbe \u0caa\u0ca0\u0ccd\u0caf \u0ca8\u0cae\u0cc2\u0ca6\u0cbf\u0cb8\u0cbf, \u0ca8\u0c82\u0ca4\u0cb0 \u0cb5\u0cbf\u0cb6\u0ccd\u0cb2\u0cc7\u0cb7\u0ca3\u0cc6 \u0ca8\u0ca1\u0cc6\u0cb8\u0cbf \u0c95\u0ccd\u0cb2\u0cbf\u0c95\u0ccd \u0cae\u0cbe\u0ca1\u0cbf.",placeholder:"URL (https://\u2026) \u0c85\u0ca5\u0cb5\u0cbe \u0caa\u0ca0\u0ccd\u0caf \u0c85\u0c82\u0c9f\u0cbf\u0cb8\u0cbf\u2026",quick_demos:"\u0ca4\u0ccd\u0cb5\u0cb0\u0cbf\u0ca4 \u0ca1\u0cc6\u0cae\u0ccb \u2192",drop_title:"\u0c95\u0ca1\u0ca4\u0cb5\u0ca8\u0ccd\u0ca8\u0cc1 \u0c8e\u0cb3\u0cc6\u0caf\u0cbf\u0cb0\u0cbf \u0c85\u0ca5\u0cb5\u0cbe \u0c95\u0ccd\u0cb2\u0cbf\u0c95\u0ccd \u0cae\u0cbe\u0ca1\u0cbf",drop_desc:"PDF, DOCX, TXT, HTML, MD \u00b7 10 MB \u0cb5\u0cb0\u0cc6\u0c97\u0cc6",mic_start:"\u0cb0\u0cc6\u0c95\u0cbe\u0cb0\u0ccd\u0ca1\u0cbf\u0c82\u0c97\u0ccd \u0caa\u0ccd\u0cb0\u0cbe\u0cb0\u0c82\u0cad\u0cbf\u0cb8\u0cb2\u0cc1 \u0cae\u0cc8\u0c95\u0ccd \u0c95\u0ccd\u0cb2\u0cbf\u0c95\u0ccd \u0cae\u0cbe\u0ca1\u0cbf",mic_rec:"\u0cb0\u0cc6\u0c95\u0cbe\u0cb0\u0ccd\u0ca1\u0cbf\u0c82\u0c97\u0ccd\u2026",accuracy:"\u0ca8\u0cbf\u0c96\u0cb0\u0ca4\u0cc6",accurate:"\u0ca8\u0cbf\u0c96\u0cb0",breakdown:"\u0cb5\u0cbf\u0cb5\u0cb0",claims_label:"\u0cb9\u0cc7\u0cb3\u0cbf\u0c95\u0cc6\u0c97\u0cb3\u0cc1",conflicts_label:"\u0cb8\u0c82\u0c98\u0cb0\u0ccd\u0cb7\u0c97\u0cb3\u0cc1",true_label:"\u0ca8\u0cbf\u0c9c",false_label:"\u0cb8\u0cc1\u0cb3\u0ccd\u0cb3\u0cc1",partial_label:"\u0cad\u0cbe\u0c97\u0cb6\u0c83",verdict_key:"\u0ca4\u0cc0\u0cb0\u0ccd\u0caa\u0cc1 \u0c95\u0cc0\u0cb2\u0cbf",vk_true:"\u0ca8\u0cbf\u0c9c",vk_true_desc:"\u0cae\u0cc2\u0cb2\u0c97\u0cb3\u0cbf\u0c82\u0ca6 \u0caa\u0cb0\u0cbf\u0cb6\u0cc0\u0cb2\u0cbf\u0cb8\u0cb2\u0cbe\u0c97\u0cbf\u0ca6\u0cc6",vk_false:"\u0cb8\u0cc1\u0cb3\u0ccd\u0cb3\u0cc1",vk_false_desc:"\u0cb5\u0cbf\u0cb0\u0cc1\u0ca6\u0ccd\u0ca7\u0cb5\u0cbe\u0c97\u0cbf\u0ca6\u0cc6",vk_partial:"\u0cad\u0cbe\u0c97\u0cb6\u0c83",vk_partial_desc:"\u0cae\u0cbf\u0cb6\u0ccd\u0cb0 \u0cb8\u0cbe\u0c95\u0ccd\u0cb7\u0ccd\u0caf",vk_unverifiable:"\u0caa\u0cb0\u0cbf\u0cb6\u0cc0\u0cb2\u0cbf\u0cb8\u0cb2\u0cbe\u0c97\u0ca6\u0cc1",vk_unverifiable_desc:"\u0cb8\u0cbe\u0c95\u0ccd\u0cb7\u0ccd\u0caf \u0c87\u0cb2\u0ccd\u0cb2",ask_query:"\u0cb9\u0cca\u0cb8 \u0caa\u0ccd\u0cb0\u0cb6\u0ccd\u0ca8\u0cc6",ask_query_desc:"\u0c88 \u0cb9\u0cc7\u0cb3\u0cbf\u0c95\u0cc6\u0c97\u0cb3 \u0c95\u0cc1\u0cb0\u0cbf\u0ca4\u0cc1 \u0c95\u0cc7\u0cb3\u0cbf",ai_detection:"AI \u0c97\u0cc1\u0cb0\u0cc1\u0ca4\u0cbf\u0cb8\u0cc1\u0cb5\u0cbf\u0c95\u0cc6",ai_prob:"AI \u0cb8\u0c82\u0cad\u0cb5\u0ca8\u0cc0\u0caf\u0ca4\u0cc6",filter_label:"\u0cb6\u0ccb\u0ca7\u0c95:",filter_all:"\u0c8e\u0cb2\u0ccd\u0cb2\u0cbe",filter_true:"\u0ca8\u0cbf\u0c9c",filter_false:"\u0cb8\u0cc1\u0cb3\u0ccd\u0cb3\u0cc1",filter_partial:"\u0cad\u0cbe\u0c97\u0cb6\u0c83",filter_conflict:"\u0cb8\u0c82\u0c98\u0cb0\u0ccd\u0cb7",extracted_claims:"\u0cb9\u0cc6\u0c95\u0ccd\u0c95\u0cbf\u0ca6 \u0cb9\u0cc7\u0cb3\u0cbf\u0c95\u0cc6\u0c97\u0cb3\u0cc1",settings_title:"\u0cb8\u0cc6\u0c9f\u0ccd\u0c9f\u0cbf\u0c82\u0c97\u0ccd\u0cb8\u0ccd",llm_model:"LLM \u0cae\u0cbe\u0ca1\u0cc6\u0cb2\u0ccd",search_provider:"\u0cb9\u0cc1\u0ca1\u0cc1\u0c95\u0cbe\u0c9f \u0c92\u0ca6\u0c97\u0cbf\u0cb8\u0cc1\u0cb5\u0cb5\u0cb0\u0cc1",save_settings:"\u0c89\u0cb3\u0cbf\u0cb8\u0cbf",override_title:"\u0ca4\u0cc0\u0cb0\u0ccd\u0caa\u0cc1 \u0cac\u0ca6\u0cb2\u0cbf\u0cb8\u0cbf",new_verdict:"\u0cb9\u0cca\u0cb8 \u0ca4\u0cc0\u0cb0\u0ccd\u0caa\u0cc1",reason:"\u0c95\u0cbe\u0cb0\u0ca3",apply_override:"\u0c85\u0ca8\u0ccd\u0cb5\u0caf\u0cbf\u0cb8\u0cc1",confidence:"\u0cb5\u0cbf\u0cb6\u0ccd\u0cb5\u0cbe\u0cb8",to_run:"\u0ca8\u0ca1\u0cc6\u0cb8\u0cc1",lang_changed:"\u0cad\u0cbe\u0cb7\u0cc6 \u0cac\u0ca6\u0cb2\u0cbe\u0c97\u0cbf\u0ca6\u0cc6"},
  te:{nav_analyze:"విశ్లేషణ",nav_demos:"డెమో",nav_reports:"నివేదికలు",nav_docs:"పత్రాలు",hero_badge:"AI ఆధారిత వాస్తవ ధృవీకరణ ఇంజన్",hero_title:'\u0c2a\u0c4d\u0c30\u0c24\u0c3f \u0c35\u0c3e\u0c26\u0c28.<br><span style="color:var(--cyan);text-shadow:0 0 22px rgba(0,212,255,.4)">\u0c27\u0c43\u0c35\u0c40\u0c15\u0c30\u0c3f\u0c02\u0c1a\u0c2c\u0c21\u0c3f\u0c02\u0c26\u0c3f.</span>',hero_desc:"PDF అప్‌లోడ్ చేయండి, వ్యాసాన్ని అతికించండి, గోని రెకార్డ్ చేయండి — TruthLens ప్రతి వాదనను సేకరించి ధృవీకరిస్తుంది.",tab_text:"టెక్స్ట్ / URL",tab_file:"ఫైల్ అప్‌లోడ్",tab_voice:"గోని",btn_run:"విశ్లేషణ ప్రారంభించు",empty_title:"స్కాన్‌కు సిద్ధం",empty_desc:"డెమో లోడ్ చేయండి లేదా టెక్స్ట్ నమోదు చేయండి, తర్వాత విశ్లేషణ క్లిక్ చేయండి.",placeholder:"URL (https://…) లేదా టెక్స్ట్ అతికించండి…",quick_demos:"త్వరిత డెమోలు →",drop_title:"ఫైల్ డ్రాగ్ చేయండి లేదా క్లిక్ చేయండి",drop_desc:"PDF, DOCX, TXT, HTML, MD · 10 MB వరకు",mic_start:"రెకార్డింగ్ ప్రారంభించడానికి మైక్ క్లిక్ చేయండి",mic_rec:"రెకార్డింగ్…",accuracy:"ఖచ్చితత్వం",accurate:"ఖచ్చితం",breakdown:"వివరాలు",claims_label:"వాదనలు",conflicts_label:"వైరుధ్యాలు",true_label:"నిజం",false_label:"అబద్ధం",partial_label:"పాక్షికం",verdict_key:"తీర్పు కీ",vk_true:"నిజం",vk_true_desc:"మూలాల ద్వారా ధృవీకరించబడింది",vk_false:"అబద్ధం",vk_false_desc:"వ్యతిరేకించబడింది",vk_partial:"పాక్షికం",vk_partial_desc:"మిశ్రమ సాక్ష్యం",vk_unverifiable:"ధృవీకరించలేనిది",vk_unverifiable_desc:"సాక్ష్యం లేదు",ask_query:"కొత్త ప్రశ్న",ask_query_desc:"ఈ వాదనల గురించి అడగండి",ai_detection:"AI గుర్తింపు",ai_prob:"AI సంభావ్యత",filter_label:"ఫిల్టర్:",filter_all:"అన్నీ",filter_true:"నిజం",filter_false:"అబద్ధం",filter_partial:"పాక్షికం",filter_conflict:"వైరుధ్యం",extracted_claims:"సేకరించిన వాదనలు",settings_title:"సెట్టింగ్స్",llm_model:"LLM మాడల్",search_provider:"సెర్చ్ అందించేవారు",save_settings:"సేవ్ చేయండి",override_title:"తీర్పు మార్చండి",new_verdict:"కొత్త తీర్పు",reason:"కారణం",apply_override:"అమలు చేయండి",confidence:"నమ్మకం",to_run:"నడపడానికి",lang_changed:"భాష మారబడింది"},
  de:{nav_analyze:"Analysieren",nav_demos:"Demos",nav_reports:"Berichte",nav_docs:"Doku",hero_badge:"KI-gest\u00fctzte Faktenpr\u00fcfung",hero_title:'Jede Behauptung.<br><span style="color:var(--cyan);text-shadow:0 0 22px rgba(0,212,255,.4)">Verifiziert.</span>',hero_desc:"PDF hochladen, Artikel einf\u00fcgen, Sprache aufnehmen \u2014 TruthLens extrahiert jede Behauptung und \u00fcberpr\u00fcft sie.",tab_text:"Text / URL",tab_file:"Datei Hochladen",tab_voice:"Sprache",btn_run:"Analyse Starten",empty_title:"BEREIT ZUM SCANNEN",empty_desc:"Demo laden oder Text eingeben, dann Analyse starten.",placeholder:"URL (https://\u2026) oder Text einf\u00fcgen\u2026\n\nDemo laden oder \u2318\u21b5 dr\u00fccken",quick_demos:"Schnelle Demos \u2192",drop_title:"Datei hierher ziehen oder klicken",drop_desc:"PDF, DOCX, TXT, HTML, MD \u00b7 bis 10 MB",mic_start:"Mikrofon anklicken zum Aufnehmen",mic_rec:"Aufnahme\u2026",accuracy:"Genauigkeit",accurate:"genau",breakdown:"Aufschl\u00fcsselung",claims_label:"Behauptungen",conflicts_label:"Konflikte",true_label:"Wahr",false_label:"Falsch",partial_label:"Teilweise",verdict_key:"Urteilslegende",vk_true:"Wahr",vk_true_desc:"Durch Quellen best\u00e4tigt",vk_false:"Falsch",vk_false_desc:"Widersprochen",vk_partial:"Teilweise",vk_partial_desc:"Gemischte Beweise",vk_unverifiable:"Nicht pr\u00fcfbar",vk_unverifiable_desc:"Keine Beweise",ask_query:"Neue Frage",ask_query_desc:"Fragen zu diesen Behauptungen",ai_detection:"KI-Erkennung",ai_prob:"KI-Wahrscheinlichkeit",filter_label:"Filter:",filter_all:"Alle",filter_true:"Wahr",filter_false:"Falsch",filter_partial:"Teilweise",filter_conflict:"Konflikt",extracted_claims:"EXTRAHIERTE BEHAUPTUNGEN",settings_title:"Einstellungen",llm_model:"LLM Modell",search_provider:"Suchanbieter",save_settings:"Speichern",override_title:"Urteil \u00c4ndern",new_verdict:"Neues Urteil",reason:"Grund",apply_override:"Anwenden",confidence:"Konfidenz",to_run:"ausf\u00fchren",lang_changed:"Sprache ge\u00e4ndert"}
};

function t(key){return (I18N[curLang]&&I18N[curLang][key])||I18N.en[key]||key;}

function toggleLangDD(){
  var dd=document.getElementById('langDD');
  dd.classList.toggle('open');
  // close on outside click
  function closeDD(e){if(!document.getElementById('langWrap').contains(e.target)){dd.classList.remove('open');document.removeEventListener('click',closeDD);}}
  if(dd.classList.contains('open'))setTimeout(function(){document.addEventListener('click',closeDD)},0);
}

function setLang(lang){
  curLang=lang;
  try{localStorage.setItem('tl_lang',lang)}catch(e){}
  // Update flag & code in header button
  document.getElementById('langFlag').textContent=LANG_FLAGS[lang]||LANG_FLAGS.en;
  document.getElementById('langCode').textContent=lang.toUpperCase();
  // Mark active option
  document.querySelectorAll('.lang-opt').forEach(function(o){o.classList.toggle('active',o.getAttribute('data-lang')===lang)});
  // Close dropdown
  document.getElementById('langDD').classList.remove('open');
  // RTL support
  if(LANG_RTL.indexOf(lang)>=0){document.documentElement.setAttribute('dir','rtl');}else{document.documentElement.removeAttribute('dir');}
  // Apply translations
  applyTranslations();
  toast(t('lang_changed'),'purple');
}

function applyTranslations(){
  // data-i18n = textContent replacement
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key=el.getAttribute('data-i18n');
    if(I18N[curLang]&&I18N[curLang][key]!=null) el.textContent=I18N[curLang][key];
  });
  // data-i18n-html = innerHTML replacement (for hero title with <br>)
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){
    var key=el.getAttribute('data-i18n-html');
    if(I18N[curLang]&&I18N[curLang][key]!=null) el.innerHTML=I18N[curLang][key];
  });
  // Update textarea placeholder
  var ta=document.getElementById('ta');
  if(ta) ta.placeholder=t('placeholder');
  // Update mic text if not recording
  var mSt=document.getElementById('mSt');
  if(mSt&&!recording) mSt.textContent=t('mic_start');
  setTimeout(function(){if(window.lucide)lucide.createIcons()},0);
}

// Restore saved language on load
try{var saved=localStorage.getItem('tl_lang');if(saved&&I18N[saved]){curLang=saved;}}catch(e){}

document.getElementById('dateIn').value=new Date().toISOString().split('T')[0];
var activeTab='text',running=false,aborted=false,cMock=[],activeFilter='ALL',ovrId=null,nqCount=0,nqHistData=[];

function initIcons(){if(window.lucide)window.lucide.createIcons();if(curLang!=='en'){setLang(curLang);}else{applyTranslations();}}
setTimeout(initIcons,100);

function toast(msg,type){
  var c={cyan:"var(--cyan)",green:"var(--green)",red:"var(--red)",amber:"var(--amber)",purple:"var(--purple)"}[type]||"var(--cyan)";
  var ico={cyan:"info",green:"check-circle",red:"alert-circle",amber:"alert-triangle",purple:"info"}[type]||"info";
  var el=document.createElement('div');el.className='ti';
  el.innerHTML='<i data-lucide="'+ico+'" style="width:14px;height:14px;stroke:'+c+'"></i>'+msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(function(){lucide.createIcons()},0);
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},2800);
}
function om(id){document.getElementById(id).classList.add('open');}
function cm(id){document.getElementById(id).classList.remove('open');}
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.mo.open').forEach(function(m){m.classList.remove('open')});if(e.key==='r'&&!running&&!e.ctrlKey&&!e.metaKey)runA(true);});
function setNav(btn){document.querySelectorAll('nav .tab').forEach(function(b){b.classList.remove('on')});btn.classList.add('on');}
function switchTab(tab,btn){
  activeTab=tab;
  ['Text','File','Voice'].forEach(function(t){document.getElementById('p'+t).style.display='none'});
  document.querySelectorAll('[id^=t]').forEach(function(b){if(b.classList.contains('tab'))b.classList.remove('on')});
  document.getElementById('p'+tab.charAt(0).toUpperCase()+tab.slice(1)).style.display='block';
  if(btn)btn.classList.add('on');
  document.getElementById('mTag').textContent={text:'TEXT MODE',file:'FILE MODE',voice:'VOICE MODE'}[tab];
  setTimeout(function(){lucide.createIcons()},0);
}
function loadD(i){switchTab('text',document.getElementById('tText'));document.getElementById('ta').value=DEMOS[i];}
function pickFile(inp){if(!inp.files[0])return;var f=inp.files[0];document.getElementById('dz').style.display='none';document.getElementById('fp').style.display='flex';document.getElementById('fn').textContent=f.name;document.getElementById('fm').textContent=Math.round(f.size/1024)+' KB · '+f.name.split('.').pop().toUpperCase();setTimeout(function(){lucide.createIcons()},0);}
function doDrop(e){e.preventDefault();var f=e.dataTransfer.files[0];if(!f)return;document.getElementById('dz').style.display='none';document.getElementById('fp').style.display='flex';document.getElementById('fn').textContent=f.name;document.getElementById('fm').textContent=Math.round(f.size/1024)+' KB';setTimeout(function(){lucide.createIcons()},0);}
function clearFile(){document.getElementById('fi').value='';document.getElementById('fp').style.display='none';document.getElementById('dz').style.display='block';}

var recording=false;
var recognition=null;
var final_transcript = '';

function toggleMic(){
  var btn=document.getElementById('micBtn'),st=document.getElementById('mSt'),wv=document.getElementById('wv'),tr=document.getElementById('mTr');

  if(recording){
    if(recognition) recognition.stop();
  } else {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition){
       toast('Voice recognition not supported in this browser.', 'red');
       return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    var langMap = {en:'en-US', hi:'hi-IN', ta:'ta-IN', kn:'kn-IN', te:'te-IN', de:'de-DE'};
    recognition.lang = langMap[curLang] || 'en-US';
    
    final_transcript = '';
    
    recognition.onstart = function() {
        recording=true;
        btn.style.background='rgba(255,59,92,.12)';btn.style.borderColor='rgba(255,59,92,.5)';
        st.textContent=t('mic_rec');st.style.color='var(--red)';
        wv.style.display='flex';
        tr.textContent='';
    };
    
    recognition.onresult = function(event) {
        var interim_transcript = '';
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript + ' ';
          } else {
            interim_transcript += event.results[i][0].transcript;
          }
        }
        tr.textContent = final_transcript + interim_transcript;
    };
    
    recognition.onerror = function(event) {
        toast('Mic error: ' + event.error, 'amber');
        if(recognition) recognition.stop();
    }
    
    recognition.onend = function() {
        recording=false;
        btn.style.background='rgba(0,212,255,.07)';btn.style.borderColor='rgba(0,212,255,.3)';
        st.textContent=t('mic_start');st.style.color='var(--muted)';
        wv.style.display='none';
        var txt = final_transcript || tr.textContent;
        if(txt.trim().length > 0) {
            switchTab('text',document.getElementById('tText'));
            document.getElementById('ta').value=txt;
            toast('Audio transcribed', 'cyan');
        }
    };
    
    recognition.start();
  }
}

function openNQ(){var p=document.getElementById('newQueryPanel');p.style.display='block';p.scrollIntoView({behavior:'smooth',block:'start'});renderNQSuggestions();setTimeout(function(){document.getElementById('nqInput').focus();lucide.createIcons();},200);}
function closeNQ(){document.getElementById('newQueryPanel').style.display='none';document.getElementById('nqResult').style.display='none';}
function renderNQSuggestions(){
  var el=document.getElementById('nqSuggestions');
  var html='<span style="font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(139,92,246,.5);font-weight:600;width:100%;margin-bottom:2px">Suggested queries →</span>';
  NQ_SUGGESTIONS.forEach(function(s,i){html+='<button class="nq-sug" style="animation-delay:'+(i*0.07)+'s" onclick="fillNQ(\''+s.text.replace(/'/g,"\\'")+ '\')"><i data-lucide="'+s.icon+'" style="width:11px;height:11px;stroke:currentColor"></i>'+s.text+'</button>';});
  el.innerHTML=html;setTimeout(function(){lucide.createIcons()},0);
}
function fillNQ(text){document.getElementById('nqInput').value=text;document.getElementById('nqInput').focus();}
function submitNQ(){
  var q=document.getElementById('nqInput').value.trim();if(!q)return;
  var btn=document.getElementById('nqRunBtn');btn.innerHTML='<i data-lucide="loader-2" style="width:18px;height:18px;stroke:currentColor;animation:spin 1s linear infinite"></i>';setTimeout(function(){lucide.createIcons()},0);
  setTimeout(function(){
    btn.innerHTML='<i data-lucide="send" style="width:18px;height:18px;stroke:currentColor"></i>';setTimeout(function(){lucide.createIcons()},0);
    var key='default',ql=q.toLowerCase();
    if(ql.includes('when')||ql.includes('built'))key='when';
    else if(ql.includes('where')||ql.includes('location'))key='where';
    else if(ql.includes('height')||ql.includes('tall'))key='height';
    else if(ql.includes('who')||ql.includes('design'))key='who';
    var ans=NQ_ANSWERS[key];
    nqCount++;document.getElementById('nqCount').textContent=nqCount;
    nqHistData.unshift({q:q,verdict:ans.claims[0].v,time:new Date().toLocaleTimeString()});
    var rEl=document.getElementById('nqResult');
    var rHtml='<div class="nq-result-title">Results for: "'+escH(q)+'"</div>';
    ans.claims.forEach(function(c){var vm=VM[c.v]||VM.TRUE;var pct=Math.round(c.conf*100);rHtml+='<div class="nq-claim-row"><div style="flex:1"><p style="font-size:12px;color:rgba(232,244,255,.85);line-height:1.6;margin-bottom:4px">'+c.text+'</p><div style="display:flex;align-items:center;gap:8px"><span style="background:'+vm.bg+';border:1.5px solid '+vm.bdr+';border-radius:4px;padding:2px 9px;font-family:Orbitron,sans-serif;font-size:9px;letter-spacing:1px;color:'+vm.color+';font-weight:700">'+vm.l+'</span><span style="font-size:10px;color:var(--dim)">'+pct+'%</span></div></div></div>';});
    rHtml+='<div style="margin-top:10px;padding:9px 11px;background:rgba(139,92,246,.05);border-radius:8px;border-left:2px solid rgba(139,92,246,.3);font-size:11px;color:rgba(232,244,255,.55);line-height:1.6">'+ans.reasoning+'</div>';
    rEl.innerHTML=rHtml;rEl.style.display='block';
    renderNQHistory();document.getElementById('nqInput').value='';
    toast('Query answered','cyan');
  },1100);
}
function renderNQHistory(){
  if(!nqHistData.length)return;
  document.getElementById('nqHistory').style.display='block';
  var html='';nqHistData.slice(0,5).forEach(function(h){var col={TRUE:'var(--green)',FALSE:'var(--red)',PARTIALLY_TRUE:'var(--amber)'}[h.verdict]||'var(--muted)';html+='<div class="nq-hist-item" onclick="fillNQ(\''+h.q.replace(/'/g,"\\'")+ '\')"><span class="nq-hist-txt">'+escH(h.q)+'</span><span style="font-size:9px;color:'+col+';font-weight:700">'+h.verdict+'</span></div>';});
  document.getElementById('nqHistList').innerHTML=html;setTimeout(function(){lucide.createIcons()},0);
}
function clearNQHistory(){nqHistData=[];nqCount=0;document.getElementById('nqCount').textContent='0';document.getElementById('nqHistory').style.display='none';document.getElementById('nqResult').style.display='none';document.getElementById('nqHistList').innerHTML='';toast('History cleared','amber');}

function escH(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function setF(f,btn){activeFilter=f;document.querySelectorAll('[id^=f]').forEach(function(b){b.classList.remove('on')});btn.classList.add('on');renderClaims();}
function applyOvr(){var v=document.getElementById('ovrV').value;var c=cMock.find(function(x){return x.id===ovrId});if(c){c.verdict=v;c.conf=0.95;renderClaims();}cm('mOvr');toast('Verdict overridden → '+v,'amber');}
function updateRing(total,t,f,p){
  var C=226.2,pct=total>0?Math.round(t/total*100):0;
  document.getElementById('ringPct').textContent=total>0?pct+'%':'—';
  document.getElementById('rlT').textContent=t+' True';document.getElementById('rlF').textContent=f+' False';document.getElementById('rlP').textContent=p+' Partial';
  if(total>0){var off=0;[['var(--green)',t,'rt'],['var(--amber)',p,'rp'],['var(--red)',f,'rf']].forEach(function(x){var len=(x[1]/total)*C;var el=document.getElementById(x[2]);el.setAttribute('stroke-dasharray',len+' '+(C-len));el.setAttribute('stroke-dashoffset',-off);off+=len;});}
}
function renderArticle(text,claims,vmap){
  var spans=claims.filter(function(c){return c.span}).map(function(c){return{start:c.span[0],end:c.span[1],id:c.id,verdict:vmap[c.id]||'PENDING'}}).sort(function(a,b){return a.start-b.start});
  var html='',cursor=0;
  spans.forEach(function(s){
    if(s.start>cursor)html+=escH(text.slice(cursor,s.start));
    var bg={TRUE:'rgba(0,255,136,.15)',FALSE:'rgba(255,59,92,.15)',PARTIALLY_TRUE:'rgba(255,184,0,.12)',PENDING:'rgba(0,212,255,.1)'}[s.verdict]||'rgba(0,212,255,.1)';
    var bd={TRUE:'var(--green)',FALSE:'var(--red)',PARTIALLY_TRUE:'var(--amber)',PENDING:'var(--cyan)'}[s.verdict]||'var(--cyan)';
    html+='<mark onclick="jumpTo(\''+s.id+'\')" style="background:'+bg+';border-bottom:2px solid '+bd+';border-radius:2px;padding:1px 0;cursor:pointer">'+escH(text.slice(s.start,s.end))+'</mark>';
    cursor=s.end;});
  if(cursor<text.length)html+=escH(text.slice(cursor));
  document.getElementById('artTxt').innerHTML=html;document.getElementById('artPrev').style.display='block';
}
function jumpTo(id){var el=document.getElementById('card-'+id);if(el){el.scrollIntoView({behavior:'smooth',block:'nearest'});el.style.outline='2px solid var(--cyan)';setTimeout(function(){el.style.outline=''},1800);}}

function claimCard(c,i,pend){
  var vm=pend?VM.PENDING:(VM[c.verdict]||VM.PENDING);var pct=Math.round(c.conf*100);
  var evH='';
  if(!pend&&c.evidence){c.evidence.slice(0,2).forEach(function(e){
    evH+='<div class="ev"><div style="font-size:11px;font-weight:500;color:rgba(232,244,255,.6);margin-bottom:3px">'+e.title+'</div>';
    evH+='<div style="font-size:10px;color:rgba(232,244,255,.35);line-height:1.5">'+e.snippet+'</div>';
    if(e.label==='wikipedia')evH+='<span style="font-size:8px;padding:2px 7px;border-radius:3px;background:rgba(0,212,255,.08);color:var(--cyan);border:1px solid rgba(0,212,255,.2);font-weight:700;text-transform:uppercase;margin-top:5px;display:inline-block">Wikipedia</span>';
    if(e.label==='cited')evH+='<span style="font-size:8px;padding:2px 7px;border-radius:3px;background:rgba(0,255,136,.08);color:var(--green);border:1px solid rgba(0,255,136,.2);font-weight:700;text-transform:uppercase;margin-top:5px;display:inline-block">Cited</span>';
    evH+='</div>';});}
  var wwcH='';
  if(!pend&&c.wwc){c.wwc.forEach(function(s,j){wwcH+='<div style="padding:6px 9px;background:#070D18;border-radius:6px;border-left:2px solid rgba(0,212,255,.1);font-size:11px;color:rgba(232,244,255,.45);line-height:1.6;margin-top:4px"><span style="color:rgba(232,244,255,.2)">'+(j+1)+'.</span> '+s+'</div>';});}
  return '<div class="cc'+(c.conflict&&!pend?' conflict':'')+'" id="card-'+c.id+'" style="animation-delay:'+(0.35+i*0.1)+'s">'+
    '<div class="st" style="background:'+vm.stripe+'"></div><div class="gn">'+String(i+1).padStart(2,'0')+'</div>'+
    '<div style="padding:13px 14px 11px 19px">'+
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">'+
    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'+
    '<div style="width:24px;height:24px;border-radius:5px;background:rgba(0,212,255,.06);border:1px solid var(--bdr2);display:flex;align-items:center;justify-content:center;font-family:JetBrains Mono,monospace;font-size:9px;font-weight:700;color:rgba(0,212,255,.45)">'+String(i+1).padStart(2,'0')+'</div>'+
    (c.type&&c.type!=='general'?'<span style="font-size:8px;padding:2px 7px;border-radius:3px;border:1px solid rgba(232,244,255,.1);color:var(--dim);text-transform:uppercase;letter-spacing:.08em;font-weight:600">'+c.type+'</span>':'')+
    (c.conflict&&!pend?'<span style="display:flex;align-items:center;gap:4px;font-size:8px;padding:2px 8px;border-radius:3px;background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.25);color:var(--amber);font-weight:700;text-transform:uppercase">⚡ conflict</span>':'')+
    '</div>'+
    '<div style="--r:'+vm.rot+';transform:rotate(var(--r));background:'+vm.bg+';border:1.5px solid '+vm.bdr+';border-radius:5px;padding:3px 10px;font-family:Orbitron,sans-serif;font-size:10px;letter-spacing:1.5px;color:'+vm.color+';font-weight:700;flex-shrink:0'+(pend?'':';animation:stampPop .4s ease both')+'">'+vm.l+'</div></div>'+
    '<div style="font-size:13px;line-height:1.7;color:rgba(232,244,255,.88);margin-bottom:10px">'+c.text+'</div>'+
    (!pend?'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px"><span>Confidence</span><span style="font-family:JetBrains Mono,monospace;color:'+vm.color+';font-weight:700">'+pct+'%</span></div><div style="height:3px;border-radius:2px;background:rgba(232,244,255,.06);overflow:hidden"><div style="height:100%;border-radius:2px;background:'+vm.stripe+';width:'+pct+'%"></div></div></div>':'')+
    (c.conflict&&c.conflictReason&&!pend?'<div style="font-size:11px;color:rgba(255,184,0,.75);line-height:1.6;margin-bottom:9px;padding:8px 10px;background:rgba(255,184,0,.04);border-radius:7px;border-left:2px solid rgba(255,184,0,.35)">⚡ '+c.conflictReason+'</div>':'')+
    (c.wwc&&c.wwc.length&&!pend?'<details style="margin-bottom:8px"><summary><i data-lucide="chevron-right" style="width:11px;height:11px;stroke:currentColor"></i>What would change this verdict?</summary>'+wwcH+'</details>':'')+
    (c.evidence&&c.evidence.length&&!pend?'<details><summary><i data-lucide="chevron-right" style="width:11px;height:11px;stroke:currentColor"></i>View '+c.evidence.length+' source(s)</summary>'+evH+'</details>':'')+
    '<div style="display:flex;align-items:center;gap:4px;padding-top:9px;border-top:1px solid rgba(0,212,255,.06);margin-top:10px;flex-wrap:wrap">'+
    '<span style="font-family:JetBrains Mono,monospace;font-size:9px;color:var(--dim)">['+c.span[0]+'—'+c.span[1]+']</span>'+
    '<div class="tt"><button class="ib sm sq" onclick="jumpTo(\''+c.id+'\')"><i data-lucide="map-pin" style="width:11px;height:11px;stroke:currentColor"></i></button><span class="tip">Highlight</span></div>'+
    '<div class="tt"><button class="ib sm sq" onclick="toast(\'Copied\',\'cyan\')"><i data-lucide="copy" style="width:11px;height:11px;stroke:currentColor"></i></button><span class="tip">Copy</span></div>'+
    '<div class="tt"><button class="ib sm sq" onclick="toast(\'Re-running…\',\'cyan\')"><i data-lucide="refresh-cw" style="width:11px;height:11px;stroke:currentColor"></i></button><span class="tip">Re-run</span></div>'+
    '<div class="tt"><button class="ib sm sq success" onclick="toast(\'Accepted\',\'green\')"><i data-lucide="check-circle" style="width:11px;height:11px;stroke:currentColor"></i></button><span class="tip">Accept</span></div>'+
    '<div class="tt"><button class="ib sm sq warn" onclick="ovrId=\''+c.id+'\';om(\'mOvr\')"><i data-lucide="pencil" style="width:11px;height:11px;stroke:currentColor"></i></button><span class="tip">Override</span></div>'+
    '<div class="tt"><button class="ib sm sq" style="color:var(--purple);border-color:rgba(139,92,246,.25)" onclick="askAboutClaim(\''+c.text.replace(/'/g,"\\'")+ '\')"><i data-lucide="message-square-plus" style="width:11px;height:11px;stroke:currentColor"></i></button><span class="tip">Ask query</span></div>'+
    '<span style="margin-left:auto;font-size:9px;color:var(--dim);background:rgba(0,212,255,.05);border:1px solid var(--bdr);border-radius:99px;padding:2px 8px">'+c.evidence.length+' src</span>'+
    '</div></div></div>';
}
function askAboutClaim(text){openNQ();document.getElementById('nqInput').value='Tell me more about: '+text;document.getElementById('nqInput').focus();}
function renderClaims(){
  var list=cMock.filter(function(c){if(activeFilter==='ALL')return true;if(activeFilter==='CONFLICT')return c.conflict;return c.verdict===activeFilter;});
  document.getElementById('claimsList').innerHTML=list.map(function(c,i){return claimCard(c,i,false)}).join('');
  setTimeout(function(){lucide.createIcons()},0);
}
function renderPipe(stage){
  var cur=STAGES.indexOf(stage);var html='';
  SLABS.forEach(function(label,i){
    var done=stage==='done'||cur>i,active=cur===i;
    var col=done?'var(--green)':active?'var(--cyan)':'rgba(232,244,255,.18)';
    var bg=done?'rgba(0,255,136,.04)':active?'rgba(0,212,255,.06)':'transparent';
    var ic=done?'<i data-lucide="check" style="width:13px;height:13px;stroke:var(--green)"></i>':active?'<i data-lucide="loader-2" style="width:13px;height:13px;stroke:var(--cyan);animation:spin 1s linear infinite"></i>':'<i data-lucide="'+SICONS[i]+'" style="width:12px;height:12px;stroke:rgba(232,244,255,.2)"></i>';
    html+='<div class="ps'+(done?' done':active?' active':'')+'" style="background:'+bg+'">'+ic+'<span style="font-size:10px;font-weight:600;letter-spacing:.04em;color:'+col+'">'+label+'</span></div>';
  });
  document.getElementById('pipeSteps').innerHTML=html;
  document.getElementById('pipeMeta').textContent=SMSG[STAGES.indexOf(stage)];
  setTimeout(function(){lucide.createIcons()},0);
}
function doCancel(){aborted=true;running=false;document.getElementById('cancelBtn').style.display='none';var b=document.getElementById('runBtn');b.disabled=false;b.style.opacity='1';b.innerHTML='<i data-lucide="play" style="width:14px;height:14px;stroke:#04080F;fill:#04080F"></i>Run Analysis';setTimeout(function(){lucide.createIcons()},0);toast('Cancelled','red');}

var delay=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
async function runA(rerun){
  if(running)return;
  var ok=false;
  if(activeTab==='text'&&document.getElementById('ta').value.trim())ok=true;
  if(activeTab==='file'&&document.getElementById('fp').style.display==='flex')ok=true;
  if(activeTab==='voice')ok=true;
  if(!ok){toast('Load a demo or enter text first','amber');return;}
  running=true;aborted=false;
  var btn=document.getElementById('runBtn');btn.disabled=true;btn.style.opacity='.6';
  btn.innerHTML='<i data-lucide="loader-2" style="width:14px;height:14px;stroke:#04080F;animation:spin 1s linear infinite"></i>Scanning…';
  document.getElementById('cancelBtn').style.display='flex';document.getElementById('rerunBtn').style.display='none';
  document.getElementById('ic').style.border='1.5px solid rgba(0,212,255,.45)';document.getElementById('ic').style.boxShadow='0 0 28px rgba(0,212,255,.1)';
  document.getElementById('pipeBar').style.display='block';document.getElementById('emptyState').style.display='none';
  document.getElementById('claimsSec').style.display='none';document.getElementById('filterBar').style.display='none';
  document.getElementById('statsBlock').style.display='none';document.getElementById('aiBlock').style.display='none';
  document.getElementById('confBanner').style.display='none';document.getElementById('artPrev').style.display='none';
  document.getElementById('newQueryPanel').style.display='none';
  setTimeout(function(){lucide.createIcons()},0);
  cMock=JSON.parse(JSON.stringify(MOCK));
  var artText=document.getElementById('ta').value.trim()||DEMOS[0];
  for(var si=0;si<STAGES.length;si++){
    if(aborted)break;var stage=STAGES[si];renderPipe(stage);
    if(stage==='extracting'){
      await delay(900);document.getElementById('claimsSec').style.display='block';document.getElementById('claimCnt').textContent=cMock.length;
      document.getElementById('claimsList').innerHTML=cMock.map(function(c,i){return claimCard({id:c.id,text:c.text,span:c.span,type:c.type,conflict:false,wwc:[],evidence:[],pinned:false,accepted:false},i,true)}).join('');
      setTimeout(function(){lucide.createIcons()},0);
    }else if(stage==='verifying'){
      await delay(500);var vmap={};
      for(var i=0;i<cMock.length;i++){if(aborted)break;await delay(420);vmap[cMock[i].id]=cMock[i].verdict;
        var html='';for(var j=0;j<cMock.length;j++){if(j<=i)html+=claimCard(cMock[j],j,false);else html+=claimCard({id:cMock[j].id,text:cMock[j].text,span:cMock[j].span,type:cMock[j].type,conflict:false,wwc:[],evidence:[],pinned:false,accepted:false},j,true);}
        document.getElementById('claimsList').innerHTML=html;setTimeout(function(){lucide.createIcons()},0);}
      renderArticle(artText,cMock,vmap);
      var tN=cMock.filter(function(c){return c.verdict==='TRUE'}).length;
      updateRing(cMock.length,tN,cMock.filter(function(c){return c.verdict==='FALSE'}).length,cMock.filter(function(c){return c.verdict==='PARTIALLY_TRUE'}).length);
    }else if(stage==='conflicts'){
      await delay(500);document.getElementById('statsBlock').style.display='block';document.getElementById('filterBar').style.display='block';
      var cN=cMock.filter(function(c){return c.conflict}).length;
      document.getElementById('sC').textContent=cMock.length;document.getElementById('sCo').textContent=cN;
      document.getElementById('sT').textContent=cMock.filter(function(c){return c.verdict==='TRUE'}).length;
      document.getElementById('sF').textContent=cMock.filter(function(c){return c.verdict==='FALSE'}).length;
      if(cN>0){document.getElementById('confBanner').style.display='flex';document.getElementById('confTxt').textContent=cN+' conflicts detected';}
      renderClaims();
    }else if(stage==='detecting'){await delay(600);document.getElementById('aiBlock').style.display='block';
    }else{await delay(700);}
  }
  document.getElementById('ic').style.border='1.5px solid var(--bdr2)';document.getElementById('ic').style.boxShadow='none';
  running=false;btn.disabled=false;btn.style.opacity='1';
  btn.innerHTML='<i data-lucide="play" style="width:14px;height:14px;stroke:#04080F;fill:#04080F"></i>Run Analysis';
  document.getElementById('cancelBtn').style.display='none';document.getElementById('rerunBtn').style.display='flex';
  setTimeout(function(){lucide.createIcons()},0);
  if(!aborted)toast('Complete — '+cMock.length+' claims verified','green');
}
document.getElementById('ta').addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))runA();});
document.getElementById('nqInput').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitNQ();}});


/* --- HEADER ACTIONS --- */
function handleSave() {
  if (document.querySelectorAll('.cc').length === 0) {
    toast(t('No report to save'), 'amber');
    return;
  }
  localStorage.setItem('truthlens_saved', document.getElementById('claimsList').innerHTML);
  toast(t('Saved'), 'amber');
}

function handleShare() {
  navigator.clipboard.writeText(window.location.href).then(function() {
    toast(t('Link copied'), 'cyan');
  }).catch(function() {
    toast('Error copying link', 'red');
  });
}

function handleDownload() {
  var claims = document.querySelectorAll('.cc');
  if(claims.length === 0) {
    toast(t('No report to export'), 'red');
    return;
  }
  
  var content = "TRUTHLENS ANALYSIS REPORT\n=========================\n\n";
  claims.forEach(function(cc, i) {
    var pEl = cc.querySelector('.cc-dt p');
    var ctext = pEl ? pEl.innerText : '';
    var badge = cc.querySelector('.v-badge span:first-child') || cc.querySelector('.v-badge');
    var verdict = badge ? badge.innerText.trim() : 'UNKNOWN';
    content += "Claim " + (i+1) + ": " + ctext + "\n";
    content += "Verdict: " + verdict + "\n\n";
  });
  
  var blob = new Blob([content], { type: "text/plain" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "truthlens_report.txt";
  a.click();
  toast(t('Exporting…'), 'cyan');
}

/** Small, offline, reviewed explanations. These are authored translations, not a general translator. */
export const TOR_LANGUAGES=Object.freeze([
 {code:"en-ZA",name:"English"},
 {code:"zu-ZA",name:"isiZulu"},
 {code:"fr-FR",name:"Français"},
 {code:"pt-PT",name:"Português"},
 {code:"sw-KE",name:"Kiswahili"},
]);
export function teachingTopic(input){
 const q=String(input||"").toLowerCase();
 if(/\b(tryparse|parse|invalid|validate|validation|number|integer)\b/.test(q))return "validation";
 if(/\b(for|while|foreach|loop|iteration)\b/.test(q))return "loop";
 if(/\b(class|object|inherit|override|interface|oop)\b/.test(q))return "oop";
 if(/\b(event|click|handler|button)\b/.test(q))return "event";
 if(/\b(label|textbox|text box|control|property|properties)\b/.test(q))return "control";
 if(/\b(error|exception|debug|failed|crash|bug)\b/.test(q))return "debug";
 return null;
}
const LESSONS={
 control:{
  "en-ZA":"A Label displays information; a TextBox collects input. (Name) is the C# identifier; Text is what the user sees. Example: lblResult.Text = txtName.Text; Your turn: change the label after entering your name.",
  "fr-FR":"Un Label affiche du texte ; un TextBox reçoit la saisie. (Name) est le nom utilisé en C#, tandis que Text est visible par l’utilisateur. Exemple : lblResult.Text = txtName.Text; Essaie de modifier le Label après avoir saisi ton prénom.",
  "zu-ZA":"I-Label ibonisa umbhalo; i-TextBox yamukela okufakwayo. (Name) yigama elisetshenziswa kukhodi ye-C#, kanti i-Text ibonwa umsebenzisi. Isibonelo: lblResult.Text = txtName.Text; Zama ukubonisa igama lakho ku-Label.",
  "pt-PT":"O Label mostra texto; a TextBox recebe dados. (Name) é o identificador em C#; Text é o que a pessoa vê. Exemplo: lblResult.Text = txtName.Text; Experimenta mostrar o teu nome no Label.",
  "sw-KE":"Label huonyesha maandishi; TextBox hupokea taarifa. (Name) ni jina linalotumika kwenye msimbo wa C#, na Text ni kinachoonekana. Mfano: lblResult.Text = txtName.Text; Jaribu kuonyesha jina lako kwenye Label."
 },
 event:{
  "en-ZA":"A Button reacts through its Click event. Double-click the button in the designer, write code in the handler, run the form and press the button. Try displaying MessageBox.Show(\"Hello!\");",
  "fr-FR":"Un Button réagit grâce à l’événement Click. Double-clique sur le bouton dans le concepteur, écris le code du gestionnaire, exécute le formulaire et clique. Essaie MessageBox.Show(\"Bonjour !\");",
  "zu-ZA":"I-Button isebenzisa i-Click event. Chofoza kabili inkinobho kumklami, bhala ikhodi ku-handler, sebenzisa ifomu bese ucindezela inkinobho. Zama MessageBox.Show(\"Sawubona!\");",
  "pt-PT":"Um Button reage através do evento Click. Faz duplo clique no botão no designer, escreve o código no método do evento e executa o formulário. Experimenta MessageBox.Show(\"Olá!\");",
  "sw-KE":"Button hutumia tukio la Click. Bofya kitufe mara mbili kwenye designer, andika msimbo kwenye handler, endesha fomu na ubonyeze kitufe. Jaribu MessageBox.Show(\"Habari!\");"
 },
 validation:{
  "en-ZA":"TextBox.Text contains a string. Before doing maths, use if (!int.TryParse(txtAge.Text, out int age)) { MessageBox.Show(\"Enter a number\"); return; } Then test blank text and letters.",
  "fr-FR":"TextBox.Text contient une chaîne. Avant un calcul, vérifie la saisie avec int.TryParse(txtAge.Text, out int age). Si c’est faux, affiche un message et arrête le traitement. Teste aussi un champ vide et des lettres.",
  "zu-ZA":"I-TextBox.Text inombhalo (string). Ngaphambi kwezibalo, sebenzisa int.TryParse(txtAge.Text, out int age). Uma kungasebenzi, bonisa umlayezo bese uyama. Hlola indawo engenalutho nezinhlamvu.",
  "pt-PT":"TextBox.Text é uma string. Antes de calcular, utiliza int.TryParse(txtAge.Text, out int age). Se falhar, mostra uma mensagem e interrompe o processo. Testa texto vazio e letras.",
  "sw-KE":"TextBox.Text ni string. Kabla ya kuhesabu, tumia int.TryParse(txtAge.Text, out int age). Ikishindikana, onyesha ujumbe kisha simamisha hatua hiyo. Jaribu nafasi tupu na herufi."
 },
 loop:{
  "en-ZA":"A for loop has a start, a condition and an update. for (int i = 0; i < 3; i++) runs with i = 0, 1, 2. Predict the output, then change < 3 to <= 3 and explain the extra iteration.",
  "fr-FR":"Une boucle for comporte une initialisation, une condition et une mise à jour. for (int i = 0; i < 3; i++) utilise i = 0, 1, 2. Prédit le résultat, puis essaie i <= 3.",
  "zu-ZA":"I-for loop inesiqalo, umbandela nokushintsha inani. for (int i = 0; i < 3; i++) isebenzisa u-i = 0, 1, 2. Qagela umphumela, bese uzama i <= 3.",
  "pt-PT":"Um ciclo for tem início, condição e atualização. for (int i = 0; i < 3; i++) executa com i = 0, 1, 2. Prevê o resultado e depois experimenta i <= 3.",
  "sw-KE":"For loop ina mwanzo, sharti na mabadiliko. for (int i = 0; i < 3; i++) hutumia i = 0, 1, 2. Bashiri matokeo, kisha jaribu i <= 3."
 },
 oop:{
  "en-ZA":"A class is a blueprint; an object is an instance made from it. Example: class Student { public string Name = \"Ada\"; } then var s = new Student(); Console.WriteLine(s.Name); Build a second student.",
  "fr-FR":"Une classe est un modèle ; un objet est une instance créée à partir de ce modèle. Exemple : class Student { public string Name = \"Ada\"; } puis var s = new Student(); Essaie de créer un deuxième objet.",
  "zu-ZA":"I-class iyipulani yokwakha; i-object yinto eyenziwe ngaleyo pulani. Isibonelo: class Student { public string Name = \"Ada\"; } bese var s = new Student(); Zama ukwenza i-object yesibili.",
  "pt-PT":"Uma classe é um modelo; um objeto é uma instância criada a partir dela. Exemplo: class Student { public string Name = \"Ada\"; } e depois var s = new Student(); Cria um segundo objeto.",
  "sw-KE":"Class ni mchoro wa kitu; object ni mfano unaotengenezwa kwa class hiyo. Mfano: class Student { public string Name = \"Ada\"; } kisha var s = new Student(); Jaribu kuunda object ya pili."
 },
 debug:{
  "en-ZA":"Read the first error and its line number. Check names, types, brackets and semicolons. Fix one error, run again, then test a normal value and an invalid one. Paste the exact error if you want a targeted explanation.",
  "fr-FR":"Lis d’abord la première erreur et son numéro de ligne. Vérifie les noms, types, accolades et points-virgules. Corrige une erreur, relance puis teste une valeur normale et une valeur incorrecte.",
  "zu-ZA":"Funda iphutha lokuqala nenombolo yomugqa. Hlola amagama, izinhlobo, izibiyeli nama-semicolon. Lungisa iphutha elilodwa, sebenzisa futhi, bese uhlola inani elilungile nelingalungile.",
  "pt-PT":"Lê primeiro o erro e o número da linha. Verifica nomes, tipos, chavetas e pontos e vírgulas. Corrige um erro, executa novamente e testa um valor válido e outro inválido.",
  "sw-KE":"Soma kosa la kwanza na nambari ya mstari. Angalia majina, aina, mabano na semicolon. Sahihisha kosa moja, endesha tena, kisha jaribu thamani sahihi na isiyo sahihi."
 }
};
const ROAST={
 control:{"en-ZA":"That control isn't decoration — give it a job.","fr-FR":"Ce contrôle n’est pas une décoration : donne-lui un rôle.","zu-ZA":"Leli thuluzi alisona isithombe — linike umsebenzi.","pt-PT":"Esse controlo não é decoração — dá-lhe uma função.","sw-KE":"Kidhibiti hiki si pambo — kipe kazi."},
 event:{"en-ZA":"A button with no Click handler is just a fancy rectangle.","fr-FR":"Un bouton sans événement Click est un joli rectangle.","zu-ZA":"I-Button engenayo i-Click handler iwunxande nje omuhle.","pt-PT":"Um botão sem evento Click é só um retângulo bonito.","sw-KE":"Button bila Click handler ni mstatili mzuri tu."},
 validation:{"en-ZA":"Your app shouldn't trust every keyboard mash.","fr-FR":"Ton application ne doit pas croire tout ce qui est saisi.","zu-ZA":"Uhlelo lwakho alufanele luthembe konke okufakwayo.","pt-PT":"A tua aplicação não deve confiar em tudo o que é escrito.","sw-KE":"Programu yako haipaswi kuamini kila maandishi yanayoingizwa."},
 loop:{"en-ZA":"That loop needs an exit plan, not endless overtime.","fr-FR":"Cette boucle a besoin d’une sortie, pas d’heures supplémentaires.","zu-ZA":"Le loop idinga indlela yokuphuma, hhayi umsebenzi ongapheli.","pt-PT":"Esse ciclo precisa de uma saída, não de horas extra.","sw-KE":"Loop hii inahitaji njia ya kutoka, si kazi isiyoisha."},
 oop:{"en-ZA":"One giant class isn't architecture; it's a crowded suitcase.","fr-FR":"Une classe géante, ce n’est pas une architecture : c’est une valise trop pleine.","zu-ZA":"I-class enkulu kakhulu ayisona isakhiwo esihle.","pt-PT":"Uma classe gigante não é arquitetura; é uma mala cheia.","sw-KE":"Class moja kubwa si usanifu mzuri; ni begi lililojaa."},
 debug:{"en-ZA":"The compiler already gave you a clue; read it before blaming the laptop.","fr-FR":"Le compilateur t’a donné un indice ; lis-le avant d’accuser l’ordinateur.","zu-ZA":"I-compiler isinike umkhondo; funda wona kuqala.","pt-PT":"O compilador já deixou uma pista; lê-a antes de culpar o computador.","sw-KE":"Compiler tayari imetoa kidokezo; kisome kabla ya kulaumu kompyuta."}
};

const MORE_ROASTS={
 "en-ZA":{
  control:["That TextBox is taking names while the Label stays unemployed. Connect them.","Your form has more mystery guests than a reality show. Give each control a clear Name."],
  event:["That button has stage fright. Give it a Click handler and let it perform.","A button without an event is a doorbell with no wire. Connect the Click event."],
  validation:["Your input validator left the door open and the alphabet walked into your calculator.","Even your calculator needs boundaries. Use TryParse before doing maths."],
  loop:["That loop booked a holiday and forgot the return ticket. Check its condition.","Your loop is doing cardio. Can you prove exactly when it stops?"],
  oop:["That class is carrying the whole group project. Split responsibilities.","One giant class wants to be the app, the database AND the lecturer. Use smaller classes."],
  debug:["The compiler dropped clues all over the floor. Follow the first one.","Your bug is hiding behind the first red line. Read that line before changing ten others."]
 },
 "fr-FR":{
  control:["Ton TextBox recueille des données, mais ton Label garde le silence. Relie-les."],
  event:["Ce bouton attend son grand moment. Ajoute un gestionnaire Click."],
  validation:["Les lettres veulent entrer dans ta calculatrice ! Vérifie avec TryParse."],
  loop:["Ta boucle court sans regarder la sortie. Vérifie sa condition."],
  oop:["Cette classe porte tout le projet sur ses épaules. Répartis les responsabilités."],
  debug:["Le compilateur laisse des indices. Commence par la première erreur."]
 },
 "zu-ZA":{
  control:["I-TextBox ibambe ulwazi kodwa i-Label ithule. Zixhumanise."],
  event:["Le Button ilinde umsebenzi. Yinike i-Click handler."],
  validation:["Izinhlamvu zingene ezibalweni! Hlola okufakiwe nge-TryParse."],
  loop:["I-loop iyagijima kodwa ikuphi indlela yokuphuma? Hlola umbandela."],
  oop:["Le class ithwele wonke umsebenzi. Hlukanisa imisebenzi."],
  debug:["I-compiler ikunika izinkomba. Qala ngephutha lokuqala."]
 },
 "pt-PT":{
  control:["A TextBox recebe dados, mas a Label ficou em silêncio. Liga as duas."],
  event:["O botão está pronto para atuar. Só falta o evento Click."],
  validation:["As letras entraram na calculadora! Confere com TryParse."],
  loop:["O teu ciclo corre sem bilhete de volta. Confere a condição."],
  oop:["Essa classe está a fazer o trabalho de toda a equipa. Divide responsabilidades."],
  debug:["O compilador deixou pistas. Começa pelo primeiro erro."]
 },
 "sw-KE":{
  control:["TextBox imepokea taarifa, lakini Label iko kimya. Ziunganishe."],
  event:["Button iko tayari kufanya kazi. Ipe Click handler."],
  validation:["Herufi zimeingia kwenye kikokotoo! Tumia TryParse kwanza."],
  loop:["Loop yako inakimbia bila kufikiria mwisho. Kagua sharti."],
  oop:["Class hii imebeba kazi zote. Gawanya majukumu."],
  debug:["Compiler imetoa vidokezo. Anza na kosa la kwanza."]
 }
};
const PRACTICE={
 "en-ZA":{
  control:"Mini challenge: add a TextBox, Button and Label. On Click, show the entered name in the Label. Can you explain Text versus (Name)?",
  event:"Mini challenge: make a Click handler change a Label to 'Saved!'. Test it twice and explain when the handler executes.",
  validation:"Mini challenge: use int.TryParse on '27' and 'abc'. Show a friendly message for the invalid input.",
  loop:"Mini challenge: predict for (int i=0; i<3; i++) and then change the condition to i<=3. Which extra value appears?",
  oop:"Mini challenge: create two Student objects with different Name values. Print both names.",
  debug:"Mini challenge: introduce one missing semicolon, run the code, read the FIRST error, fix it and run again."
 },
 "fr-FR":{
  control:"Défi : ajoute un TextBox, un Button et un Label. Affiche le prénom saisi après Click. Explique Text et (Name).",
  event:"Défi : avec Click, change le texte d'un Label en « Enregistré ! ». Teste deux fois.",
  validation:"Défi : teste int.TryParse avec « 27 » et « abc ». Affiche un message en cas d'erreur.",
  loop:"Défi : prédis les valeurs de i dans for (int i=0; i<3; i++). Puis essaie i<=3.",
  oop:"Défi : crée deux objets Student avec des prénoms différents et affiche-les.",
  debug:"Défi : enlève un point-virgule, exécute, lis la première erreur, puis corrige."
 },
 "zu-ZA":{
  control:"Inselele: engeza i-TextBox, Button ne-Label. Uma uchofoza, bonisa igama ku-Label.",
  event:"Inselele: i-Click handler mayiguqule umbhalo we-Label ube 'Saved!'. Yihlole kabili.",
  validation:"Inselele: hlola u-'27' no-'abc' nge-int.TryParse. Bonisa umlayezo uma kungalungile.",
  loop:"Inselele: qagela u-i ku-for (int i=0; i<3; i++), bese uzama i<=3.",
  oop:"Inselele: dala ama-Student object amabili anamagama ahlukene. Bonisa amagama.",
  debug:"Inselele: susa i-semicolon, sebenzisa ikhodi, funda iphutha lokuqala bese ulilungisa."
 },
 "pt-PT":{
  control:"Desafio: adiciona TextBox, Button e Label. Ao clicar, mostra o nome na Label. Explica Text e (Name).",
  event:"Desafio: faz o evento Click mudar uma Label para 'Guardado!'. Testa duas vezes.",
  validation:"Desafio: usa int.TryParse com '27' e 'abc'. Mostra uma mensagem se falhar.",
  loop:"Desafio: prevê os valores de i em for (int i=0; i<3; i++), depois testa i<=3.",
  oop:"Desafio: cria dois objetos Student com nomes diferentes e mostra os nomes.",
  debug:"Desafio: retira um ponto e vírgula, executa, lê o primeiro erro e corrige."
 },
 "sw-KE":{
  control:"Changamoto: ongeza TextBox, Button na Label. Ukibonyeza, onyesha jina kwenye Label.",
  event:"Changamoto: Click handler ibadilishe Label iwe 'Saved!'. Jaribu mara mbili.",
  validation:"Changamoto: tumia int.TryParse kwa '27' na 'abc'. Onyesha ujumbe wa kosa.",
  loop:"Changamoto: tabiri thamani za i kwa for (int i=0; i<3; i++), kisha jaribu i<=3.",
  oop:"Changamoto: tengeneza Student objects mbili zenye majina tofauti na uzionyeshe.",
  debug:"Changamoto: ondoa semicolon moja, endesha, soma kosa la kwanza kisha rekebisha."
 }
};
export function localizedChallenge(question,language="en-ZA"){
 const topic=teachingTopic(question)||"debug";
 return (PRACTICE[language]||PRACTICE["en-ZA"])[topic];
}

export function localizedLesson(question,language="en-ZA",spicy=false,variation=0){
 const topic=teachingTopic(question);
 if(!topic)return null;
 const locale=LESSONS[topic][language]?language:"en-ZA";
 const jokes=[ROAST[topic][locale],...(MORE_ROASTS[locale]?.[topic]||[])];
 const index=Math.abs(Math.trunc(Number.isFinite(variation)?variation:0))%jokes.length;
 return (spicy?jokes[index]+" ":"")+LESSONS[topic][locale];
}
export function localizedFallback(language="en-ZA"){
 return ({
  "en-ZA":"Tell me which control, line or error you're stuck on. I can teach Labels, Click events, validation, loops, OOP and debugging with examples.",
  "fr-FR":"Dis-moi quel contrôle, quelle ligne ou quelle erreur pose problème. Je peux expliquer les Labels, événements Click, validations, boucles, classes et erreurs.",
  "zu-ZA":"Ngitshele ukuthi yiliphi ithuluzi, umugqa noma iphutha elikukhathazayo. Ngingachaza ama-Label, ama-Click event, ukuhlola okufakwayo, ama-loop nama-class.",
  "pt-PT":"Diz-me qual o controlo, linha ou erro que te está a dificultar. Posso explicar Labels, eventos Click, validação, ciclos, classes e erros.",
  "sw-KE":"Niambie ni kidhibiti, mstari au kosa gani linalokusumbua. Ninaweza kueleza Label, matukio ya Click, uthibitishaji, loops, classes na hitilafu."
 })[language]||"Tell me which line or error needs explaining.";
}

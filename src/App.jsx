import React, { useState, useMemo, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import questions from "./formulaire.json";

function App() {
  const [activeTab, setActiveTab] = useState("Accueil");

  // Liste de tous les profils enregistrés
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem("sdgx_profiles_list");
    return saved ? JSON.parse(saved) : [];
  });

  // État pour l'identité actuelle
  const [muralInfo, setMuralInfo] = useState(() => {
    const saved = localStorage.getItem("sdgx_current_identite");
    return saved ? JSON.parse(saved) : {};
  });

  // Clé unique par mairie pour le questionnaire
  const storageKey = muralInfo["Nom de la commune"] 
    ? `sdgx_answers_${muralInfo["Nom de la commune"].replace(/\s+/g, '_').toLowerCase()}`
    : "sdgx_answers_default";

  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  const [citizenIdeas, setCitizenIdeas] = useState(() => {
    const saved = localStorage.getItem("sdgx_ideas");
    return saved ? JSON.parse(saved) : [];
  });

  const identityFields = {
    "Informations Générales": ["Nom de la commune", "Email officiel", "Code Insee", "Code Postal", "Département", "Région", "Maire actuel", "Nombre d'élus", "Nombre d'agents municipaux"],
    "Démographie": ["Population totale", "Densité (hab/km²)", "Part des -25 ans (%)", "Part des +65 ans (%)", "Nombre de ménages"],
    "Géographie & Urbanisme": ["Superficie totale (ha)", "Surface agricole utile (ha)", "Surface forestière (ha)", "Nombre de logements", "Part de logements sociaux (%)"],
    "Économie & Services": ["Nombre d'entreprises", "Taux de chômage (%)", "Revenu fiscal médian", "Nombre d'écoles", "Équipements sportifs"],
    "Environnement & Énergie": ["Consommation énergétique (MWh)", "Part ENR (%)", "Déchets (t/an)", "Taux de tri (%)", "Linéaire pistes cyclables (km)", "Espaces verts (m²)"]
  };

  const allRequiredFields = Object.values(identityFields).flat();

  // Changer de profil
  const handleSwitchProfile = (profileName) => {
    const allIdentities = JSON.parse(localStorage.getItem("sdgx_all_identities") || "{}");
    if (allIdentities[profileName]) {
      setMuralInfo(allIdentities[profileName]);
    }
  };

  // Créer un nouveau profil vide
  const handleNewProfile = () => {
    if (window.confirm("Créer un nouveau profil vierge ?")) {
      setMuralInfo({});
      setAnswers({});
    }
  };

  // Charger les réponses quand on change de mairie
  useEffect(() => {
    const savedAnswers = localStorage.getItem(storageKey);
    setAnswers(savedAnswers ? JSON.parse(savedAnswers) : {});
  }, [storageKey]);

  // Sauvegarde globale et mise à jour de la liste des profils
  useEffect(() => {
    const name = muralInfo["Nom de la commune"];
    localStorage.setItem("sdgx_current_identite", JSON.stringify(muralInfo));
    localStorage.setItem(storageKey, JSON.stringify(answers));
    localStorage.setItem("sdgx_ideas", JSON.stringify(citizenIdeas));

    if (name && name.trim() !== "") {
      if (!profiles.includes(name)) {
        const newProfiles = [...profiles, name];
        setProfiles(newProfiles);
        localStorage.setItem("sdgx_profiles_list", JSON.stringify(newProfiles));
      }
      const allIdentities = JSON.parse(localStorage.getItem("sdgx_all_identities") || "{}");
      allIdentities[name] = muralInfo;
      localStorage.setItem("sdgx_all_identities", JSON.stringify(allIdentities));
    }
  }, [answers, muralInfo, citizenIdeas, storageKey, profiles]);

  const resetAllData = () => {
    if (window.confirm("Attention : Cela effacera TOUTES les mairies enregistrées. Confirmer ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const isFullyIdentified = useMemo(() => {
    return allRequiredFields.every(field => muralInfo[field] && muralInfo[field].toString().trim() !== "");
  }, [muralInfo, allRequiredFields]);

  const { oddAverages, globalScore, lowPerformingODDs } = useMemo(() => {
    const scores = {};
    const counts = {};
    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer && answer !== 0) {
        q.odds.forEach((odd) => {
          scores[odd] = (scores[odd] || 0) + answer;
          counts[odd] = (counts[odd] || 0) + 1;
        });
      }
    });
    const averages = Object.keys(scores).map((odd) => ({
      odd: `ODD ${odd}`,
      value: Number((scores[odd] / counts[odd]).toFixed(2)),
    }));
    return {
      oddAverages: averages.sort((a, b) => a.odd.localeCompare(b.odd, undefined, {numeric: true})),
      globalScore: averages.length > 0 ? (averages.reduce((acc, item) => acc + item.value, 0) / averages.length).toFixed(2) : 0,
      lowPerformingODDs: averages.filter(item => item.value < 2.5)
    };
  }, [answers]);

  const handleAddIdea = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newIdea = { odd: formData.get("oddSelection"), text: formData.get("ideaText"), date: new Date().toLocaleDateString() };
    setCitizenIdeas([newIdea, ...citizenIdeas]);
    e.target.reset();
  };

  const chartOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "item", formatter: "<strong>{b}</strong><br/>Score : {c} / 4" },
    series: [{
      type: "pie", radius: [40, 150], roseType: "area",
      itemStyle: { borderRadius: 4, borderColor: "#000", borderWidth: 2 },
      label: { show: true, color: "#fff", fontSize: 10 },
      data: oddAverages.map((item) => {
        let color = "#ef4444";
        if (item.value > 1.5) color = "#f97316";
        if (item.value > 2.5) color = "#eab308";
        if (item.value > 3.5) color = "#22c55e";
        return { value: item.value, name: item.odd, itemStyle: { color } };
      }),
    }],
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500">
      <nav className="border-b border-white/10 px-8 py-4 sticky top-0 bg-black/90 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-2xl font-black tracking-tighter text-blue-500 cursor-pointer" onClick={() => setActiveTab("Accueil")}>SDG-X</span>
          <div className="flex gap-6 text-xs font-bold uppercase tracking-widest">
            {["Accueil", "À Propos", "Diagnostic", "Résultats", "Priorités", "Citoyens", "Contact"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "hover:text-blue-400"} pb-1 transition-all`}>{tab}</button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {activeTab === "Accueil" && (
          <div className="text-center py-24 space-y-8 animate-in fade-in duration-1000">
            <h1 className="text-8xl font-black tracking-tighter uppercase leading-none">SDG-X</h1>
            <p className="text-2xl text-slate-400 max-w-2xl mx-auto font-light">Le diagnostic de durabilité pour les collectivités territoriales.</p>
            <div className="flex justify-center gap-6 pt-8">
              <button onClick={() => setActiveTab("Diagnostic")} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-full font-black text-lg transition-all hover:scale-105">DÉMARRER</button>
              <button onClick={resetAllData} className="border border-white/20 hover:bg-white/10 px-12 py-5 rounded-full font-black text-lg transition-all">RÉINITIALISER TOUT</button>
            </div>
          </div>
        )}

        {activeTab === "À Propos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center py-12 animate-in slide-in-from-left-10">
            <div className="space-y-8">
              <h2 className="text-6xl font-black italic underline decoration-blue-500 decoration-8 underline-offset-8 uppercase leading-tight">Notre Engagement</h2>
              <p className="text-xl text-slate-300 leading-relaxed font-light">
                SDG-X transforme les données communales en leviers d'action. En alignant votre stratégie sur les Objectifs de Développement Durable, nous créons ensemble des territoires résilients, inclusifs et respectueux des limites planétaires.
              </p>
              <div className="p-6 bg-slate-900/50 rounded-2xl border border-blue-500/30">
                <p className="text-blue-400 font-bold tracking-widest uppercase text-xs mb-2">Méthodologie</p>
                <p className="text-sm italic text-slate-400">Analyse basée sur les 17 indicateurs de performance des ODD.</p>
              </div>
            </div>
            <div className="rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
              <img src="https://educatif.eedf.fr/wp-content/uploads/sites/157/2021/02/ODD.jpg" alt="ODD Logo" className="w-full opacity-80" />
            </div>
          </div>
        )}

        {activeTab === "Diagnostic" && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/80 p-6 rounded-3xl border border-blue-500/20">
              <div>
                <h3 className="text-blue-500 font-black uppercase text-xs tracking-widest">Gestion des Profils</h3>
                <select 
                  onChange={(e) => handleSwitchProfile(e.target.value)}
                  value={muralInfo["Nom de la commune"] || ""}
                  className="bg-black border border-white/20 p-2 mt-2 rounded-lg text-sm font-bold w-64 outline-none focus:border-blue-500"
                >
                  <option value="">-- Sélectionner une mairie --</option>
                  {profiles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={handleNewProfile} className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-blue-500 hover:text-white transition-all">➕ Nouvelle Mairie</button>
            </div>

            {Object.entries(identityFields).map(([category, fields]) => (
              <div key={category} className="bg-slate-900/40 p-8 rounded-[40px] border border-white/10">
                <h3 className="text-blue-500 font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-2">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fields.map(field => (
                    <div key={field} className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-2">{field}</label>
                      <input 
                        value={muralInfo[field] || ""} 
                        onChange={(e) => setMuralInfo({...muralInfo, [field]: e.target.value})} 
                        className={`bg-black border p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-bold transition-all ${muralInfo[field] ? "border-green-500/30 text-white" : "border-white/10 text-slate-400"}`} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="text-center pt-8 sticky bottom-8">
              <button 
                disabled={!isFullyIdentified} 
                onClick={() => setActiveTab("Questionnaire")} 
                className={`px-12 py-5 rounded-2xl font-black uppercase transition-all shadow-2xl ${isFullyIdentified ? "bg-blue-600 scale-105" : "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"}`}
              >
                {isFullyIdentified ? "Passer au Questionnaire" : `Remplir les ${allRequiredFields.filter(f => !muralInfo[f]).length} champs restants`}
              </button>
            </div>
          </div>
        )}

        {activeTab === "Questionnaire" && (
          <div className="space-y-6">
            <div className="bg-blue-600 p-4 rounded-2xl mb-8 flex justify-between items-center shadow-lg shadow-blue-500/20">
                <p className="text-sm font-black uppercase tracking-widest italic">Collectivité : {muralInfo["Nom de la commune"]}</p>
                <button onClick={() => setActiveTab("Diagnostic")} className="bg-black/20 px-4 py-1 rounded-full text-[10px] font-black hover:bg-black/40 uppercase">Modifier l'identité</button>
            </div>
            {questions.map((q) => (
              <div key={q.id} className="bg-slate-900/40 p-8 rounded-[40px] border border-white/5 hover:border-blue-500/10 transition-all">
                <p className="text-xl font-bold mb-6">{q.id}. {q.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt) => (
                    <label key={opt.val} className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 transition-all ${answers[q.id] === opt.val ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/10" : "bg-black border-white/10 hover:border-white/20"}`}>
                      <input type="radio" checked={answers[q.id] === opt.val} onChange={() => setAnswers({...answers, [q.id]: opt.val})} />
                      <span className="text-sm font-bold uppercase">{opt.text.startsWith("X ") ? opt.text.substring(2) : opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setActiveTab("Résultats")} className="w-full bg-blue-600 p-6 rounded-2xl font-black uppercase mt-10 shadow-xl shadow-blue-500/20 hover:scale-[1.01] transition-all">Calculer les résultats</button>
          </div>
        )}

        {activeTab === "Résultats" && (
           <div className="space-y-12 animate-in slide-in-from-bottom-10">
             <div className="flex justify-between items-end border-b border-white/10 pb-8 uppercase">
               <h2 className="text-6xl font-black italic underline decoration-blue-500 underline-offset-8 leading-tight">Rapport : {muralInfo["Nom de la commune"]}</h2>
               <button onClick={() => window.print()} className="bg-white text-black px-8 py-3 rounded-xl font-black uppercase hover:bg-blue-500 hover:text-white transition-all">Export PDF</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 bg-blue-600 p-16 rounded-[50px] flex flex-col items-center justify-center border border-white/20 shadow-2xl">
                 <div className="text-9xl font-black leading-none">{globalScore}</div>
                 <span className="text-2xl font-bold">/ 4.0</span>
               </div>
               <div className="lg:col-span-2 bg-slate-900/50 rounded-[50px] p-8 border border-white/10">
                 <ReactECharts option={chartOption} style={{ height: "550px" }} />
               </div>
             </div>
           </div>
        )}

        {activeTab === "Priorités" && (
          <div className="space-y-8">
            <h2 className="text-5xl font-black italic uppercase underline decoration-blue-500">Priorités stratégiques</h2>
            <div className="grid gap-6">
              {lowPerformingODDs.map(item => (
                <div key={item.odd} className="bg-slate-900/80 p-8 rounded-[30px] border-l-[12px] border-blue-600 flex justify-between items-center shadow-lg">
                  <div className="space-y-2">
                    <div className="text-4xl font-black text-blue-600/40 italic uppercase leading-none">{item.odd}</div>
                    <p className="text-lg font-bold text-slate-200">Cet objectif nécessite une révision immédiate de vos politiques publiques afin de garantir leur conformité avec les ODD.</p>
                  </div>
                  <div className="text-right shrink-0 ml-8">
                    <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Score</p>
                    <p className="text-3xl font-black">{item.value} / 4</p>
                  </div>
                </div>
              ))}
              {lowPerformingODDs.length === 0 && <p className="text-center py-20 italic opacity-50">Aucun ODD sous la barre critique de 2.5.</p>}
            </div>
          </div>
        )}

        {activeTab === "Citoyens" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 animate-in fade-in">
             <div className="lg:col-span-1 bg-slate-900/80 p-8 rounded-[40px] border border-white/10 h-fit sticky top-32 shadow-xl">
                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-blue-500">Proposer une idée</h3>
                <form onSubmit={handleAddIdea} className="space-y-4">
                  <select name="oddSelection" className="w-full bg-black border border-white/20 p-4 rounded-xl text-white font-bold outline-none focus:border-blue-500" required>
                    <option value="">Choisir un ODD...</option>
                    {oddAverages.map(item => <option key={item.odd} value={item.odd}>{item.odd}</option>)}
                  </select>
                  <textarea name="ideaText" placeholder="Proposition citoyenne..." rows="6" className="w-full bg-black border border-white/20 p-4 rounded-xl text-white outline-none focus:border-blue-500" required></textarea>
                  <button type="submit" className="w-full bg-blue-600 p-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">Publier sur le mur</button>
                </form>
             </div>
             <div className="lg:col-span-2 space-y-6">
                <h3 className="text-2xl font-black uppercase italic border-b border-white/10 pb-4 tracking-tighter">Boîte à idées communautaire</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {citizenIdeas.map((idea, idx) => (
                    <div key={idx} className="bg-white text-black p-6 rounded-3xl flex flex-col justify-between shadow-xl hover:scale-[1.02] transition-all">
                      <p className="font-bold leading-tight mb-4 italic text-lg">"{idea.text}"</p>
                      <div className="flex justify-between items-center mt-4">
                         <span className="bg-blue-600 text-white px-2 py-1 rounded text-[8px] font-black uppercase">{idea.odd}</span>
                         <span className="text-[8px] font-black text-slate-400 uppercase">Le {idea.date}</span>
                      </div>
                    </div>
                  ))}
                  {citizenIdeas.length === 0 && <div className="col-span-2 text-center py-20 border border-dashed border-white/10 rounded-3xl opacity-30 italic font-light">Aucune idée partagée pour le moment.</div>}
                </div>
             </div>
          </div>
        )}

        {/* SECTION CONTACT CONNECTÉE Àvotre FORMSPREE */}
        {activeTab === "Contact" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 py-12 items-center animate-in fade-in">
            <div className="space-y-8">
              <h2 className="text-7xl font-black uppercase italic underline decoration-blue-500 leading-tight">Contact</h2>
              <div className="space-y-4">
                 <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Destination : Luis Martinez Lopez</p>
                 <p className="text-slate-500 text-xl font-light italic leading-relaxed">Une question ? Un besoin d'accompagnement spécifique ? Notre équipe vous répond sous 48h.</p>
              </div>
            </div>
            <form action="https://formspree.io/f/xwvnldkr" method="POST" className="bg-slate-900/50 p-12 rounded-[50px] border border-white/10 space-y-4 shadow-2xl">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest">Nom complet</label>
                 <input type="text" name="name" required placeholder="NOM COMPLET" className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest">Votre E-mail</label>
                 <input type="email" name="email" required placeholder="EMAIL@EXEMPLE.COM" className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-blue-500 uppercase ml-2 tracking-widest">Message</label>
                 <textarea name="message" required placeholder="COMMENT POUVONS-NOUS VOUS AIDER ?" rows="5" className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-blue-500 font-bold"></textarea>
              </div>
              <input type="hidden" name="_subject" value="Nouveau message depuis la plateforme SDG-X" />
              <button type="submit" className="w-full bg-blue-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">Envoyer le message</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
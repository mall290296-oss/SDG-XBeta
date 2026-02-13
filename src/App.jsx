import React, { useState, useMemo, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import questions from "./formulaire.json";

function App() {
  const [activeTab, setActiveTab] = useState("Accueil");
  const [muralInfo, setMuralInfo] = useState(() => {
    const saved = localStorage.getItem("sdgx_identite");
    return saved ? JSON.parse(saved) : {};
  });
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem("oddAnswers");
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

  useEffect(() => {
    localStorage.setItem("sdgx_identite", JSON.stringify(muralInfo));
    localStorage.setItem("oddAnswers", JSON.stringify(answers));
    localStorage.setItem("sdgx_ideas", JSON.stringify(citizenIdeas));
  }, [answers, muralInfo, citizenIdeas]);

  const resetAllData = () => {
    if (window.confirm("Effacer toutes les données et recommencer ?")) {
      setAnswers({});
      setMuralInfo({});
      setCitizenIdeas([]);
      localStorage.clear();
      setActiveTab("Accueil");
    }
  };

  const isIdentified = muralInfo["Nom de la commune"] && muralInfo["Email officiel"];

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
    const newIdea = {
      odd: formData.get("oddSelection"),
      text: formData.get("ideaText"),
      date: new Date().toLocaleDateString()
    };
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
            <p className="text-2xl text-slate-400 max-w-2xl mx-auto font-light">Le diagnostic de durabilité nouvelle génération pour les collectivités territoriales.</p>
            <div className="flex justify-center gap-6 pt-8">
              <button onClick={() => setActiveTab("Diagnostic")} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-full font-black text-lg transition-all hover:scale-105">DÉMARRER</button>
              <button onClick={resetAllData} className="border border-white/20 hover:bg-white/10 px-12 py-5 rounded-full font-black text-lg transition-all">RÉINITIALISER</button>
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
            {Object.entries(identityFields).map(([category, fields]) => (
              <div key={category} className="bg-slate-900/40 p-8 rounded-[40px] border border-white/10">
                <h3 className="text-blue-500 font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-2">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fields.map(field => (
                    <div key={field} className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-2">{field}</label>
                      <input value={muralInfo[field] || ""} onChange={(e) => setMuralInfo({...muralInfo, [field]: e.target.value})} className="bg-black border border-white/10 p-3 rounded-xl focus:border-blue-500 outline-none text-sm font-bold" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-center pt-8">
              <button disabled={!isIdentified} onClick={() => setActiveTab("Questionnaire")} className={`px-12 py-5 rounded-2xl font-black uppercase ${isIdentified ? "bg-blue-600 shadow-xl" : "bg-slate-800 text-slate-500"}`}>Passer au Questionnaire</button>
            </div>
          </div>
        )}

        {activeTab === "Questionnaire" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase underline decoration-blue-500 mb-10">Formulaire</h2>
            {questions.map((q) => (
              <div key={q.id} className="bg-slate-900/40 p-8 rounded-[40px] border border-white/5">
                <p className="text-xl font-bold mb-6">{q.id}. {q.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt) => (
                    <label key={opt.val} className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 ${answers[q.id] === opt.val ? "bg-blue-600 border-blue-400" : "bg-black border-white/10"}`}>
                      <input type="radio" checked={answers[q.id] === opt.val} onChange={() => setAnswers({...answers, [q.id]: opt.val})} />
                      <span className="text-sm font-bold uppercase">{opt.text.startsWith("X ") ? opt.text.substring(2) : opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setActiveTab("Résultats")} className="w-full bg-blue-600 p-6 rounded-2xl font-black uppercase">Voir les résultats</button>
          </div>
        )}

        {activeTab === "Résultats" && (
           <div className="space-y-12 animate-in slide-in-from-bottom-10">
             <div className="flex justify-between items-end border-b border-white/10 pb-8 uppercase">
               <h2 className="text-6xl font-black italic underline decoration-blue-500 underline-offset-8">Rapport ODD</h2>
               <button onClick={() => window.print()} className="bg-white text-black px-8 py-3 rounded-xl font-black uppercase">Export PDF</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 bg-blue-600 p-16 rounded-[50px] flex flex-col items-center justify-center border border-white/20">
                 <span className="text-xs font-black uppercase mb-4 opacity-70">Maturité</span>
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
          <div className="space-y-8 animate-in fade-in">
            <h2 className="text-5xl font-black italic uppercase underline decoration-blue-500">Analyse des priorités</h2>
            <div className="grid gap-6">
              {lowPerformingODDs.length > 0 ? lowPerformingODDs.map(item => (
                <div key={item.odd} className="bg-slate-900/80 p-8 rounded-[30px] border-l-[12px] border-blue-600 flex justify-between items-center hover:bg-slate-800 transition">
                  <div className="space-y-2">
                    <div className="text-4xl font-black text-blue-600/40 italic uppercase">{item.odd}</div>
                    <p className="text-lg font-bold text-slate-200">Cet objectif nécessite une révision immédiate de vos politiques publiques afin de garantir leur conformité avec les ODD.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-blue-500 font-black text-xs uppercase">Score critique</p>
                    <p className="text-2xl font-black">{item.value} / 4</p>
                  </div>
                </div>
              )) : <p className="text-center italic opacity-50 py-20 bg-slate-900/20 rounded-3xl">Aucune priorité critique détectée.</p>}
            </div>
          </div>
        )}

        {activeTab === "Citoyens" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 animate-in fade-in">
             <div className="lg:col-span-1 bg-slate-900/80 p-8 rounded-[40px] border border-white/10 h-fit sticky top-32">
                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-blue-500">Proposer une idée</h3>
                <form onSubmit={handleAddIdea} className="space-y-4">
                  <select name="oddSelection" className="w-full bg-black border border-white/20 p-4 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white" required>
                    <option value="">Cibler un ODD...</option>
                    {oddAverages.map(item => <option key={item.odd} value={item.odd}>{item.odd}</option>)}
                  </select>
                  <textarea name="ideaText" placeholder="Votre proposition pour la commune..." rows="6" className="w-full bg-black border border-white/20 p-4 rounded-xl outline-none focus:border-blue-500 text-sm text-white" required></textarea>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded-xl font-black uppercase tracking-widest transition-all">Soumettre l'idée</button>
                </form>
             </div>
             <div className="lg:col-span-2 space-y-6">
                <h3 className="text-2xl font-black uppercase italic border-b border-white/10 pb-4">Boîte à idées citoyenne</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {citizenIdeas.length > 0 ? citizenIdeas.map((idea, idx) => (
                    <div key={idx} className="bg-white text-black p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-all">
                      <div>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 inline-block">{idea.odd}</span>
                        <p className="font-bold leading-tight mb-4 italic">"{idea.text}"</p>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 border-t pt-4 uppercase">Publié le {idea.date}</p>
                    </div>
                  )) : <div className="col-span-2 text-center py-20 opacity-30 italic">Aucune idée partagée pour le moment.</div>}
                </div>
             </div>
          </div>
        )}

        {activeTab === "Contact" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 py-12 items-center animate-in fade-in">
            <div className="space-y-12">
              <h2 className="text-7xl font-black tracking-tighter uppercase italic underline decoration-blue-500 underline-offset-8">Contact</h2>
              <div className="space-y-8 text-slate-300">
                <div className="flex items-center gap-8">
                  <span className="text-5xl opacity-40">📍</span>
                  <div><p className="text-xs font-black text-blue-500 uppercase tracking-widest">Siège SDG-X</p><p className="text-2xl font-black">Paris, France</p></div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-5xl opacity-40">✉️</span>
                  <div><p className="text-xs font-black text-blue-500 uppercase tracking-widest">E-mail</p><p className="text-2xl font-black">info@sdg-x.com</p></div>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 p-12 rounded-[50px] border border-white/10 space-y-4">
              <input placeholder="NOM COMPLET" className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-blue-500 font-bold" />
              <input placeholder="E-MAIL" className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-blue-500 font-bold" />
              <textarea placeholder="VOTRE MESSAGE" rows="5" className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-blue-500 font-bold"></textarea>
              <button className="w-full bg-blue-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">Envoyer le message</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;